//! Utility models submodule
//! 
//! This submodule defines utility functions used for serialization and deserialization


use uuid::Uuid;

/// Generate unique ID
pub fn generate_uuid() -> String {
    Uuid::new_v4().to_string()
}

/// Generate the value 1 for default, since serde doesn't suport literal defaults
pub fn one() -> u32 {
    1
}
