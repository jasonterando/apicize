// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#[macro_use]
extern crate lazy_static;

use std::collections::HashMap;
use tokio_util::sync::CancellationToken;

use apicize_lib::{
    models::{
        ApicizeResultRuns, Workbook, WorkbookAuthorization, WorkbookRequestEntry, WorkbookScenario 
    },
    FileSystem, Runnable, oauth2::{clear_oauth2_token, clear_all_oauth2_tokens},
};
use tauri::async_runtime::Mutex;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard::init())
        .invoke_handler(tauri::generate_handler![open_workbook, save_workbook, run_request, cancel_request, clear_cached_authorization])
        .run(tauri::generate_context!())
        .expect("error running Apicize");
}

#[tauri::command]
async fn open_workbook(path: String) -> Result<Workbook, String> {
    match Workbook::open_from_path(&path) {
        Ok(result) => {
            clear_all_oauth2_tokens().await;
            Ok(result)
        },
        Err(err) => Err(format!("{}", err)),
    }
}

#[tauri::command]
fn save_workbook(workbook: Workbook, path: String) -> Result<(), String> {
    match Workbook::save_to_path(&workbook, &path) {
        Ok(()) => Ok(()),
        Err(err) => Err(format!("{}", err)),
    }
}

lazy_static! {
    static ref CANCELLATION_TOKENS: Mutex<HashMap<String, CancellationToken>> = Mutex::new(HashMap::new());
}

#[tauri::command]
async fn run_request(
    request: WorkbookRequestEntry,
    authorization: Option<WorkbookAuthorization>,
    scenario: Option<WorkbookScenario>,
) -> Result<ApicizeResultRuns, String> {
    let cancellation = CancellationToken::new();
    let id = match &request {
        WorkbookRequestEntry::Info(info) => info.id.clone(),
        WorkbookRequestEntry::Group(group) => group.id.clone()
    };
    {
        let mut tokens = CANCELLATION_TOKENS.lock().await;
        tokens.insert(id.clone(), cancellation.clone());
    }
    let result = match request.run(authorization, scenario, Some(cancellation)).await {
        Ok(response) => Ok(response),
        Err(err) => Err(format!("{}", err))
    };
    {
        let mut tokens = CANCELLATION_TOKENS.lock().await;
        tokens.remove(& id.clone());
    }
    result
}

#[tauri::command]
async fn cancel_request(
    request: WorkbookRequestEntry
) {
    let tokens = CANCELLATION_TOKENS.lock().await;
    let id = match &request {
        WorkbookRequestEntry::Info(info) => info.id.clone(),
        WorkbookRequestEntry::Group(group) => group.id.clone()
    };
    let token = tokens.get(&id);
    if token.is_some() {
        token.unwrap().cancel()
    }
}

#[tauri::command]
async fn clear_cached_authorization(
    authorization: WorkbookAuthorization
) -> Option<bool> {
    match authorization {
        WorkbookAuthorization::OAuth2Client { id, name: _, access_token_url: _, client_id: _, client_secret: _, scope: _ } => 
            Some(clear_oauth2_token(id).await),
        _ => None
    }
}
