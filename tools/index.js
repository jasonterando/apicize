// Stub enough of process to make browserify's util happy...
process = { env: {} }

let chai = require('chai')
let util = require('./node_modules/util/util');
assert = chai.assert;
expect = chai.expect;
should = chai.should;

