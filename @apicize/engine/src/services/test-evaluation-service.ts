import vm from 'node:vm'

import { expect, assert, should } from 'chai'
import { ResultResponse } from '@apicize/definitions'
import * as util from 'node:util'


export class TestEvaluationService {

    public evaluate(code: string, response: ResultResponse) {

        const results: { name: string, success: boolean, logs: string[], error?: string }[] = []

        let names: string[] = []
        let logs: string[] = []
        let inIt = false

        const describe = (name: string, run: () => void) => {
            names.push(name)
            try {
                run()
            } finally {
                names.pop()
            }
        }

        const it = (behavior: string, run: () => void) => {
            try {
                if (inIt) {
                    throw new Error('"it" cannot be contained in another "it" block')
                }
                if (names.length === 0) {
                    throw new Error('"it" must be contained in a "describe" block');
                }
                inIt = true
                run();
                results.push({ name: [...names, behavior].join(' '), logs, success: true })
                clearLog()
                // console.log(`[PASS] ${[...names, behavior].join(' ')}`)
            } catch (e) {
                // console.log(`[FAIL] ${[...names, behavior].join(' ')}: ${(e as Error).message}`)
                results.push({ name: [...names, behavior].join(' '), success: false, logs, error: (e as Error).message })
                clearLog()
            } finally {
                inIt = false
            }
        }

        const appendLog = (type: string, message?: any, ...optionalParams: any[]) =>
            logs.push(`${(new Date()).toLocaleTimeString()} [${type}] ${util.format(message, ...optionalParams)}`)

        const clearLog = () => logs = [];

        const context = vm.createContext({
            response,
            console: {
                log: (message?: any, ...optionalParams: any[]) => {
                    appendLog('LOG', message, ...optionalParams)
                },
                trace: (message?: any, ...optionalParams: any[]) => {
                    appendLog('TRACE', message, ...optionalParams)
                },
                info: (message?: any, ...optionalParams: any[]) => {
                    appendLog('INFO', message, ...optionalParams)
                },
                warn: (message?: any, ...optionalParams: any[]) => {
                    appendLog('WARN', message, ...optionalParams)
                },
                error: (message?: any, ...optionalParams: any[]) => {
                    appendLog('ERROR', message, ...optionalParams)
                },
            },
            appendLog,
            clearLog,
            logs,
            describe,
            it,
            expect,
            assert,
            should: should()
        })

        vm.runInContext(code, context, { timeout: 10000 })

        return results
    }
}