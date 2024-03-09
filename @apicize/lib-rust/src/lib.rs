#![warn(missing_docs)]
//! Apicize test routine persistence and execution.
//!
//! This library supports the opening, saving and dispatching Apicize functional web tests

#[macro_use]
extern crate lazy_static;

pub mod models;
pub mod oauth2_client_tokens;

use async_recursion::async_recursion;
use async_trait::async_trait;
use encoding_rs::{Encoding, UTF_8};
use mime::Mime;
use reqwest::{Body, Client};
use std::fs;
use std::sync::Once;
use std::time::{Duration, SystemTime};
use std::{collections::HashMap, vec};
use tokio::select;
use tokio::task::JoinSet;
use tokio_util::sync::CancellationToken;

use models::{
    ApicizeBody, ApicizeRequest, ApicizeResponse, ApicizeResult, ApicizeResultRuns,
    ApicizeTestResponse, ExecutionError, RunError, SerializationError, Workbook,
    WorkbookAuthorization, WorkbookRequest, WorkbookRequestBody, WorkbookRequestEntry,
    WorkbookRequestMethod, WorkbookScenario,
};

use oauth2_client_tokens::get_oauth2_client_credentials;

static V8_INIT: Once = Once::new();

/// Cleanup V8 platform, should only be called once at end of application
pub fn cleanup_v8() {
    unsafe {
        v8::V8::dispose();
    }
    v8::V8::dispose_platform();
}

/// Trait defining file system persistence for Apicize Workbooks
pub trait FileSystem<T> {
    /// Open an Apicize workbook from the specified path
    fn open_from_path(path: &String) -> Result<T, SerializationError>;
    /// Save an Apicize workbook to the specified path
    fn save_to_path(&self, path: &String) -> Result<(), SerializationError>;
}

/// Trait for JSON serialization methods for Workbooks
pub trait Serializable<T> {
    /// Deserialize an Apicize Workbook from the specified JSON text
    fn deserialize(text: String) -> Result<T, serde_json::Error>;
    /// Serialize the specified Apicize Workbook to JSON text
    fn serialize(&self) -> Result<String, serde_json::Error>;
}

/// Trait for running Apicize Requests (dispatch and test)
#[async_trait]
pub trait Runnable {
    /// Dispatch the associated Apicize Request (dispatching the web call and executing defined  tests, if any)
    async fn run<'a>(
        &self,
        authorization: &'a Option<WorkbookAuthorization>,
        scenario: &'a Option<WorkbookScenario>,
        cancellation: Option<CancellationToken>,
    ) -> Result<ApicizeResultRuns, RunError>;
}

impl Serializable<Workbook> for Workbook {
    /// Deserialize workbook from text
    fn deserialize(text: String) -> Result<Workbook, serde_json::Error> {
        serde_json::from_str(text.as_str())
    }

    /// Serialize workbook to text
    fn serialize(self: &Workbook) -> Result<String, serde_json::Error> {
        serde_json::to_string(self)
    }
}

impl FileSystem<Workbook> for Workbook {
    // Open from specified path
    fn open_from_path(path: &String) -> Result<Workbook, SerializationError> {
        Ok(Workbook::deserialize(fs::read_to_string(path)?)?)
    }

    /// Save to specified path
    fn save_to_path(&self, path: &String) -> Result<(), SerializationError> {
        Ok(fs::write(path, self.serialize()?)?)
    }
}

/// Utility function to perform string substitution based upon search/replace values in "subs"
fn clone_and_sub(text: &str, subs: &Vec<(String, String)>) -> String {
    if subs.is_empty() {
        text.to_string()
    } else {
        let mut clone = text.to_string();
        let mut i = subs.iter();
        while let Some(pair) = i.next() {
            clone = str::replace(&clone, &pair.0, &pair.1)
        }
        clone
    }
}

/// Dispatch the specified request (via reqwest), returning either the repsonse or error
async fn dispatch<'a>(
    request: &WorkbookRequest,
    authorization: &'a Option<WorkbookAuthorization>,
    scenario: &'a Option<WorkbookScenario>,
) -> Result<(ApicizeRequest, ApicizeResponse), ExecutionError> {
    let method: reqwest::Method;
    match request.method {
        Some(WorkbookRequestMethod::Get) => method = reqwest::Method::GET,
        Some(WorkbookRequestMethod::Post) => method = reqwest::Method::POST,
        Some(WorkbookRequestMethod::Put) => method = reqwest::Method::PUT,
        Some(WorkbookRequestMethod::Delete) => method = reqwest::Method::DELETE,
        Some(WorkbookRequestMethod::Head) => method = reqwest::Method::HEAD,
        Some(WorkbookRequestMethod::Options) => method = reqwest::Method::OPTIONS,
        None => method = reqwest::Method::GET,
        _ => panic!("Invalid method \"{:?}\"", request.method),
    }

    let timeout: Duration;
    if let Some(t) = request.timeout {
        timeout = Duration::from_millis(t as u64);
    } else {
        timeout = Duration::from_secs(30);
    }

    // let keep_alive: bool;
    // if let Some(b) = request.keep_alive {
    //     keep_alive = b;
    // } else {
    //     keep_alive = true;
    // }

    let subs: Vec<(String, String)>;

    match scenario {
        Some(active_scenario) => {
            match &active_scenario.variables {
                Some(pairs) => {
                    subs = pairs
                        .iter()
                        .filter(|pair| pair.disabled != Some(true))
                        .map(|pair| {
                            // (pair.name.as_str(), pair.value.as_str())
                            (format!("{{{{{}}}}}", pair.name), pair.value.clone())
                        })
                        .collect::<Vec<(String, String)>>()
                }
                None => subs = vec![],
            }
        }
        None => subs = vec![],
    }

    // Build the reqwest client and request
    let client = Client::builder()
        // .http2_keep_alive_while_idle(keep_alive)
        .timeout(timeout)
        .build()?;

    let mut request_builder =
        client.request(method.clone(), clone_and_sub(request.url.as_str(), &subs));

    // Add headers, including authorization if applicable
    let mut headers = reqwest::header::HeaderMap::new();
    if let Some(h) = &request.headers {
        for nvp in h {
            if nvp.disabled != Some(true) {
                headers.insert(
                    reqwest::header::HeaderName::try_from(clone_and_sub(&nvp.name, &subs)).unwrap(),
                    reqwest::header::HeaderValue::try_from(clone_and_sub(&nvp.value, &subs))
                        .unwrap(),
                );
            }
        }
    }

    let mut auth_token_cached: Option<bool> = None;
    match authorization {
        Some(WorkbookAuthorization::Basic {
            id: _,
            name: _,
            username,
            password,
        }) => {
            request_builder = request_builder.basic_auth(username, Some(password));
        }
        Some(WorkbookAuthorization::ApiKey {
            id: _,
            name: _,
            header,
            value,
        }) => {
            headers.append(
                reqwest::header::HeaderName::try_from(header).unwrap(),
                reqwest::header::HeaderValue::try_from(value).unwrap(),
            );
        }
        Some(WorkbookAuthorization::OAuth2Client {
            id,
            name: _,
            access_token_url,
            client_id,
            client_secret,
            scope, // send_credentials_in_body: _,
        }) => {
            match get_oauth2_client_credentials(
                id,
                access_token_url,
                client_id,
                client_secret,
                scope,
            )
            .await
            {
                Ok((token, cached)) => {
                    auth_token_cached = Some(cached);
                    request_builder = request_builder.bearer_auth(token);
                }
                Err(err) => return Err(err),
            }
        }
        None => {}
    }

    if !headers.is_empty() {
        request_builder = request_builder.headers(headers);
    }

    // Add query string parameters, if applicable
    if let Some(q) = &request.query_string_params {
        let mut query: Vec<(String, String)> = vec![];
        for nvp in q {
            if nvp.disabled != Some(true) {
                query.push((
                    clone_and_sub(&nvp.name, &subs),
                    clone_and_sub(&nvp.value, &subs),
                ));
            }
        }
        request_builder = request_builder.query(&query);
    }

    // Add body, if applicable
    match &request.body {
        Some(WorkbookRequestBody::Text { data }) => {
            let s = clone_and_sub(&data, &subs);
            request_builder = request_builder.body(Body::from(s.clone()));
        }
        Some(WorkbookRequestBody::JSON { data }) => {
            let s = clone_and_sub(serde_json::to_string(&data).unwrap().as_str(), &subs);
            request_builder = request_builder.body(Body::from(s.clone()));
        }
        Some(WorkbookRequestBody::XML { data }) => {
            let s = clone_and_sub(&data, &subs);
            request_builder = request_builder.body(Body::from(s.clone()));
        }
        Some(WorkbookRequestBody::Form { data }) => {
            let form_data = data
                .iter()
                .map(|pair| {
                    (
                        String::from(pair.name.as_str()),
                        String::from(pair.value.as_str()),
                    )
                })
                .collect::<HashMap<String, String>>();
            request_builder = request_builder.form(&form_data);
        }
        Some(WorkbookRequestBody::Raw { data }) => {
            request_builder = request_builder.body(Body::from(data.clone()));
        }
        None => {}
    }

    let mut web_request = request_builder.build()?;

    // Copy value generated for the request so that we can include in the function results
    let request_url = web_request.url().to_string();
    let request_headers = web_request
        .headers()
        .iter()
        .map(|(h, v)| {
            (
                String::from(h.as_str()),
                String::from(v.to_str().unwrap_or("(Header Contains Non-ASCII Data)")),
            )
        })
        .collect::<HashMap<String, String>>();
    let request_body: Option<ApicizeBody>;
    let ref_body = web_request.body_mut();
    match ref_body {
        Some(data) => {
            let bytes = data.as_bytes().unwrap();
            if bytes.len() > 0 {
                let request_encoding = UTF_8;

                let data = bytes.to_vec();
                let (decoded, _, malformed) = request_encoding.decode(&data);
                request_body = Some(ApicizeBody {
                    data: Some(data.clone()),
                    text: if malformed {
                        None
                    } else {
                        Some(decoded.to_string())
                    },
                })
            } else {
                request_body = None;
            }
        }
        None => {
            request_body = None;
        }
    }

    // Execute the request
    let client_response = client.execute(web_request).await;
    match client_response {
        Err(error) => return Err(ExecutionError::Reqwest(error)),
        Ok(response) => {
            // Collect headers for response
            let response_headers = response.headers();
            let headers: Option<HashMap<String, String>>;
            if response_headers.is_empty() {
                headers = None;
            } else {
                headers = Some(HashMap::from_iter(
                    response_headers
                        .iter()
                        .map(|(h, v)| {
                            (
                                String::from(h.as_str()),
                                String::from(
                                    v.to_str().unwrap_or("(Header Contains Non-ASCII Data)"),
                                ),
                            )
                        })
                        .collect::<HashMap<String, String>>(),
                ));
            }

            // Determine the default text encoding
            let response_content_type = response_headers
                .get(reqwest::header::CONTENT_TYPE)
                .and_then(|value| value.to_str().ok())
                .and_then(|value| value.parse::<Mime>().ok());

            let response_encoding_name = response_content_type
                .as_ref()
                .and_then(|mime| mime.get_param("charset").map(|charset| charset.as_str()))
                .unwrap_or("utf-8");

            let response_encoding =
                Encoding::for_label(response_encoding_name.as_bytes()).unwrap_or(UTF_8);

            // Collect status for response
            let status = response.status();
            let status_text = String::from(status.canonical_reason().unwrap_or("Unknown"));

            // Retrieve response bytes and convert raw data to string
            let bytes = response.bytes().await?;

            let response_body: Option<ApicizeBody>;
            if bytes.len() > 0 {
                let data = Vec::from(bytes.as_ref());
                let (decoded, _, malformed) = response_encoding.decode(&data);

                response_body = Some(ApicizeBody {
                    data: Some(data.clone()),
                    text: if malformed {
                        None
                    } else {
                        Some(decoded.to_string())
                    },
                });
            } else {
                response_body = None;
            }

            return Ok((
                ApicizeRequest {
                    url: request_url,
                    method: request.method.as_ref().unwrap().as_str().to_string(),
                    headers: request_headers,
                    body: request_body,
                },
                ApicizeResponse {
                    status: status.as_u16(),
                    status_text,
                    headers,
                    body: response_body,
                    auth_token_cached,
                },
            ));
        }
    }
}

fn execute_test<'a>(
    request: &'a WorkbookRequest,
    response: &'a ApicizeResponse,
    scenario: &'a Option<WorkbookScenario>,
) -> Result<Option<ApicizeTestResponse>, ExecutionError> {
    // Create a new Isolate and make it the current one.
    let isolate = &mut v8::Isolate::new(v8::CreateParams::default());

    // Create a stack-allocated handle scope.
    let scope = &mut v8::HandleScope::new(isolate);
    let context = v8::Context::new(scope);
    let scope = &mut v8::ContextScope::new(scope, context);

    let mut init_code = String::new();
    init_code.push_str(include_str!("./static/framework.min.js"));
    init_code.push_str(include_str!("./static/routines.js"));

    // Compile the source code
    let v8_code = v8::String::new(scope, &init_code).unwrap();
    let script = v8::Script::compile(scope, v8_code, None).unwrap();
    script.run(scope).unwrap();

    let tc = &mut v8::TryCatch::new(scope);

    // Return empty test results if no test
    if let None = request.test {
        return Ok(None);
    }

    let mut init_code = String::new();
    init_code.push_str(&format!(
        "runTestSuite({}, {}, {}, () => {{{}}})",
        serde_json::to_string(request).unwrap(),
        serde_json::to_string(response).unwrap(),
        serde_json::to_string(scenario).unwrap(),
        request.test.as_ref().unwrap()
    ));

    let v8_code = v8::String::new(tc, &init_code).unwrap();

    let Some(script) = v8::Script::compile(tc, v8_code, None) else {
        let message = tc.message().unwrap();
        let message = message.get(tc).to_rust_string_lossy(tc);
        return Err(ExecutionError::FailedTest(message));
    };

    let Some(value) = script.run(tc) else {
        let message = tc.message().unwrap();
        let message = message.get(tc).to_rust_string_lossy(tc);
        return Err(ExecutionError::FailedTest(message));
    };

    let result = value.to_string(tc);
    let s = result.unwrap().to_rust_string_lossy(tc);
    let test_response: ApicizeTestResponse = serde_json::from_str(&s).unwrap();

    Ok(Some(test_response))
}

/// Run the specified request entry recursively
#[async_recursion]
async fn run_int<'a>(
    tests_started: SystemTime,
    parent_request_name: &'a Option<Vec<String>>,
    request: &'a WorkbookRequestEntry,
    authorization: &'a Option<WorkbookAuthorization>,
    scenario: &'a Option<WorkbookScenario>,
    run: &u32,
    total_runs: &u32,
) -> (Vec<ApicizeResult>, Option<WorkbookScenario>) {
    match request {
        WorkbookRequestEntry::Info(info) => {
            let now = SystemTime::now();
            let mut request_name = match parent_request_name {
                Some(existing_name) => existing_name.clone(),
                None => vec![],
            };
            request_name.push(info.name.clone());
            let dispatch_response = dispatch(info, authorization, scenario).await;
            match &dispatch_response {
                Ok((request, response)) => {
                    let test_response = execute_test(info, response, scenario);
                    match test_response {
                        Ok(test_results) => {
                            let (reported_test_results, reported_test_scenario) = match test_results
                            {
                                Some(results) => (results.results, results.scenario),
                                None => (None, None),
                            };
                            (
                                vec![ApicizeResult {
                                    request_id: info.id.clone(),
                                    run: run.clone(),
                                    total_runs: total_runs.clone(),
                                    request: Some(request.clone()),
                                    response: Some(response.clone()),
                                    tests: reported_test_results,
                                    executed_at: now
                                        .duration_since(tests_started)
                                        .unwrap()
                                        .as_millis(),
                                    milliseconds: now.elapsed().unwrap().as_millis(),
                                    success: true,
                                    error_message: None,
                                }],
                                reported_test_scenario,
                            )
                        }
                        Err(err) => (
                            vec![ApicizeResult {
                                request_id: info.id.clone(),
                                run: run.clone(),
                                total_runs: total_runs.clone(),
                                request: Some(request.clone()),
                                response: Some(response.clone()),
                                tests: None,
                                executed_at: now.duration_since(tests_started).unwrap().as_millis(),
                                milliseconds: now.elapsed().unwrap().as_millis(),
                                success: false,
                                error_message: Some(format!("{}", err)),
                            }],
                            None,
                        ),
                    }
                }
                Err(err) => (
                    vec![ApicizeResult {
                        request_id: info.id.clone(),
                        run: run.clone(),
                        total_runs: total_runs.clone(),
                        request: None,
                        response: None,
                        tests: None,
                        executed_at: now.duration_since(tests_started).unwrap().as_millis(),
                        milliseconds: now.elapsed().unwrap().as_millis(),
                        success: false,
                        error_message: Some(format!("{}", err)),
                    }],
                    None,
                ),
            }
        }
        WorkbookRequestEntry::Group(group) => {
            // Recursively run requests located in groups...
            let mut results: Vec<ApicizeResult> = Vec::new();
            let mut request_name = match parent_request_name {
                Some(existing_name) => existing_name.clone(),
                None => vec![],
            };
            request_name.push(group.name.clone());

            let mut items = group.children.iter();
            let mut active_scenario = scenario.clone();

            while let Some(item) = items.next() {
                let (group_test_results, group_scenario) = run_int(
                    tests_started,
                    &Some(request_name.clone()),
                    item,
                    authorization,
                    &active_scenario,
                    run,
                    total_runs,
                )
                .await;
                results.extend(group_test_results);
                active_scenario = group_scenario;
            }

            return (results, active_scenario);
        }
    }
}

#[async_trait]
impl Runnable for WorkbookRequestEntry {
    /// Dispatch the request (info or group) and test results
    async fn run<'a>(
        self: &WorkbookRequestEntry,
        authorization: &'a Option<WorkbookAuthorization>,
        scenario: &'a Option<WorkbookScenario>,
        cancellation: Option<CancellationToken>,
    ) -> Result<ApicizeResultRuns, RunError> {
        // Ensure V8 is initialized
        V8_INIT.call_once(|| {
            let platform = v8::new_unprotected_default_platform(0, false).make_shared();
            v8::V8::initialize_platform(platform);
            v8::V8::initialize();
        });

        let total_runs = match self {
            WorkbookRequestEntry::Info(_) => 1,
            WorkbookRequestEntry::Group(group) => group.runs,
        };

        let mut runs: JoinSet<Option<(Vec<ApicizeResult>, Option<WorkbookScenario>)>> =
            JoinSet::new();
        let token = match cancellation {
            Some(cancellation_token) => cancellation_token,
            None => CancellationToken::new(),
        };

        let mut results: Vec<ApicizeResult> = Vec::new();
        for run in 0..total_runs {
            // All of this cloning kind of sucks, but it's required to make spawn work
            let cloned_token = token.clone();
            let cloned_request = self.clone();
            let cloned_auth = authorization.clone();
            let cloned_scenario = scenario.clone();

            runs.spawn(async move {
                select! {
                    _ = cloned_token.cancelled() => None,
                    result = run_int(
                        SystemTime::now(),
                        &None,
                        &cloned_request,
                        &cloned_auth,
                        &cloned_scenario,
                        &run,
                        &total_runs,
                    ) => Some(result)
                }
            });
        }

        let mut caught: Option<RunError> = None;

        while let Some(result) = runs.join_next().await {
            match result {
                Ok(result_or_cancel) => match result_or_cancel {
                    Some(mut result) => {
                        results.append(&mut result.0);
                    }
                    None => {
                        caught = Some(RunError::Cancelled);
                    }
                },
                Err(err) => {
                    Some(RunError::JoinError(err));
                }
            }
        }

        match caught {
            Some(caught_error) => Err(caught_error),
            None => {
                let mut results_by_run: ApicizeResultRuns =
                    vec![vec![]; usize::try_from(total_runs).unwrap()];

                results.sort_by(|a, b| {
                    let mut ord = a.run.cmp(&b.run);
                    if ord.is_eq() {
                        ord = a.executed_at.cmp(&b.executed_at);
                    }
                    ord
                });

                results.drain(..).for_each(|r| {
                    results_by_run[usize::try_from(r.run).unwrap()].push(r);
                });

                Ok(results_by_run)
            }
        }
    }
    // for result in results {
    //     match result {
    //         Ok((run_results, _)) => results.extend(run_results),
    //         Err(err) => {
    //             if caught.is_none() {
    //                 caught = Some(RunError::Other(format!("{:?}", err)))
    //             }
    //         }
    //     }
    // }

    // match caught {
    //     Some(caught_error) => Err(caught_error),
    //     None => {
    //         let mut results_by_run: ApicizeResultRuns =
    //             vec![vec![]; usize::try_from(total_runs).unwrap()];

    //         results.sort_by(|a, b| {
    //             let mut ord = a.run.cmp(&b.run);
    //             if ord.is_eq() {
    //                 ord = a.executed_at.cmp(&b.executed_at);
    //             }
    //             ord
    //         });

    //         results.drain(..).for_each(|r| {
    //             results_by_run[usize::try_from(r.run).unwrap()].push(r);
    //         });

    //         Ok(results_by_run)
    //     }
    // }
}

#[cfg(test)]
mod lib_tests {

    use super::models::{WorkbookRequest, WorkbookRequestMethod};
    use crate::{dispatch, ExecutionError};

    #[tokio::test]
    async fn test_dispatch_success() -> Result<(), ExecutionError> {
        let mut server = mockito::Server::new();

        // Use one of these addresses to configure your client
        let url = server.url();

        // Create a mock
        let mock = server
            .mock("GET", "/")
            .with_status(200)
            .with_header("content-type", "text/plain")
            .with_header("x-api-key", "1234")
            .with_body("ok")
            .create();

        let request = WorkbookRequest {
            id: String::from(""),
            name: String::from("test"),
            url,
            method: Some(WorkbookRequestMethod::Get),
            timeout: None,
            keep_alive: None,
            headers: None,
            query_string_params: None,
            body: None,
            test: None,
        };

        let result = dispatch(&request, &None, &None).await;
        mock.assert();

        match result {
            Ok((_, response)) => {
                assert_eq!(response.status, 200);
                assert_eq!(response.body.unwrap().text.unwrap(), String::from("ok"));
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    // #[test]
    // fn test_perform_test_success() {
    //     let request = WorkbookRequest {
    //         id: String::from(""),
    //         name: String::from("Test #1"),
    //         url: String::from("https://foo"),
    //         method: Some(WorkbookRequestMethod::Get),
    //         timeout: None,
    //         body: None,
    //         headers: None,
    //         query_string_params: None,
    //         keep_alive: None,
    //         test: Some(String::from("describe(\"Status\", () => it(\"equals 200\", () => expect(response.status).to.equal(200)))"))
    //     };
    //     let response = ApicizeResponse {
    //         status: 200,
    //         status_text: String::from("Ok"),
    //         headers: None,
    //         body: None,
    //         auth_token_cached: None,
    //     };

    //     let result = request.execute(&response).unwrap();

    //     assert_eq!(
    //         result,
    //         vec!(ApicizeTestResult {
    //             test_name: vec![String::from("Status"), String::from("equals 200")],
    //             success: true,
    //             error: None,
    //             logs: None
    //         })
    //     );
    // }

    // #[test]
    // fn test_perform_test_fail() {
    //     let request = WorkbookRequest {
    //         id: String::from(""),
    //         name: String::from("Test #1"),
    //         url: String::from("https://foo"),
    //         method: Some(WorkbookRequestMethod::Get),
    //         timeout: None,
    //         body: None,
    //         headers: None,
    //         query_string_params: None,
    //         keep_alive: None,
    //         test: Some(String::from("describe(\"Status\", () => it(\"equals 200\", () => expect(response.status).to.equal(200)))"))
    //     };

    //     let response = ApicizeResponse {
    //         status: 404,
    //         status_text: String::from("Not Found"),
    //         headers: None,
    //         body: None,
    //         auth_token_cached: None,
    //     };

    //     let result = request.execute(&response).unwrap();

    //     assert_eq!(
    //         result,
    //         vec!(ApicizeTestResult {
    //             test_name: vec![String::from("Status"), String::from("equals 200")],
    //             success: false,
    //             error: Some(String::from("expected 404 to equal 200")),
    //             logs: None
    //         })
    //     );
    // }
}
