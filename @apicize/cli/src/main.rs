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

    // initialize_v8();
    let auth: Option<WorkbookAuthorization> = match workbook.authorizations {
        Some(auths) => match auths.first() {
            Some(auth) => Some(auth.clone()),
            None => None,
        },
        None => None,
    };

    let scene: Option<WorkbookScenario> = match workbook.scenarios {
        Some(ref scenes) => match scenes.first() {
            Some(scene) => Some(scene.clone()),
            None => None,
        },
        None => None,
    };

    let mut pass_count = 0;
    let mut fail_count = 0;
    let mut iter = workbook.requests.iter();

    while let Some(r) = iter.next() {
        // println!("Request: {}", r);
        let run_response = run(&r.clone(), &auth, &scene, None).await;
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
