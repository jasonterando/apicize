# List of stuff that needs to be done

### Encrypt or remove privileged authentication configuration (GUI and CLI)

Give the user the option to symmetrically encrypt or remove passwords, API keys, etc.

### Fix scrollbars and sizing (GUI)

Improve positioning and sizing of nested panels, scrolling, input controls, etc. 

### Reduce cloning in lib if possible (LIB)

Figure out if lifecycles, Box, etc. can be used to reduce cloning when making async calls to web and V8.  May be easier to nuke
async and use threading instead.

### Allow updating of Scenario from V8 scripts (LIB)

Support adding or updating scenario values from V8, allow the user to save a result value for use in subsequent request tests in the same group

### Reporting Formats (CLI)

Add support for writing to "standard" report formats

## Testing

Once design appears to be on a stable footing, write unit and integration tests, especially in lib-rust