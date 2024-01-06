use serde::{Deserialize, Serialize};
use serde_json::Value;
use serde_with::base64::Base64;
use serde_with::serde_as;
use uuid::Uuid;
use std::collections::HashMap;
use std::fmt::Display;
use std::io;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum WorkbookError {
    #[error(transparent)]
    IO(#[from] io::Error),
    #[error(transparent)]
    JSON(#[from] serde_json::Error),
    #[error("test failed {message:?}")]
    FailedTest {
        message: String
    }
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "UPPERCASE")]
pub enum Method {
    Get,
    Post,
    Put,
    Delete,
    Patch,
    Head,
    Options,
}

#[serde_as]
#[derive(Serialize, Deserialize, PartialEq, Debug)]
pub struct Base64Data {
    #[serde_as(as = "Base64")]
    pub data: Vec<u8>,
}

///
#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(tag = "type")]
pub enum RequestBody {
    Text {
        data: String,
    },
    /// JSON body data
    #[serde(rename = "JSON")]
    JSON {
        data: Value,
    },
    // XML body data
    #[serde(rename = "XML")]
    XML {
        data: String,
    },
    /// Binary body data serialized as Base64
    Base64(Base64Data),
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct NameValuePair {
    pub name: String,
    pub value: String,
    #[serde(skip_serializing_if="Option::is_none")]
    pub disabled: Option<bool>
}

/// Generate unique ID, substituting MOCK_ID if set
fn generate_uuid() -> String {
    Uuid::new_v4().to_string()
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RequestInfo {
    #[serde(default = "generate_uuid")]
    pub id: String,
    pub name: String,
    pub url: String,
    #[serde(skip_serializing_if="Option::is_none")]
    pub method: Option<Method>,
    #[serde(skip_serializing_if="Option::is_none")]
    pub timeout: Option<u32>,
    #[serde(skip_serializing_if="Option::is_none")]
    pub keep_alive: Option<bool>,
    #[serde(skip_serializing_if="Option::is_none")]
    pub headers: Option<Vec<NameValuePair>>,
    #[serde(skip_serializing_if="Option::is_none")]
    pub query_string_params: Option<Vec<NameValuePair>>,
    #[serde(skip_serializing_if="Option::is_none")]
    pub body: Option<RequestBody>,
    #[serde(skip_serializing_if="Option::is_none")]
    pub test: Option<String>,
}

impl Display for RequestInfo {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name)
    }
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
pub struct RequestGroup {
    #[serde(default = "generate_uuid")]
    pub id: String,
    pub name: String,
    pub requests: Box<Vec<WorkbookRequest>>,
}

impl Display for RequestGroup {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name)
    }
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(untagged)]
pub enum WorkbookRequest {
    Info(RequestInfo),
    Group(RequestGroup),
}

impl Display for WorkbookRequest {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            WorkbookRequest::Info(i) => write!(f, "{}", i.name),
            WorkbookRequest::Group(g) => write!(f, "{}", g.name)
        }
    }
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(tag = "type")]
pub enum WorkbookAuthorization {
    #[serde(rename_all = "camelCase")]
    Basic {
        name: String,
        username: String,
        password: String,
    },
    #[serde(rename_all = "camelCase")]
    OAuth2Client {
        name: String,
        access_token_url: String,
        client_id: String,
        client_secret: String,
        #[serde(skip_serializing_if="Option::is_none")]
        scope: Option<String>,
        #[serde(skip_serializing_if="Option::is_none")]
        send_credentials_in_body: Option<bool>,
    },
    #[serde(rename_all = "camelCase")]
    ApiKey {
        name: String,
        header: String,
        value: String,
    },
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct WorkbookEnvironment {
    pub name: String,
    #[serde(skip_serializing_if="Option::is_none")]
    pub variables: Option<Vec<NameValuePair>>,
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
pub struct Workbook {
    pub version: f32,
    pub requests: Vec<WorkbookRequest>,
    #[serde(skip_serializing_if="Option::is_none")]
    pub authorizations: Option<Vec<WorkbookAuthorization>>,
    #[serde(skip_serializing_if="Option::is_none")]
    pub environments: Option<Vec<WorkbookEnvironment>>,
}

#[serde_as]
#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeRequest {
    pub url: String,
    pub headers: HashMap<String, String>,
    #[serde(skip_serializing_if="Option::is_none")]
    pub text: Option<String>,
    #[serde_as(as = "Option<Base64>")]
    pub data: Option<Vec<u8>>,
}

#[serde_as]
#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeResponse {
    pub status: u16,
    pub status_text: String,
    #[serde(skip_serializing_if="Option::is_none")]
    pub headers: Option<HashMap<String, String>>,
    #[serde(skip_serializing_if="Option::is_none")]
    pub text: Option<String>,
    #[serde_as(as = "Option<Base64>")]
    pub data: Option<Vec<u8>>
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeTestResult {
    pub test_name: Vec<String>,
    pub success: bool,
    pub error: Option<String>,
    pub logs: Option<Vec<String>>
}

pub type ApicizeResults = HashMap<String, ApicizeResult>;

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeResult {
    pub request: Option<ApicizeRequest>,
    pub response: Option<ApicizeResponse>,
    pub tests: Option<Vec<ApicizeTestResult>>,
    pub executed_at: u128,
    pub milliseconds: u128,
    pub success: bool,
    pub error_message: Option<String>
}

#[cfg(test)]
mod model_tests {
    use serde_json::{json, Value};

    use super::{
        Base64Data, Method, RequestBody, RequestGroup, RequestInfo, Workbook,
        WorkbookAuthorization, WorkbookEnvironment, WorkbookRequest, NameValuePair,
    };

    fn default_request() -> Vec<WorkbookRequest> {
        Vec::from([
            WorkbookRequest::Group(RequestGroup {
                id: String::from("group-1"),
                name: String::from("test-1"),
                requests: Box::new(Vec::from([WorkbookRequest::Info(RequestInfo {
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
                })])),
            }),
            WorkbookRequest::Info(RequestInfo {
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

    fn default_request_json() -> Value {
        json!([
            {
                "name": "test-1",
                "requests": [{
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
            requests: Vec::from([WorkbookRequest::Info(RequestInfo {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: Some(Method::Post),
                timeout: None,
                keep_alive: None,
                headers: None,
                query_string_params: None,
                body: None,
                test: None,
            })]),
            authorizations: None,
            environments: None,
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
            requests: Vec::from([WorkbookRequest::Info(RequestInfo {
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
            environments: None,
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
                    requests: Vec::from([WorkbookRequest::Info(RequestInfo {
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
                    environments: None,
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
            requests: Vec::from([WorkbookRequest::Info(RequestInfo {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                headers: Some(vec!(
                    NameValuePair { name: String::from("foo"), value: String::from("bar"), disabled: None }
                )),
                query_string_params: None,
                body: None,
                test: None,
            })]),
            authorizations: None,
            environments: None,
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
            requests: Vec::from([WorkbookRequest::Info(RequestInfo {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                headers: None,
                query_string_params: Some(vec![
                    NameValuePair {
                        name: String::from("foo"),
                        value: String::from("bar"),
                        disabled: None
                    }
                ]),
                body: None,
                test: None,
            })]),
            authorizations: None,
            environments: None,
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
            requests: Vec::from([WorkbookRequest::Info(RequestInfo {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                headers: None,
                query_string_params: None,
                body: Some(RequestBody::Text {
                    data: String::from("test123"),
                }),
                test: None,
            })]),
            authorizations: None,
            environments: None,
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
            requests: Vec::from([WorkbookRequest::Info(RequestInfo {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                headers: None,
                query_string_params: None,
                body: Some(RequestBody::JSON {
                    data: json!({"foo": "bar", "aaa": [1, 2, 3]}),
                }),
                test: None,
            })]),
            authorizations: None,
            environments: None,
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
            requests: Vec::from([WorkbookRequest::Info(RequestInfo {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                headers: None,
                query_string_params: None,
                body: Some(RequestBody::XML {
                    data: String::from("<foo></foo>"),
                }),
                test: None,
            })]),
            authorizations: None,
            environments: None,
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
            requests: Vec::from([WorkbookRequest::Info(RequestInfo {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                headers: None,
                query_string_params: None,
                body: Some(RequestBody::Base64(Base64Data {
                    data: Vec::from([84, 101, 115, 116, 105, 110, 103, 32, 49, 50, 51]),
                })),
                test: None,
            })]),
            authorizations: None,
            environments: None,
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
            requests: Vec::from([WorkbookRequest::Info(RequestInfo {
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
            environments: None,
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
    fn test_env_no_auths_or_envs() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": default_request_json()
        });
        let expected = Workbook {
            version: 0.1,
            requests: self::default_request(),
            authorizations: None,
            environments: None,
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
            "requests": default_request_json(),
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
            requests: self::default_request(),
            environments: None,
            authorizations: Some(vec![WorkbookAuthorization::Basic {
                name: String::from("test-basic"),
                username: String::from("foo"),
                password: String::from("bar"),
            }]),
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
            "requests": default_request_json(),
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
            requests: self::default_request(),
            environments: None,
            authorizations: Some(vec![WorkbookAuthorization::OAuth2Client {
                name: String::from("test-oauth2-client"),
                access_token_url: String::from("https://foo"),
                client_id: String::from("me"),
                client_secret: String::from("shhh"),
                scope: None,
                send_credentials_in_body: None,
            }]),
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
            "requests": default_request_json(),
            "authorizations": [
                {
                    "type": "OAuth2Client",
                    "name": "test-oauth2-client",
                    "accessTokenUrl": "https://foo",
                    "clientId": "me",
                    "clientSecret": "shhh",
                    "scope": "abc def",
                    "sendCredentialsInBody": true
                }
            ]
        });
        let expected = Workbook {
            version: 0.1,
            requests: self::default_request(),
            environments: None,
            authorizations: Some(vec![WorkbookAuthorization::OAuth2Client {
                access_token_url: String::from("https://foo"),
                name: String::from("test-oauth2-client"),
                client_id: String::from("me"),
                client_secret: String::from("shhh"),
                scope: Some(String::from("abc def")),
                send_credentials_in_body: Some(true),
            }]),
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
            "requests": default_request_json(),
            "authorizations": [
                {
                    "type": "ApiKey",
                    "name": "test-api-key",
                    "header": "foo",
                    "value": "bar"
                }
            ]
        });
        let expected = Workbook {
            version: 0.1,
            requests: self::default_request(),
            environments: None,
            authorizations: Some(vec![WorkbookAuthorization::ApiKey {
                name: String::from("test-api-key"),
                header: String::from("foo"),
                value: String::from("bar"),
            }]),
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
    fn test_env_deserialize() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": default_request_json(),
            "environments": [
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
            requests: self::default_request(),
            authorizations: None,
            environments: Some(vec![WorkbookEnvironment {
                name: String::from("foo"),
                variables: Some(vec!(
                    NameValuePair {name: String::from("abc"), value: String::from("xxx"), disabled: None},
                    NameValuePair {name: String::from("def"), value: String::from("yyy"), disabled: None},
                )),
            }]),
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
}
