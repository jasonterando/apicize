//! Apicize models
//! 
//! This module implements OAuth2 client flow support

use std::collections::HashMap;
use std::ops::Add;
use std::time::Instant;

use oauth2::reqwest::async_http_client;
use oauth2::{ClientId, ClientSecret, AuthUrl, Scope, TokenResponse, TokenUrl};
use oauth2::basic::BasicClient;
use tokio::sync::Mutex;

use crate::ExecutionError;

/// Retrieve OAuth2 credentials from token URL, returning a result of either tuple of
/// expiration of seconds after the Unic epoch (if none = 0) and bearer token, or an error
async fn fetch_oauth2_credentials(
    token_url: String,
    client_id: String,
    client_secret: String,
    scope: Option<String>) -> Result<(Instant, String), ExecutionError> {
    let client = BasicClient::new(
        ClientId::new(client_id),
        if client_secret.is_empty() {
            None
        } else {
            Some(ClientSecret::new(client_secret))
        },
        AuthUrl::new(token_url.clone()).unwrap(),
        Some(TokenUrl::new(token_url).unwrap()),
    );

    let mut token_request = client.exchange_client_credentials();
    if scope.is_some() {
        token_request = token_request.add_scope(Scope::new(scope.unwrap()));
    }
    let token_result = token_request.request_async(async_http_client).await;

    match token_result {
        Ok(token) => {
            let expiration = match token.expires_in() {
                Some(token_expires_in) => Instant::now().add(token_expires_in),
                None => Instant::now()
            };
            Ok((expiration, token.access_token().secret().clone()))
        },
        Err(err) => {
            Err(ExecutionError::OAuth2(err))
        }
    }

}

/// Return cached oauth2 credentials, or retrieve them from cache
pub async fn oauth2_client_credentials(
    name: String,
    token_url: String,
    client_id: String,
    client_secret: String,
    scope: Option<String>) -> Result<String, ExecutionError> {
    
    lazy_static! {
        static ref OAUTH2_CLIENT_TOKENS: Mutex<HashMap<String, (Instant, String)>> = Mutex::new(HashMap::new());
    }

    let mut tokens = OAUTH2_CLIENT_TOKENS.lock().await;
    let valid_token = match tokens.get(&name) {
        Some(existing) => {
            if existing.0.gt(& Instant::now()) {
                Some(existing.1.clone())
            } else {
                None
            }
        },
        None => None
    };
    
    match valid_token {
        Some(token) => Ok(token),
        None => {
            let retrieved = fetch_oauth2_credentials(token_url, client_id, client_secret, scope).await?;
            tokens.insert(name, retrieved.clone());
            Ok(retrieved.1)
        }
    }
}
