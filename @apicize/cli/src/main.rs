use apicize_lib;
use apicize_lib::cleanup_v8;
use apicize_lib::models::Workbook;
use apicize_lib::models::WorkbookAuthorization;
use apicize_lib::models::WorkbookScenario;
use apicize_lib::run;
use apicize_lib::FileSystem;
use std::env;
use std::process;

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() != 2 {
        println!("Usage: (Input File Name)");
        process::exit(-1);
    }

    let file_name = &args[1];
    let result = Workbook::open_from_path(file_name);

    if result.is_err() {
        println!("Unable to read {}: {}", file_name, result.unwrap_err());
        process::exit(-2);
    }

    let workbook = result.unwrap();

    let mut selected_authorization: Option<WorkbookAuthorization> = None;
    let mut selected_scenario: Option<WorkbookScenario> = None;

    if let Some(settings) = workbook.settings {
        if let Some(selected_id) = settings.selected_authorization_id {
            if let Some(auths) = workbook.authorizations {
                if let Some(selected) = auths.iter().find(|x| 
                    match x {
                        WorkbookAuthorization::Basic { id, name: _, username: _, password: _ } => *id == selected_id,
                        WorkbookAuthorization::ApiKey { id , name: _, header: _, value: _ } => *id == selected_id,
                        WorkbookAuthorization::OAuth2Client { id, name: _, access_token_url: _, client_id: _, client_secret: _, scope: _ } => *id == selected_id,
                    }
                ) {
                    selected_authorization = Some(selected.clone());
                }
            }
        }

        if let Some(selected_id) = settings.selected_scenario_id {
            if let Some(scenarios) = workbook.scenarios {
                if let Some(selected) = scenarios.iter().find(|x| x.id == selected_id) {
                    selected_scenario = Some(selected.clone());
                }
            }
        }
    }

    // initialize_v8();

    let mut pass_count = 0;
    let mut fail_count = 0;
    let mut iter = workbook.requests.iter();

    while let Some(r) = iter.next() {
        // println!("Request: {}", r);
        let run_response = run(&r.clone(), &selected_authorization, &selected_scenario, None).await;
        match run_response {
            Ok(runs) => {
                let mut run_number = 0;
                let total_runs = runs.len();
                runs.iter().for_each(|run| {
                    if total_runs > 1 {
                        run_number = run_number + 1;
                        println!("Run {} of {}", run_number, total_runs);
                    }

                    run.iter().for_each(|result| {
                        if result.success {
                            match &result.tests {
                                Some(tests) => {
                                    // let r = response.as_ref().unwrap();
                                    // println!("{}", serde_json::to_string(r).unwrap());
                                    tests.iter().for_each(|tr| {
                                        if tr.success {
                                            println!(" - {} [PASS]", tr.test_name.join(" "));
                                            pass_count += 1;
                                        } else {
                                            println!(
                                                " - {} [FAIL] {}",
                                                tr.test_name.join(", "),
                                                tr.error.as_ref().unwrap_or(&String::from("Unknown Error"))
                                            );
                                            fail_count += 1;
                                        }
                                    })
                                }
                                None => {}
                            }
                        } else {
                            println!(" - [ERROR] {}", match &result.error_message {
                                Some(msg) => msg.clone(),
                                None => String::from("Unexpected Error")
                            });
                        }
                    })
                });        
            }
            Err(err) => {
                println!(" - [ERROR] {}", err);
            }
        }
    }

    println!("Totals - Pass: {}, Fail: {}", pass_count, fail_count);

    cleanup_v8();
    process::exit(fail_count);
}
