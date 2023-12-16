// Stub enough of process to make browserify's util happy...
process = { env: {} }

let chai = require('chai')
let util = require('./node_modules/util/util')
assert = chai.assert;
expect = chai.expect;
should = chai.should;

let logs = []
appendLog = (type, message, ...optionalParams) => {
    logs.push(`${(new Date()).toTimeString()} [${type}]  ${util.format(message, ...optionalParams)}`)
}
clearLog = () => logs = [];

console.log

console = {
    log: (msg, ...args) => appendLog('log', msg, ...args),
    info: (msg, ...args) => appendLog('info', msg, ...args),
    warn: (msg, ...args) => appendLog('warn', msg, ...args),
    error: (msg, ...args) => appendLog('error', msg, ...args),
    trace: (msg, ...args) => appendLog('trace', msg, ...args),
    debug: (msg, ...args) => appendLog('debug', msg, ...args),
};


const names = [];
let inIt = false;

results = [];
pushResult = (result) => results.push({
    ...result,
    logs: logs.length > 0 ? logs : undefined
});

describe = (name, run) => {
    names.push(name);
    try {
        run()
    } finally {
        names.pop();
    }
}
it = (behavior, run) => {
    try {
        if (inIt) {
            throw new Error('\"it\" cannot be contained in another \"it\" block')
        }
        if (names.length === 0) {
            throw new Error('\"it\" must be contained in a \"describe\" block');
        }
        inIt = true;
        run();
        pushResult({ name: [...names, behavior].join(' '), success: true });
        clearLog();
    } catch (e) {
        pushResult({ name: [...names, behavior].join(' '), success: false, error: e.message })
        clearLog()
    } finally {
        inIt = false
    }
}
