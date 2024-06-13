// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#[macro_use]
extern crate lazy_static;

use std::collections::HashMap;
use tokio_util::sync::CancellationToken;

use apicize_lib::{
    models::{
        ApicizeResultRuns, Workbook, WorkbookAuthorization, WorkbookRequestEntry, WorkbookScenario,
    },
    oauth2_client_tokens::{clear_all_oauth2_tokens, clear_oauth2_token},
};
use tauri::{async_runtime::Mutex, Manager};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard::init())
        .invoke_handler(tauri::generate_handler![
            open_workbook,
            save_workbook,
            run_request,
            cancel_request,
            clear_cached_authorization,
            get_environment_variables
        ])
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        // .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

                let ctrl_n_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyN);
                let ctrl_o_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyO);
                let ctrl_s_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyS);
                let ctrl_shift_s_shortcut =
                    Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyS);

                let handle = app.handle().clone();
                let shortcut_builder = tauri_plugin_global_shortcut::Builder::new();
                app.handle().plugin(
                    shortcut_builder
                        .with_handler(move |_app, shortcut, _event| {
                            let focused = _app.get_window("main").unwrap().is_focused().unwrap();
                            if focused {
                                if shortcut == &ctrl_n_shortcut {
                                    handle.emit("action", "new").unwrap()
                                } else if shortcut == &ctrl_o_shortcut {
                                    handle.emit("action", "open").unwrap()
                                } else if shortcut == &ctrl_s_shortcut {
                                    handle.emit("action", "save").unwrap()
                                } else if shortcut == &ctrl_shift_s_shortcut {
                                    handle.emit("action", "saveAs").unwrap()
                                }
                            }
                        })
                        .build(),
                )?;

                app.global_shortcut().register(ctrl_n_shortcut)?;
                app.global_shortcut().register(ctrl_o_shortcut)?;
                app.global_shortcut().register(ctrl_s_shortcut)?;
                app.global_shortcut().register(ctrl_shift_s_shortcut)?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error running Apicize");
}

#[tauri::command]
async fn open_workbook(path: String) -> Result<Workbook, String> {
    match Workbook::open(&path) {
        Ok(result) => {
            clear_all_oauth2_tokens().await;
            Ok(result)
        }
        Err(err) => Err(format!("{}", err)),
    }
}

#[tauri::command]
fn save_workbook(workbook: Workbook, path: String) -> Result<(), String> {
    match Workbook::save(workbook, &path) {
        Ok(()) => Ok(()),
        Err(err) => Err(format!("{}", err)),
    }
}

lazy_static! {
    static ref CANCELLATION_TOKENS: Mutex<HashMap<String, CancellationToken>> =
        Mutex::new(HashMap::new());
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
        WorkbookRequestEntry::Group(group) => group.id.clone(),
    };
    {
        let mut tokens = CANCELLATION_TOKENS.lock().await;
        tokens.insert(id.clone(), cancellation.clone());
    }

    let result = match request
        .run(&authorization, &scenario, Some(cancellation))
        .await
    {
        Ok(response) => Ok(response),
        Err(err) => Err(format!("{}", err)),
    };
    {
        let mut tokens = CANCELLATION_TOKENS.lock().await;
        tokens.remove(&id.clone());
    }
    result
}

#[tauri::command]
async fn cancel_request(id: String) {
    let tokens = CANCELLATION_TOKENS.lock().await;
    let token = tokens.get(&id);
    if token.is_some() {
        token.unwrap().cancel()
    }
}

#[tauri::command]
async fn clear_cached_authorization(authorization_id: String) -> bool {
    clear_oauth2_token(authorization_id).await
}

#[tauri::command]
fn get_environment_variables() -> Vec<(String, String)> {
    std::env::vars().into_iter().map(|e| e).collect()
}
