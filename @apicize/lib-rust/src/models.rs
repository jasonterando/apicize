//! Apicize models
//! 
//! This module defines models used to store and execute Apicize workbook requests

use oauth2::basic::BasicErrorResponseType;
use oauth2::{RequestTokenError, StandardErrorResponse};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use serde_with::base64::{Base64, Standard};
use serde_with::formats::Unpadded;
use serde_with::serde_as;
use tokio::task::JoinError;
use std::collections::HashMap;
use std::fmt::Display;
use std::io;
use thiserror::Error;
use uuid::Uuid;

/// Represents errors occurring during Workbook serialization and deserialization
#[derive(Error, Debug)]
pub enum SerializationError {
    /// File system error
    #[error(transparent)]
    IO(#[from] io::Error),
    /// JSON parsing error
    #[error(transparent)]
    JSON(#[from] serde_json::Error),
}

/// Represents errors occuring during Workbook running, dispatching and testing
#[derive(Error, Debug)]
pub enum ExecutionError {
    /// HTTP errors
    #[error(transparent)]
    Reqwest(#[from] reqwest::Error),
    /// Join/async errors
    #[error(transparent)]
    Join(#[from] JoinError),
    /// OAuth2 authentication errors
    #[error(transparent)]
    OAuth2(#[from] RequestTokenError<oauth2::HttpClientError<oauth2::reqwest::Error>, StandardErrorResponse<BasicErrorResponseType>>),
    /// Failed test execution
    #[error("{0}")]
    FailedTest(String),
}

/// Represents errors occuring during Workbook running, dispatching and testing
#[derive(Error, Debug)]
pub enum RunError {
    /// Other error
    #[error("Other")]
    Other(String),
    /// Join error
    #[error("JoinError")]
    JoinError(JoinError),
    /// Execution cancelled
    #[error("Cancelled")]
    Cancelled,
}

/// HTTP methods for Apicize Requests
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "UPPERCASE")]
pub enum WorkbookRequestMethod {
    /// HTTP GET
    Get,
    /// HTTP POST
    Post,
    /// HTTP PUT
    Put,
    /// HTTP DELETE
    Delete,
    /// HTTP PATCH
    Patch,
    /// HTTP HEAD
    Head,
    /// HTTP OPTIONS
    Options,
}

impl WorkbookRequestMethod {
    /// Returns Apicize Request method as string
    pub fn as_str(&self) -> &'static str {
        match self {
            WorkbookRequestMethod::Get => "GET",
            WorkbookRequestMethod::Post => "POST",
            WorkbookRequestMethod::Put => "PUT",
            WorkbookRequestMethod::Delete => "DELETE",
            WorkbookRequestMethod::Patch => "PATCH",
            WorkbookRequestMethod::Head => "HEAD",
            WorkbookRequestMethod::Options => "OPTIONS",
        }
    }
}


/// Apicize Request body.  
/// Note: we have to have structs as variants to get serde_as
/// support for Base64
#[serde_as]
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(tag = "type")]
pub enum WorkbookRequestBody {
    /// Text (UTF-8) body data
    Text {
        /// Text
        data: String,
    },
    /// JSON body data
    #[serde(rename = "JSON")]
    JSON {
        /// Text
        data: Value,
    },
    /// XML body data
    #[serde(rename = "XML")]
    XML {
        /// Text
        data: String,
    },
    /// Form (not multipart) body data
    Form {
        /// Name/value pairs of form data
        data: Vec<WorkbookNameValuePair>,
    },
    /// Binary body data serialized as Base64
    Raw {
        /// Base-64 encoded binary data
        #[serde_as(as = "Base64<Standard, Unpadded>")]
        data: Vec<u8>,
    }
}

/// String name/value pairs used to store values like Apicize headers, query string parameters, etc.
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct WorkbookNameValuePair {
    /// Name of value
    pub name: String,
    /// Value
    pub value: String,
    /// If set to true, name/value pair should be ignored when dispatching Apicize Requests
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disabled: Option<bool>,
}

/// Generate unique ID
fn generate_uuid() -> String {
    Uuid::new_v4().to_string()
}

/// Information required to dispatch and test an Apicize Request
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkbookRequest {
    /// Unique identifier (required to keep track of dispatches and test executions)
    #[serde(default = "generate_uuid")]
    pub id: String,
    /// Human-readable name describing the Apicize Request
    pub name: String,
    /// Test to execute after dispatching request and receiving response
    #[serde(skip_serializing_if = "Option::is_none")]
    pub test: Option<String>,
    /// URL to dispatch the HTTP request to
    pub url: String,
    /// HTTP method
    #[serde(skip_serializing_if = "Option::is_none")]
    pub method: Option<WorkbookRequestMethod>,
    /// Timeout, in seconds, to wait for a response
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timeout: Option<u32>,
    /// HTTP headers
    #[serde(skip_serializing_if = "Option::is_none")]
    pub headers: Option<Vec<WorkbookNameValuePair>>,
    /// HTTP query string parameters
    #[serde(skip_serializing_if = "Option::is_none")]
    pub query_string_params: Option<Vec<WorkbookNameValuePair>>,
    /// HTTP body
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<WorkbookRequestBody>,
    /// Keep HTTP connection alive
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keep_alive: Option<bool>,
}

impl Display for WorkbookRequest {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name)
    }
}

/// Generate the value 1 for default, since serde doesn't suport literal defaults
fn one() -> u32 {
    1
}


/// A group of Apicize Requests
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct WorkbookRequestGroup {
    /// Uniquely identifies group of Apicize requests
    #[serde(default = "generate_uuid")]
    pub id: String,
    /// Human-readable name of group
    pub name: String,
    /// List of Apicize Requests in group
    pub children: Box<Vec<WorkbookRequestEntry>>,
    #[serde(default = "one")]
    /// Number of runs for the group to execute
    pub runs: u32,
}

impl Display for WorkbookRequestGroup {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name)
    }
}

/// Apcize Request that is either a specific request to run (Info)
/// or a group of requests (Group)
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(untagged)]
pub enum WorkbookRequestEntry {
    /// Request to run
    Info(WorkbookRequest),
    /// Group of Apicize Requests
    Group(WorkbookRequestGroup),
}

impl Display for WorkbookRequestEntry {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            WorkbookRequestEntry::Info(i) => write!(f, "{}", i.name),
            WorkbookRequestEntry::Group(g) => write!(f, "{}", g.name),
        }
    }
}

/// Authorization information used when dispatching an Apicize Request
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(tag = "type")]
pub enum WorkbookAuthorization {
    /// Basic authentication (basic authorization header)
    #[serde(rename_all = "camelCase")]
    Basic {
        /// Uniquely identifies authorization configuration
        #[serde(default = "generate_uuid")]
        id: String,
        /// Human-readable name of authorization configuration
        name: String,
        /// User name
        username: String,
        /// Password
        password: String,
    },
    /// OAuth2 client flow (bearer authorization header)
    #[serde(rename_all = "camelCase")]
    OAuth2Client {
        /// Uniquely identifies authorization configuration
        #[serde(default = "generate_uuid")]
        id: String,
        /// Indicates if/how authorization will be persisted
        /// Human-readable name of authorization configuration
        name: String,
        /// URL to retrieve access token from
        access_token_url: String,
        /// Client ID
        client_id: String,
        /// Client secret (allowed to be blank)
        client_secret: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        /// Scope to add to token (multiple scopes should be space-delimited)
        scope: Option<String>,
        // #[serde(skip_serializing_if="Option::is_none")]
        // send_credentials_in_body: Option<bool>,
    },
    /// API key authentication (sent in HTTP header)
    #[serde(rename_all = "camelCase")]
    ApiKey {
        /// Uniquely identifies authorization configuration
        #[serde(default = "generate_uuid")]
        id: String,
        /// Indicates if/how authorization will be persisted
        /// Human-readable name of authorization configuration
        name: String,
        /// Name of header (ex. "x-api-key")
        header: String,
        /// Value of key to include as header value
        value: String,
    },
}

/// A set of variables that can be injected into templated values
/// when submitting an Apicize Request
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct WorkbookScenario {
    /// Uniquely identifies scenario
    #[serde(default = "generate_uuid")]
    pub id: String,
    /// Name of variable to substitute (avoid using curly braces)
    pub name: String,
    /// Value of variable to substitute
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variables: Option<Vec<WorkbookNameValuePair>>,
}

/// Miscellaneous Workbook settings
#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WorkbookSettings {
    /// Optionally set to default authorization
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_authorization_id: Option<String>,
    /// Optionally set to default scenario
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_scenario_id: Option<String>,
}

/// Persisted Apcizize requests, authorization and scenario definitions
#[derive(Serialize, Deserialize, PartialEq, Debug)]
pub struct Workbook {
    /// Version of workbook format (should not be changed manually)
    pub version: f32,
    /// List of requests/request groups
    pub requests: Vec<WorkbookRequestEntry>,
    /// List of authorizations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub authorizations: Option<Vec<WorkbookAuthorization>>,
    /// List of scenarios
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scenarios: Option<Vec<WorkbookScenario>>,
    /// Miscelaneous Workbook settings
    #[serde(skip_serializing_if = "Option::is_none")]
    pub settings: Option<WorkbookSettings>,
}

/// Saved workbook authentications
#[derive(Serialize, Deserialize, PartialEq, Debug)]
pub struct SavedWorkbookAuth {
    /// Version of workbook format (should not be changed manually)
    pub version: f32,
    /// List of authorizations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub authorizations: Option<Vec<WorkbookAuthorization>>,
}

/// Persisted Apicize common storage of authorizations, certificates, etc.
#[derive(Serialize, Deserialize, PartialEq, Debug)]
pub struct CommonEnvironment {
    /// Common authorizations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub authorizations: Option<Vec<WorkbookAuthorization>>
}

/// Body information used when dispatching an Apicize Request
#[serde_as]
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeBody {
    /// Body as data (UTF-8 bytes)
    #[serde_as(as = "Option<Base64<Standard, Unpadded>>")]
    pub data: Option<Vec<u8>>,
    /// Reprsents body as text
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
}

/// Information used to dispatch an Apicize request
#[serde_as]
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeRequest {
    /// URL
    pub url: String,
    /// HTTP Method
    pub method: String,
    /// Headers
    pub headers: HashMap<String, String>,
    /// Body
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<ApicizeBody>,
}

/// Information about the response to a dispatched Apicize request
#[serde_as]
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeResponse {
    /// HTTP status code
    pub status: u16,
    /// HTTP status text
    pub status_text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Response headers
    pub headers: Option<HashMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Response body
    pub body: Option<ApicizeBody>,
    /// True if authorization token cached
    pub auth_token_cached: Option<bool>,
}

/// Response when executing an Apicize test
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeTestResponse {
    /// Results of test
    pub results: Option<Vec<ApicizeTestResult>>,
    /// Scenario values (if any)
    pub scenario: Option<WorkbookScenario>,
}

/// Information about an executed Apicize test
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeTestResult {
    /// Human readable name of the test
    pub test_name: Vec<String>,
    /// Whether or not the test was successful
    pub success: bool,
    /// Error generated during the test
    pub error: Option<String>,
    /// Console I/O generated during the test
    pub logs: Option<Vec<String>>,
}

/// Apicize run result
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeResult {
    /// Request ID
    pub request_id: String,
    /// Attempt run number (zero indexed)
    pub run: u32,
    /// Total number of run attempts
    pub total_runs: u32,
    /// Request sent as HTTP call
    pub request: Option<ApicizeRequest>,
    /// Response received from HTTP call
    pub response: Option<ApicizeResponse>,
    /// Test results
    pub tests: Option<Vec<ApicizeTestResult>>,
    /// Time-of-day of execution
    pub executed_at: u128,
    /// Duration of execution
    pub milliseconds: u128,
    /// Set to true if HTTP call succeeded (regardless of status code)
    pub success: bool,
    /// Number of executed tests
    pub test_count: Option<usize>,
    /// Number of failed tests
    pub failed_test_count: Option<usize>,
    /// Any error message generated during HTTP call
    pub error_message: Option<String>,
}

/// List of Apicize Result runs
pub type ApicizeResultRuns = Vec<Vec<ApicizeResult>>;

#[cfg(test)]
mod model_tests {
    use serde_json::{json, Value};

    use super::{
        Workbook, WorkbookAuthorization, WorkbookNameValuePair, WorkbookRequest, WorkbookRequestBody, WorkbookRequestEntry, WorkbookRequestGroup, WorkbookRequestMethod, WorkbookScenario
    };

    fn default_requests() -> Vec<WorkbookRequestEntry> {
        Vec::from([
            WorkbookRequestEntry::Group(WorkbookRequestGroup {
                id: String::from("group-1"),
                name: String::from("test-1"),
                runs: 1,
                children: Box::new(Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                    id: String::from("XXX"),
                    name: String::from("test-1a"),
                    url: String::from("https://foo"),
                    method: None,
                    timeout: None,
                    keep_alive: None,
                    headers: None,
                    query_string_params: None,
                    body: None,
                    test: None,
                })]))
            }),
            WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("YYY"),
                name: String::from("test-2"),
                url: String::from("https://bar"),
                method: None,
                timeout: None,
                keep_alive: None,
                headers: None,
                query_string_params: None,
                body: None,
                test: None,
            }),
        ])
    }

    fn default_requests_json() -> Value {
        json!([
            {
                "id": "group-1",
                "name": "test-1",
                "runs": 1,
                "children": [{
                    "id": "XXX",
                    "name": "test-1a",
                    "url": "https://foo"
                }]
            }, {
                "id": "YYY",
                "name": "test-2",
                "url": "https://bar"
            }
        ])
    }

    #[test]
    fn test_req_method() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "method": "POST"
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: Some(WorkbookRequestMethod::Post),
                timeout: None,
                keep_alive: None,
                headers: None,
                query_string_params: None,
                body: None,
                test: None,
            })]),
            authorizations: None,
            scenarios: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_timeout() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "timeout": 100
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: Some(100),
                keep_alive: None,
                headers: None,
                query_string_params: None,
                body: None,
                test: None,
            })]),
            authorizations: None,
            scenarios: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_keep_alive() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "keepAlive": true
            }]
        });
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                let expected = Workbook {
                    version: 0.1,
                    requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                        id: String::from("XXX"),
                        name: String::from("test"),
                        url: String::from("https://foo"),
                        method: None,
                        timeout: None,
                        keep_alive: Some(true),
                        headers: None,
                        query_string_params: None,
                        body: None,
                        test: None,
                    })]),
                    authorizations: None,
                    scenarios: None,
                    settings: None,
                };
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_headers() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "headers": [
                    {
                        "name": "foo",
                        "value": "bar"
                    }
                ]
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                headers: Some(vec![WorkbookNameValuePair {
                    name: String::from("foo"),
                    value: String::from("bar"),
                    disabled: None,
                }]),
                query_string_params: None,
                body: None,
                test: None,
            })]),
            authorizations: None,
            scenarios: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_query_string_params() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "queryStringParams": [{
                    "name": "foo",
                    "value": "bar"
                }]
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                headers: None,
                query_string_params: Some(vec![WorkbookNameValuePair {
                    name: String::from("foo"),
                    value: String::from("bar"),
                    disabled: None,
                }]),
                body: None,
                test: None,
            })]),
            authorizations: None,
            scenarios: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_body_as_text() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "body": {
                    "type": "Text",
                    "data": "test123"
                }
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                headers: None,
                query_string_params: None,
                body: Some(WorkbookRequestBody::Text {
                    data: String::from("test123"),
                }),
                test: None,
            })]),
            authorizations: None,
            scenarios: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_body_as_json() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "body": {
                    "type": "JSON",
                    "data": {
                        "foo": "bar",
                        "aaa": [1, 2, 3]
                    }
                }
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                headers: None,
                query_string_params: None,
                body: Some(WorkbookRequestBody::JSON {
                    data: json!({"foo": "bar", "aaa": [1, 2, 3]}),
                }),
                test: None,
            })]),
            authorizations: None,
            scenarios: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_body_as_xml() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "body": {
                    "type": "XML",
                    "data": "<foo></foo>"
                }
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                headers: None,
                query_string_params: None,
                body: Some(WorkbookRequestBody::XML {
                    data: String::from("<foo></foo>"),
                }),
                test: None,
            })]),
            authorizations: None,
            scenarios: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_body_as_base64() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "body": {
                    "type": "Base64",
                    "data": "VGVzdGluZyAxMjM="
                }
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                headers: None,
                query_string_params: None,
                body: Some(WorkbookRequestBody::Raw { 
                    data: Vec::from([84, 101, 115, 116, 105, 110, 103, 32, 49, 50, 51]),
                }),
                test: None,
            })]),
            authorizations: None,
            scenarios: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_test4() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "test": "foo()"
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                headers: None,
                query_string_params: None,
                body: None,
                test: Some(String::from("foo()")),
            })]),
            authorizations: None,
            scenarios: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_no_auths_or_scenarios() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": default_requests_json()
        });
        let expected = Workbook {
            version: 0.1,
            requests: self::default_requests(),
            authorizations: None,
            scenarios: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_auth_basic_deserialize() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": default_requests_json(),
            "authorizations": [
                {
                    "type": "Basic",
                    "name": "test-basic",
                    "userName": "foo",
                    "password": "bar"
                }
            ]
        });
        let expected = Workbook {
            version: 0.1,
            requests: self::default_requests(),
            scenarios: None,
            authorizations: Some(vec![WorkbookAuthorization::Basic {
                id: String::from("100"),
                name: String::from("test-basic"),
                username: String::from("foo"),
                password: String::from("bar"),
            }]),
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_auth_oauth2_no_opts_deserialize() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": default_requests_json(),
            "authorizations": [
                {
                    "type": "OAuth2Client",
                    "name": "test-oauth2-client",
                    "accessTokenUrl": "https://foo",
                    "clientId": "me",
                    "clientSecret": "shhh"
                }
            ]
        });
        let expected = Workbook {
            version: 0.1,
            requests: self::default_requests(),
            scenarios: None,
            authorizations: Some(vec![WorkbookAuthorization::OAuth2Client {
                id: String::from("100"),
                name: String::from("test-oauth2-client"),
                access_token_url: String::from("https://foo"),
                client_id: String::from("me"),
                client_secret: String::from("shhh"),
                scope: None,
                // send_credentials_in_body: None,
            }]),
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_auth_oauth2_with_opts_deserialize() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": default_requests_json(),
            "authorizations": [
                {
                    "type": "OAuth2Client",
                    "name": "test-oauth2-client",
                    "accessTokenUrl": "https://foo",
                    "clientId": "me",
                    "clientSecret": "shhh",
                    "scope": "abc def",
                    // "sendCredentialsInBody": true
                }
            ]
        });
        let expected = Workbook {
            version: 0.1,
            requests: self::default_requests(),
            scenarios: None,
            authorizations: Some(vec![WorkbookAuthorization::OAuth2Client {
                id: String::from("100"),
                access_token_url: String::from("https://foo"),
                name: String::from("test-oauth2-client"),
                client_id: String::from("me"),
                client_secret: String::from("shhh"),
                scope: Some(String::from("abc def")),
                // send_credentials_in_body: Some(true),
            }]),
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_auth_apikey_deserialize() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": default_requests_json(),
            "authorizations": [
                {
                    "type": "ApiKey",
                    "id": "auth-1",
                    "name": "test-api-key",
                    "header": "foo",
                    "value": "bar"
                }
            ]
        });
        let expected = Workbook {
            version: 0.1,
            requests: self::default_requests(),
            scenarios: None,
            authorizations: Some(vec![WorkbookAuthorization::ApiKey {
                id: String::from("auth-1"),
                name: String::from("test-api-key"),
                header: String::from("foo"),
                value: String::from("bar"),
            }]),
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_deserialize() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": default_requests_json(),
            "scenarios": [
                {
                    "name": "foo",
                    "variables": {
                        "abc": "xxx",
                        "def": "yyy"
                    }
                }
            ]
        });
        let expected = Workbook {
            version: 0.1,
            requests: self::default_requests(),
            authorizations: None,
            scenarios: Some(vec![WorkbookScenario {
                id: String::from("100"),
                name: String::from("foo"),
                variables: Some(vec![
                    WorkbookNameValuePair {
                        name: String::from("abc"),
                        value: String::from("xxx"),
                        disabled: None,
                    },
                    WorkbookNameValuePair {
                        name: String::from("def"),
                        value: String::from("yyy"),
                        disabled: None,
                    },
                ]),
            }]),
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    // #[test]
    // fn test_deserialize_run_request -> Result<(), serde_json::Error> {

    //     let json = "{\"request\":{\"id\":\"740c1e49-24b7-4c88-9e3a-9ad0a8fc1e79\",\"name\":\"Get original quote\",\"test\":\"const data = JSON.parse(response.body.text)\\nscenario.original_author = data.author\\n\\ndescribe('status', () => {\\n   it('equals 200', () => {\\n      console.log('Test!')\\n      expect(response.status).to.equal(200)\\n   })\\n})\",\"url\":\"http://localhost:8080/quote/1\",\"method\":\"GET\",\"timeout\":5000},\"authorizaztion\":{\"type\":\"ApiKey\",\"id\":\"cbcaa934-6fe6-47f7-b0fe-ef1db66f5baf\",\"name\":\"Sample API Key\",\"header\":\"x-api-key\",\"value\":\"12345\"},\"scenario\":{\"id\":\"1faeaabc-b348-4cd5-a8ee-78c8b0c838d8\",\"name\":\"Scenario #1\",\"variables\":[{\"name\":\"author\",\"value\":\"Samuel Clemmons\",\"id\":\"03e9bb03-dd98-42cc-bc28-8630c9761d7d\"}]}}";
    //     let result = {
    //         request: WorkbookRequest {
    //                 id: String::from("YYY"),
    //                 name: String::from("test-2"),
    //                 url: String::from("https://bar"),
    //                 method: None,
    //                 timeout: None,
    //                 keep_alive: None,
    //                 headers: None,
    //                 query_string_params: None,
    //                 body: None,
    //                 test: None,
    //             }),
    //         ])
    
    //     }
    // }

}
