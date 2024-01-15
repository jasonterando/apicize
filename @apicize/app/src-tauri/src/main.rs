// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;

use apicize_lib::{
    models::{
        Workbook, WorkbookAuthorization,
        WorkbookEnvironment, WorkbookRequestEntry, ApicizeResult,
    },
    FileSystem, Runnable,
};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_workbook, save_workbook, run_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn open_workbook(path: String) -> Result<Workbook, String> {
    match Workbook::open_from_path(&path) {
        Ok(result) => Ok(result),
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

#[tauri::command]
async fn run_request(
    request: WorkbookRequestEntry,
    authorization: Option<WorkbookAuthorization>,
    environment: Option<WorkbookEnvironment>,
) -> HashMap<String, ApicizeResult> {
    request.run(authorization, environment).await
}
