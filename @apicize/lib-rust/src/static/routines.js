let logs = []
appendLog = (type, message, ...optionalParams) => {
    logs.push(`${(new Date()).toTimeString().replace(' ()', '')} [${type}] ${format(message, ...optionalParams)}`)
}
clearLog = () => logs = [];

console = {
    log: (msg, ...args) => appendLog('log', msg, ...args),
    info: (msg, ...args) => appendLog('info', msg, ...args),
    warn: (msg, ...args) => appendLog('warn', msg, ...args),
    error: (msg, ...args) => appendLog('error', msg, ...args),
    trace: (msg, ...args) => appendLog('trace', msg, ...args),
    debug: (msg, ...args) => appendLog('debug', msg, ...args),
};

var request = {};
var response = {};
var scenario = {};
var names = [];
var inIt = false;
var results = [];

function pushResult(result) {
    results.push({
        ...result,
        logs: logs.length > 0 ? logs : undefined
    });
}

function describe(name, run) {
    names.push(name);
    try {
        run()
    } finally {
        names.pop();
    }
}

function it(behavior, run) {
    try {
        if (inIt) {
            throw new Error('\"it\" cannot be contained in another \"it\" block')
        }
        if (names.length === 0) {
            throw new Error('\"it\" must be contained in a \"describe\" block');
        }
        inIt = true;
        run();
        pushResult({ testName: [...names, behavior], success: true });
        clearLog();
    } catch (e) {
        pushResult({ testName: [...names, behavior], success: false, error: e.message })
        clearLog()
    } finally {
        inIt = false
    }
}

const runTestSuite = (request1, response1, scenario1, testSuite) => {
    request = request1;
    response = response1;
    scenario = Object.fromEntries(scenario1?.variables?.filter(v => v.disabled !== true).map(v => [v.name, v.value]) ?? []);
    names = []
    clearLog()
    results = []
    testSuite()
    if (! scenario) scenario = {
        id: `temp-${Date.now()}`,
        name: 'temp',
        variables: []
    }
    for(const [name, value] of Object.entries(scenario)) {
        const match = scenario1.variables.find(v => v.name === name)
        if (match) {
            match.value = value
        } else {
            scenario1.variables.push({name, value})
        }
    }
    return JSON.stringify({
        results,
        scenario: scenario1
    })
};