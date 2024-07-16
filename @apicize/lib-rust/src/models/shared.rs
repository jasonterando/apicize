//! Shared models submodule
//! 
//! This submodule defines information used globally

use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use serde_with::base64::{Base64, Standard};
use serde_with::formats::Unpadded;
use serde_with::serde_as;
use serde_json::Value;
use std::fmt::Debug;
use std::{fs, io};
use std::path::{Path, PathBuf};
use thiserror::Error;

use crate::{IndexedEntities, WorkbookAuthorization, WorkbookCertificate, WorkbookProxy, WorkbookScenario};

/// Trait to describe oneself
pub trait Identifyiable {
    /// Return ID and name of object
    fn get_id_and_name(&self) -> (String, String);
}

/// Trait to describe how an entity will be persisted
pub trait Persistable {
    /// Get persistence
    fn get_persistence(&self) -> Persistence;

    /// Set persistence
    fn set_persistence(&self, persistence_to_set: Persistence);
}

/// Types of selectable request/group options
pub enum SelectableOptionType {
    /// Selectable scenario
    Scenario,
    /// Selectdable authorization
    Authorization,
    /// Selectable certificate
    Certificate,
    /// Selectable proxy
    Proxy,
}

impl SelectableOptionType {
    /// Convert to readable string
    pub fn as_str(&self) -> &'static str {
        match self {
            SelectableOptionType::Scenario => "scenario",
            SelectableOptionType::Authorization => "authorization",
            SelectableOptionType::Certificate => "certificate",
            SelectableOptionType::Proxy => "proxy",
        }
    }
}

/// Whether a missing selectable option defaults to the parent or to None
pub enum SelectableOptionDefaultType {
    /// The request/group parent will be used as a default if no value is provided
    Parent,
    /// No default will be used if no value is provided
    None,
}

impl SelectableOptionDefaultType {
    /// Render default type as a string
    pub fn as_str(&self) -> &'static str {
        match self {
            SelectableOptionDefaultType::Parent => "parent",
            SelectableOptionDefaultType::None => "none",
        }
    }
}

/// Trait indicating scenarios, authorizations, etc. can be 
pub trait SelectableOptions {
    /// Validate all selections
    fn validate_selections(
        &self,
        scenarios: &IndexedEntities<WorkbookScenario>,
        authorizations: &IndexedEntities<WorkbookAuthorization>,
        certificates: &IndexedEntities<WorkbookCertificate>,
        proxies: &IndexedEntities<WorkbookProxy>,
        default_type: &SelectableOptionDefaultType,
    ) -> Option<Vec<String>>;

    /// Get selected scenario, if any
    fn get_selected_scenario(&self) -> &Option<Selection>;

    /// Get selected authorization, if any
    fn get_selected_authorization(&self) -> &Option<Selection>;

    /// Get selected certificate, if any
    fn get_selected_certificate(&self) -> &Option<Selection>;

    /// Get selected proxy, if any
    fn get_selected_proxy(&self) -> &Option<Selection>;

    /// Set selected scenario, if any
    fn set_scenario(&mut self, value: Option<Selection>);

    /// Set selected authorization, if any
    fn set_authorization(&mut self, value: Option<Selection>);

    /// Set selected certificate, if any
    fn set_certificate(&mut self, value: Option<Selection>);

    /// Set selected proxy, if any
    fn set_proxy(&mut self, value: Option<Selection>);
}

/// Enumeration of HTTP methods
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

/// Specifies persistence options for non-request entities
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone, Copy)]
#[serde(rename_all = "UPPERCASE")]
pub enum Persistence {
    /// Shared configuration file
    Global,
    /// Workbook private information file
    Private,
    /// Workbook file
    Workbook,
}

/// Implement helpers for setting serde default values
impl Persistence {
    /// Return the private enum value for setting persistence defaults
    pub fn private() -> Self { Persistence::Private }
    /// Return the Shared enum value for setting persistence defaults
    pub fn global() -> Self { Persistence::Global }
}

/// Information about a selected entity, include both ID and name
/// to give the maximum chance of finding a match
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]

pub struct Selection {
    /// ID of selected entity
    pub id: String,
    /// Name of selected entity
    pub name: String,
}

/// Open the specified data file
pub fn open_data_file<'a, T: DeserializeOwned>(input_file_name: &PathBuf) -> Result<SerializationOpenSuccess<T>, SerializationFailure> {
    let file_name = String::from(input_file_name.to_string_lossy());
    match fs::read_to_string(input_file_name) {
        Ok(text) => {
            match serde_json::from_str::<T>(&text) {
                Ok(data) => {
                    Ok(SerializationOpenSuccess {
                        file_name,
                        data,
                    })
                },
                Err(err) => {
                    Err(SerializationFailure {
                        file_name,
                        error: SerializationError::JSON(err)
                    })
                }

            }
        },
        Err(err) => {
            Err(SerializationFailure {
                file_name,
                error: SerializationError::IO(err)
            })
        }
    } 
}

/// Save the specified data file
pub fn save_data_file<'a, T: Serialize>(output_file_name: &PathBuf, data: &T) -> Result<SerializationSaveSuccess, SerializationFailure> {
    let file_name = String::from(output_file_name.to_string_lossy());
    match serde_json::to_string(data) {
        Ok(text) => {
            match fs::write(output_file_name, text) {
                Ok(()) => {
                    Ok(SerializationSaveSuccess {
                        file_name,
                        operation: SerializationOperation::Save
                    })
                },
                Err(err) => {
                    Err(SerializationFailure {
                        file_name,
                        error: SerializationError::IO(err)
                    })
                }
            }
        },
        Err(err) => {
            Err(SerializationFailure {
                file_name,
                error: SerializationError::JSON(err)
            })
        }
    }
}    

/// Delete the specified file, if it exists
pub fn delete_data_file(delete_file_name: &PathBuf) -> Result<SerializationSaveSuccess, SerializationFailure> {
    let file_name = String::from(delete_file_name.to_string_lossy());
    if Path::new(&delete_file_name).is_file() {
        match fs::remove_file(delete_file_name) {
            Ok(()) => {
                Ok(SerializationSaveSuccess {
                    file_name,
                    operation: SerializationOperation::Delete
                })
            },
            Err(err) => {
                Err(SerializationFailure {
                    file_name,
                    error: SerializationError::IO(err)
                })
            }
        }
    } else {
        Ok(SerializationSaveSuccess {
            file_name,
            operation: SerializationOperation::None
        })

    }
}

/// File operation
pub enum SerializationOperation {
    /// File saved
    Save,
    /// File deleted
    Delete,
    /// No operation taken
    None
}

/// Information on open success, including data
pub struct SerializationOpenSuccess<T> {
    /// Name of file that was opened or saved
    pub file_name: String,
    /// Data
    pub data: T,
}


/// Information on save success
pub struct SerializationSaveSuccess {
    /// Name of file that was opened or saved
    pub file_name: String,
    /// File operation
    pub operation: SerializationOperation,
}

/// Information about I/O failure
pub struct SerializationFailure {
    /// Name of file that was opened or saved
    pub file_name: String,
    /// Error on serialization/deserialization
    pub error: SerializationError
}

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
