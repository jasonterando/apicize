import vm from 'node:vm';
// import { run } from 'node:test'
import util from 'util';
import nodeTest from 'node:test';
import assert from 'node:assert';
import { spec, tap, dot } from 'node:test/reporters';
import { text } from 'node:stream/consumers';

// const isolated = require('isolated-vm')
import isolated from 'isolated-vm'
const { Callback } = isolated

interface Result {
    name: string
    success: boolean,
    duration: number,
    error?: string,
    logs?: string[]
}

let testFiles: string[]
let testRunnerComplete: (results: string) => void
let testRunnerError: (error: Error) => void
let result: string

const testRunner = async () => {
    testRunnerComplete(await text(
        nodeTest.run({
            files: testFiles
        })
        .compose(tap)
    ));
};


const getTapDataAsync = (filesToTest: string[]) => {
    testFiles = filesToTest
    return new Promise(async (resolve, reject) => {
        testRunnerComplete = (results: string) => resolve(results)
        testRunnerError = (error: Error) => reject(error)
        let isolate;
        try {
            isolate = new isolated.Isolate({
                memoryLimit: 128
            })


            let logs: string[] = []
            const appendLog = (type: string, message?: any, ...optionalParams: any[]) => {
                console.log('appending ' + message)
                logs.push(`${(new Date()).toLocaleTimeString()} [${type}] ${util.format(message, ...optionalParams)}`)
            }

            let results: Result[] = [];

            const context = isolate.createContextSync();
            await context.global.set('foo', 1);

            await context.global.set('test', () => { console.log('foo' )});
            await context.global.set('pushResult', new Callback((result: Result) => results.push({
                ...result,
                logs: logs.length > 0 ? logs : undefined
            })));
            await context.global.set('clearLog', new Callback(() => logs = []));

            await context.global.set('log', new Callback((msg?: any, ...params: any[]) => appendLog('log', msg, ...params)))
            await context.global.set('info', new Callback((msg?: any, ...params: any[]) => appendLog('info', msg, ...params)))
            await context.global.set('warn', new Callback((msg?: any, ...params: any[]) => appendLog('warn', msg, ...params)))
            await context.global.set('error', new Callback((msg?: any, ...params: any[]) => appendLog('error', msg, ...params)))
            await context.global.set('debug', new Callback((msg?: any, ...params: any[]) => appendLog('debug', msg, ...params)))
            await context.global.set('trace', new Callback((msg?: any, ...params: any[]) => appendLog('trace', msg, ...params)))

            await context.global.set('assert', new Callback(assert));
            await context.global.set('equal', new Callback(assert.equal));



            await context.eval(`
                const names = [];
                let inIt = false;
                const console = {
                    log,
                    info,
                    warn,
                    error,
                    trace,
                    debug
                };
                const assert = {
                    equal
                };
                const describe = (name, run) => {
                    names.push(name);
                    try {
                        run()
                    } finally {
                        names.pop();
                    }
                }
                const it = (behavior, run) => {
                    try {
                        if (inIt) {
                            throw new Error('\"it\" cannot be contained in another \"it" block')
                        }
                        if (names.length === 0) {
                            throw new Error('\"it\" must be contained in a "describe" block');
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

                describe('foo', () => {
                    describe('bar', () => {
                        it('should be ok', () => {
                            console.trace('Here!');
                            assert.equal(1, 1);
                        });
                    });
                });
            `)
            resolve(results);
            // resolve(`Foo is now ${await context.global.get('foo')}`)
        // const context = isolate.createContext({
        //     testFiles,
        //     testRunner,
        //     require: () => { throw new Error('You shall not pass!') }
        // })
        // vm.runInContext(`testRunner()`, context, { timeout: 10000 })
        } finally {
            if (isolate) isolate.dispose();
        }
    });
};

(async () => {
    const results = await getTapDataAsync(['test.js'])
    console.log('Results', results)
})().then(() => {
    console.log('Done!')
}).catch((e) => {
    console.error(e)
})