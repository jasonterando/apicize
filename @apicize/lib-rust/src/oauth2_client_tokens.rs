//! oauth2_client_tokens
//!
//! This module implements OAuth2 client flow support, including support for caching tokens

use std::collections::HashMap;
use std::ops::Add;
use std::time::Instant;

use oauth2::basic::BasicClient;
use oauth2::reqwest;
use oauth2::{ClientId, ClientSecret, Scope, TokenResponse, TokenUrl};
use tokio::sync::Mutex;
use tokio::task::spawn_blocking;

use crate::ExecutionError;

lazy_static! {
    /// Static cache of retrieved OAuth2 client tokens
    static ref OAUTH2_TOKEN_CACHE: Mutex<HashMap<String, (Instant, String)>> =
        Mutex::new(HashMap::new());
}

/// Return cached oauth2 token, with indicator of whether value was cached
pub async fn get_oauth2_client_credentials(
    id: &String,
    token_url: &String,
    client_id: &String,
    client_secret: &String,
    scope: &Option<String>,
) -> Result<(String, bool), ExecutionError> {
    let cloned_id = id.clone();
    let cloned_token_url = token_url.clone();
    let cloned_client_id = client_id.clone();
    let cloned_client_secret = client_secret.clone();
    let cloned_scope = scope.clone();

    // Check cache and return if token found and not expired
    let mut tokens = OAUTH2_TOKEN_CACHE.lock().await;
    let valid_token = match tokens.get(&cloned_id) {
        Some(existing) => {
            if existing.0.gt(&Instant::now()) {
                Some(existing.1.clone())
            } else {
                None
            }
        }
        None => None,
    };

    if let Some(token) = valid_token {
        return Ok((token, true));
    }

    // We have to create a blocked span when using oauth because some error types 
    // in oauth2 library dependencies do not implement Copy
    match spawn_blocking(move || {
        // Retrieve an access token
        let mut client = BasicClient::new(ClientId::new(cloned_client_id))
            .set_token_uri(
                TokenUrl::new(cloned_token_url).expect("Unable to parse OAuth token URL"),
            );

        if ! cloned_client_secret.trim().is_empty() {
            client = client.set_client_secret(ClientSecret::new(cloned_client_secret));
        }

        let mut token_request = client.exchange_client_credentials();
        if let Some(scope_value) = cloned_scope {
            token_request = token_request.add_scope(Scope::new(scope_value.clone()));
        }

        let http_client = reqwest::blocking::ClientBuilder::new()
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .expect("Unable to build OAuth HTTP client");

        token_request.request(&http_client)
    })
    .await
    {
        Ok(token_result) => {
            match token_result {
                Ok(token_response) => {
                    let expiration = match token_response.expires_in() {
                        Some(token_expires_in) => Instant::now().add(token_expires_in),
                        None => Instant::now(),
                    };
                    let token = token_response.access_token().secret().clone();
                    tokens.insert(cloned_id, (expiration, token.clone()));
                    Ok((token, false))
                }
                Err(err) => Err(ExecutionError::OAuth2(err)),
            }
        },
        Err(err) => Err(ExecutionError::Join(err)),
    }
}

/// Clear all cached OAuth2 tokens
pub async fn clear_all_oauth2_tokens() -> usize {
    let mut cache = OAUTH2_TOKEN_CACHE.lock().await;
    let count = cache.len();
    cache.clear();
    count
}

/// Clear specified cached OAuth2 credentials, returning true if value was cached
pub async fn clear_oauth2_token(id: String) -> bool {
    OAUTH2_TOKEN_CACHE.lock().await.remove(&id).is_some()
}
