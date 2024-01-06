use async_recursion::async_recursion;
use async_trait::async_trait;
use encoding_rs::{Encoding, UTF_8};
use futures::future;
use mime::Mime;
use reqwest;
use std::fs;
use std::sync::Once;
use std::time::{Duration, SystemTime};
use std::{collections::HashMap, vec};

pub mod models;

use models::{
    ApicizeRequest, ApicizeResponse, Method, RequestBody, RequestInfo, ApicizeTestResult, Workbook,
    WorkbookAuthorization, WorkbookEnvironment, WorkbookError, WorkbookRequest, ApicizeResults, ApicizeResult,
};

static V8_INIT: Once = Once::new();

/// Cleanup V8 platform, should be called once at end of application
pub fn cleanup_v8() {
    unsafe {
        v8::V8::dispose();
    }
    v8::V8::dispose_platform();
}

// Trait defining file system persistence for Workbooks
pub trait FileSystem<T> {
    fn open_from_path(path: &String) -> Result<T, WorkbookError>;
    fn save_to_path(&self, path: &String) -> Result<(), WorkbookError>;
}

// Trait defining serialization methods for Workbooks
pub trait Serializable<T> {
    fn deserialize(text: String) -> Result<T, serde_json::Error>;
    fn serialize(&self) -> Result<String, serde_json::Error>;
}

// Trait defining method to run requests (dispatch and test)
#[async_trait]
pub trait Runnable {
    async fn run(
        &self,
        authorization: Option<WorkbookAuthorization>,
        environment: Option<WorkbookEnvironment>,
    ) -> ApicizeResults;
}

/// Trait defining request info behaviors
#[async_trait]
pub trait Dispatchable<T> {
    // Dispatch HTTP request defined in request info and get response
    async fn dispatch(
        &self,
        authorization: Option<WorkbookAuthorization>,
        environment: Option<WorkbookEnvironment>,
    ) -> Result<(ApicizeRequest, ApicizeResponse), reqwest::Error>;

    // Dispatch HTTP requests defined in multiple request infos and get response
    async fn dispatch_multi(
        requests: &Vec<T>,
        authorization: Option<WorkbookAuthorization>,
        environment: Option<WorkbookEnvironment>,
    ) -> HashMap<String, Result<(ApicizeRequest, ApicizeResponse), reqwest::Error>>;
}

pub trait Testable {
    // Executes any defined tests in request info and receives test results
    fn execute(&self, response: &ApicizeResponse) -> Result<Vec<ApicizeTestResult>, WorkbookError>;

    fn execute_multi(
        requests_and_responses: Vec<(&RequestInfo, &ApicizeResponse)>,
    ) -> HashMap<String, Result<Vec<ApicizeTestResult>, WorkbookError>>;
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
    fn open_from_path(path: &String) -> Result<Workbook, WorkbookError> {
        Ok(Workbook::deserialize(fs::read_to_string(path)?)?)
    }

    /// Save to specified path
    fn save_to_path(&self, path: &String) -> Result<(), WorkbookError> {
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

#[async_recursion]
async fn run_int<'a>(
    parent_request_name: &'async_recursion Vec<String>,
    request: &'async_recursion WorkbookRequest,
    authorization: Option<WorkbookAuthorization>,
    environment: Option<WorkbookEnvironment>,
    results: &'async_recursion mut HashMap<String, ApicizeResult>,
) {
    match request {
        WorkbookRequest::Info(info) => {
            let now = SystemTime::now();
            let mut request_name = parent_request_name.clone();
            request_name.push(info.name.clone());
            let dispatch_response = info.dispatch(authorization, environment).await;

            match dispatch_response {
                Ok((request, response)) => {
                    let test_response = info.execute(&response);
                    match test_response {
                        Ok(test_results) => {
                            results.insert(info.id.clone(), ApicizeResult {
                                request: Some(request),
                                response: Some(response),
                                tests: Some(test_results),
                                executed_at: now.duration_since(SystemTime::UNIX_EPOCH).unwrap().as_millis(),
                                milliseconds: now.elapsed().unwrap().as_millis(),
                                success: true,
                                error_message: None,

                            });
                        }
                        Err(err) => {
                            results.insert(info.id.clone(), ApicizeResult {
                                request: Some(request),
                                response: Some(response),
                                tests: None,
                                executed_at: now.duration_since(SystemTime::UNIX_EPOCH).unwrap().as_millis(),
                                milliseconds: now.elapsed().unwrap().as_millis(),
                                success: false,
                                error_message: Some(format!("{}", err)),
                            });
                        }
                    }
                }
                Err(err) => {
                    results.insert(info.id.clone(), ApicizeResult {
                        request: None,
                        response: None,
                        tests: None,
                        executed_at: now.duration_since(SystemTime::UNIX_EPOCH).unwrap().as_millis(),
                        milliseconds: now.elapsed().unwrap().as_millis(),
                        success: false,
                        error_message: Some(format!("{}", err)),
                    });
                }
            }
        }
        WorkbookRequest::Group(group) => {
            // Recursively run requests located in groups...

            let mut request_name = parent_request_name.clone();
            request_name.push(group.name.clone());

            // TODO... it *might* be cool to capture groups in this while loop
            // and wait for their futures to resolve together, since we should be
            // able to run groups concurrently.  We'd have to sort out the
            // sort order though of the results...
            let mut items = group.requests.iter();
            while let Some(item) = items.next() {
                run_int(
                    &request_name,
                    item,
                    authorization.clone(),
                    environment.clone(),
                    results,
                )
                .await
            }
        }
    }
}

#[async_trait]
impl Runnable for WorkbookRequest {
    /// Dispatch the request (info or group) and test results
    async fn run(
        self: &WorkbookRequest,
        authorization: Option<WorkbookAuthorization>,
        environment: Option<WorkbookEnvironment>,
    ) -> ApicizeResults {
        let mut results: HashMap<String, ApicizeResult> = HashMap::new();

        run_int(&vec![], self, authorization, environment, &mut results).await;
        return results;
    }
}

/// Implementation for http/https dispatchable requests
#[async_trait]
impl Dispatchable<RequestInfo> for RequestInfo {
    /// Dispatch the specified request (via reqwest), returning either the repsonse or error
    async fn dispatch(
        self: &RequestInfo,
        authorization: Option<WorkbookAuthorization>,
        environment: Option<WorkbookEnvironment>,
    ) -> Result<(ApicizeRequest, ApicizeResponse), reqwest::Error> {
        let method: reqwest::Method;
        match self.method {
            Some(Method::Get) => method = reqwest::Method::GET,
            Some(Method::Post) => method = reqwest::Method::POST,
            Some(Method::Put) => method = reqwest::Method::PUT,
            Some(Method::Delete) => method = reqwest::Method::DELETE,
            Some(Method::Head) => method = reqwest::Method::HEAD,
            Some(Method::Options) => method = reqwest::Method::OPTIONS,
            None => method = reqwest::Method::GET,
            _ => panic!("Invalid method \"{:?}\"", self.method),
        }

        let timeout: Duration;
        if let Some(t) = self.timeout {
            timeout = Duration::from_millis(t as u64);
        } else {
            timeout = Duration::from_secs(30);
        }

        let keep_alive: bool;
        if let Some(b) = self.keep_alive {
            keep_alive = b;
        } else {
            keep_alive = true;
        }

        let subs: Vec<(String, String)>;

        match environment {
            Some(env) => {
                match env.variables {
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
        let client = reqwest::Client::builder()
            .http2_keep_alive_while_idle(keep_alive)
            .timeout(timeout)
            .build()?;

        let mut request_builder = client
            .request(method, clone_and_sub(self.url.as_str(), &subs));

        // Add headers, including authorization if applicable
        let mut headers = reqwest::header::HeaderMap::new();
        if let Some(h) = &self.headers {
            for nvp in h {
                if nvp.disabled != Some(true) {
                    headers.insert(
                        reqwest::header::HeaderName::try_from(clone_and_sub(&nvp.name, &subs))
                            .unwrap(),
                        reqwest::header::HeaderValue::try_from(clone_and_sub(&nvp.value, &subs))
                            .unwrap(),
                    );
                }
            }
        }

        match authorization {
            Some(WorkbookAuthorization::Basic {
                name: _,
                username,
                password,
            }) => {
                request_builder = request_builder.basic_auth(username, Some(password));
            }
            Some(WorkbookAuthorization::ApiKey {
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
                name: _,
                access_token_url: _,
                client_id: _,
                client_secret: _,
                scope: _,
                send_credentials_in_body: _,
            }) => {
                panic!("Not yet implemented")
            }
            None => {}
        }

        if !headers.is_empty() {
            request_builder = request_builder.headers(headers);
        }

        // Add query string parameters, if applicable
        if let Some(q) = &self.query_string_params {
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
        let request_body_as_text: Option<String>;
        match &self.body {
            Some(RequestBody::Text { data }) => {
                let s = clone_and_sub(data, &subs);
                request_builder = request_builder.body(reqwest::Body::from(s.clone()));
                request_body_as_text = Some(s);
            }
            Some(RequestBody::JSON { data }) => {
                let s = clone_and_sub(serde_json::to_string(&data).unwrap().as_str(), &subs);
                request_builder = request_builder.body(reqwest::Body::from(s.clone()));
                request_body_as_text = Some(s);
            }
            Some(RequestBody::XML { data }) => {
                let s = clone_and_sub(data.as_str(), &subs);
                request_builder = request_builder.body(reqwest::Body::from(s.clone()));
                request_body_as_text = Some(s);
            }
            Some(RequestBody::Base64(rec)) => {
                request_builder = request_builder.body(reqwest::Body::from(rec.data.clone()));
                request_body_as_text = None;
            }
            None => {
                request_body_as_text = None;
            }
        }

        let mut request = request_builder.build()?;

        // Copy value generated for the request so that we can include in the function results
        let request_url = request.url().to_string();
        let request_headers = request
            .headers()
            .iter()
            .map(|(h, v)| {
                (
                    String::from(h.as_str()),
                    String::from(v.to_str().unwrap_or("(Header Contains Non-ASCII Data)")),
                )
            })
            .collect::<HashMap<String, String>>();
        let request_body_as_data: Option<Vec<u8>>;
        let ref_body = request.body_mut();
        match ref_body {
            Some(data) => request_body_as_data = Some(data.as_bytes().unwrap().to_vec()),
            None => request_body_as_data = None,
        }

        // Execute the request
        let response = client.execute(request).await?;

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
                            String::from(v.to_str().unwrap_or("(Header Contains Non-ASCII Data)")),
                        )
                    })
                    .collect::<HashMap<String, String>>(),
            ));
        }

        // Determine the default text encoding
        let content_type = response_headers
            .get(reqwest::header::CONTENT_TYPE)
            .and_then(|value| value.to_str().ok())
            .and_then(|value| value.parse::<Mime>().ok());

        let encoding_name = content_type
            .as_ref()
            .and_then(|mime| mime.get_param("charset").map(|charset| charset.as_str()))
            .unwrap_or("utf-8");
        let encoding = Encoding::for_label(encoding_name.as_bytes()).unwrap_or(UTF_8);

        // Collect status for response
        let status = response.status();
        let status_text = String::from(status.canonical_reason().unwrap_or("Unknown"));

        // Retrieve response bytes and convert raw data to string
        let bytes = response.bytes().await?;

        let response_data: Option<Vec<u8>>;
        let response_text: Option<String>;
        if bytes.len() > 0 {
            response_data = Some(Vec::from(bytes.as_ref()));
            let (text, _, _) = encoding.decode(&bytes);
            if text.len() > 0 {
                response_text = Some(text.into_owned());
            } else {
                response_text = None
            }
        } else {
            response_data = None;
            response_text = None;
        }

        return Ok((
            ApicizeRequest {
                url: request_url,
                headers: request_headers,
                data: request_body_as_data,
                text: request_body_as_text,
            },
            ApicizeResponse {
                status: status.as_u16(),
                status_text,
                headers,
                data: response_data,
                text: response_text
            },
        ));
    }

    /// Dispatch multiple requests and retrieve HTTP responses
    async fn dispatch_multi(
        requests: &Vec<RequestInfo>,
        authorization: Option<WorkbookAuthorization>,
        environment: Option<WorkbookEnvironment>,
    ) -> HashMap<String, Result<(ApicizeRequest, ApicizeResponse), reqwest::Error>> {
        let responses = future::join_all(requests.iter().map(|r| async {
            (
                r.id.clone(),
                r.dispatch(authorization.clone(), environment.clone()).await,
            )
        }))
        .await;

        let mut results = HashMap::new();
        for (id, response) in responses {
            results.insert(id, response);
        }
        return results;
    }
}

/// Implementation for testable requests
impl Testable for RequestInfo {
    /// Execute a request's tests, if defined, and return test reults
    fn execute(&self, response: &ApicizeResponse) -> Result<Vec<ApicizeTestResult>, WorkbookError> {
        let results = Self::execute_multi(vec![(self, response)]);
        let m = results.get(&self.id);
        match m {
            Some(result) => {
                // Clone the result since it was returned in a vector
                Ok(result.as_ref().unwrap().clone())
            }
            None => Err(WorkbookError::FailedTest {
                message: String::from("No response for the specified request"),
            }),
        }
    }

    /// Execute a request's tests, if defined, and return test reults
    /// Note:  initialize_v8 must be called once, and only once,
    /// before calling this method
    fn execute_multi(
        requests_responses: Vec<(&RequestInfo, &ApicizeResponse)>,
    ) -> HashMap<String, Result<Vec<ApicizeTestResult>, WorkbookError>> {
        // let callid = Uuid::new_v4().to_string();
        // println!();
        // println!("{} Before V8 call_once: {}", callid, V8_INIT.is_completed());
        V8_INIT.call_once(|| {
            // Initialize V8
            // println!("{} Beginning V8 init", callid);
            // let platform = v8::new_default_platform(0, false).make_shared();
            let platform = v8::new_unprotected_default_platform(0, false).make_shared();
            v8::V8::initialize_platform(platform);
            v8::V8::initialize();
            // println!("{} Completed V8 init", callid);
        });
        // println!("{} After V8 call_once: {}", callid, V8_INIT.is_completed());

        let mut results = HashMap::new();
        {
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

            // Loop through each request
            let mut i = requests_responses.iter();
            while let Some((req, res)) = i.next() {
                if let None = req.test {
                    results.insert(req.id.clone(), Ok(vec![]));
                    continue;
                }

                let mut init_code = String::new();
                init_code.push_str(&format!(
                    "runTestSuite({}, {}, () => {{{}}})",
                    serde_json::to_string(req).unwrap(),
                    serde_json::to_string(res).unwrap(),
                    req.test.as_ref().unwrap()
                ));

                let v8_code = v8::String::new(tc, &init_code).unwrap();

                let Some(script) = v8::Script::compile(tc, v8_code, None) else {
                    let message = tc.message().unwrap();
                    let message = message.get(tc).to_rust_string_lossy(tc);
                    results.insert(req.id.clone(), Err(WorkbookError::FailedTest { message }));
                    continue;
                };

                let Some(value) = script.run(tc) else {
                    let message = tc.message().unwrap();
                    let message = message.get(tc).to_rust_string_lossy(tc);
                    results.insert(req.id.clone(), Err(WorkbookError::FailedTest { message }));
                    continue;
                };

                let result = value.to_string(tc);
                let s = result.unwrap().to_rust_string_lossy(tc);

                let test_results: Vec<ApicizeTestResult> = serde_json::from_str(&s).unwrap();
                results.insert(req.id.clone(), Ok(test_results));
            }
        }
        return results;
    }
}

#[cfg(test)]
mod lib_tests {
    use std::vec;

    use super::models::{ApicizeResponse, Method, RequestInfo, ApicizeTestResult};
    use crate::{Dispatchable, Testable};

    #[tokio::test]
    async fn test_dispatch_success() -> Result<(), reqwest::Error> {
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

        let request = RequestInfo {
            id: String::from(""),
            name: String::from("test"),
            url,
            method: Some(Method::Get),
            timeout: None,
            keep_alive: None,
            headers: None,
            query_string_params: None,
            body: None,
            test: None,
        };

        let result = request.dispatch(None, None).await;
        mock.assert();

        match result {
            Ok((_, response)) => {
                assert_eq!(response.status, 200);
                assert_eq!(response.text.unwrap(), String::from("ok"));
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_perform_test_success() {
        let request = RequestInfo {
            id: String::from(""),
            name: String::from("Test #1"),
            url: String::from("https://foo"),
            method: Some(Method::Get),
            timeout: None,
            body: None,
            headers: None,
            query_string_params: None,
            keep_alive: None,
            test: Some(String::from("describe(\"Status\", () => it(\"equals 200\", () => expect(response.status).to.equal(200)))"))
        };
        let response = ApicizeResponse {
            status: 200,
            status_text: String::from("Ok"),
            headers: None,
            text: None,
            data: None
        };

        let result = request.execute(&response).unwrap();

        assert_eq!(
            result,
            vec!(ApicizeTestResult {
                test_name: vec![String::from("Status"), String::from("equals 200")],
                success: true,
                error: None,
                logs: None
            })
        );
    }

    #[test]
    fn test_perform_test_fail() {
        let request = RequestInfo {
            id: String::from(""),
            name: String::from("Test #1"),
            url: String::from("https://foo"),
            method: Some(Method::Get),
            timeout: None,
            body: None,
            headers: None,
            query_string_params: None,
            keep_alive: None,
            test: Some(String::from("describe(\"Status\", () => it(\"equals 200\", () => expect(response.status).to.equal(200)))"))
        };

        let response = ApicizeResponse {
            status: 404,
            status_text: String::from("Not Found"),
            headers: None,
            text: None,
            data: None
        };

        let result = request.execute(&response).unwrap();

        assert_eq!(
            result,
            vec!(ApicizeTestResult {
                test_name: vec![String::from("Status"), String::from("equals 200")],
                success: false,
                error: Some(String::from("expected 404 to equal 200")),
                logs: None
            })
        );
    }
}
