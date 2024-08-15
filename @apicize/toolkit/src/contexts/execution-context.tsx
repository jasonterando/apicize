import { useState, ReactNode, createContext, useCallback, useMemo, useContext } from "react";
import { ApicizeRunResultsToWorkbookExecutionResults, IndexedText } from "../models/workbook/workbook-execution";
import { ApicizeExecutionResults, ApicizeRequest, ApicizeTestResult } from "@apicize/lib-typescript";
import { GlobalStorageType } from "../models/global-storage";
import { ApicizeResponseBody } from "@apicize/lib-typescript/dist/models/lib/apicize-response";

export interface WorkbookExecutionInfo {
    running: boolean
    runIndex?: number
    runList?: IndexedText[]
    resultIndex?: number
    resultLists?: IndexedText[][]
    executedAt?: number
    milliseconds?: number
    panel?: string
}

export interface WorkbookExecutionResultSummary {
    requestId: string
    failedTestCount: number | undefined
    status: number | undefined
    statusText: string | undefined
    tests: ApicizeTestResult[] | undefined
    executedAt: number
    milliseconds: number
    success: boolean
    errorMessage: string | undefined
}

interface ExecutionContextType {
    running: Map<string, boolean>,

    clear: () => void,
    runStart: (requestOrGroupId: string) => void,
    runCancel: (requestOrGroupId: string) => void,
    runComplete: (requestOrGroupId: string, results: ApicizeExecutionResults | undefined) => void,
    getExecutionInfo: (requestOrGroupId: string) => WorkbookExecutionInfo | null,
    getExecutionSummary: (requestOrGroupId: string, runIndex: number, resultIndex: number) => WorkbookExecutionResultSummary[] | WorkbookExecutionResultSummary | null,
    getExecutionRequest: (requestOrGroupId: string, runIndex: number, resultIndex: number) => ApicizeRequest | null,
    getExecutionResultHeaders: (requestOrGroupId: string, runIndex: number, resultIndex: number) => { [name: string]: string } | null,
    getExecutionResultBody: (requestOrGroupId: string, runIndex: number, resultIndex: number) => ApicizeResponseBody | null,
    changePanel: (requestOrGroupId: string, panel: string) => void,
    changeRunIndex: (requestOrGroupId: string, runIndex: number) => void,
    changeResultIndex: (requestOrGroupId: string, resultIndex: number) => void,
}

const ExecutionContext = createContext<ExecutionContextType | undefined>(undefined)

export function useExecution() {
    const context = useContext(ExecutionContext);
    if (context === undefined) {
        throw new Error('useExecution must be used within a ExecutionProvider');
    }
    return context;
}

export const ExecutionProvider = ({ store, children }: { store: GlobalStorageType, children: ReactNode }) => {
    const [running, setRunning] = useState(new Map())
    const requestExecutions = store.requestExecutions
    const requests = store.workspace.requests

    const clear = useCallback(() => {
        setRunning(new Map())
    }, [])

    const runStart = (requestOrGroupId: string) => {
        const match = requestExecutions.get(requestOrGroupId)
        if (match) {
            match.running = true
            // match.results = undefined
        } else {
            requestExecutions.set(requestOrGroupId, {
                running: true,
                panel: 'Info'
            })
        }
        const updatedRunning = structuredClone(running)
        updatedRunning.set(requestOrGroupId, true)
        setRunning(updatedRunning)
    }

    const runCancel = (requestOrGroupId: string) => {
        const match = requestExecutions.get(requestOrGroupId)
        if (match) {
            match.running = false
            match.results = undefined
        }
        const updatedRunning = structuredClone(running)
        updatedRunning.set(requestOrGroupId, false)
        setRunning(updatedRunning)
    }

    const runComplete = (requestOrGroupId: string, results: ApicizeExecutionResults | undefined) => {
        const execution = requestExecutions.get(requestOrGroupId)
        if (!execution) throw new Error(`Invalid ID ${requestOrGroupId}`)

        execution.running = false
        execution.runList = []
        execution.resultLists = []
        if (results) {
            // Stop the executions
            const workbookResults = ApicizeRunResultsToWorkbookExecutionResults(results.runs)
            for (let runIndex = 0; runIndex < workbookResults.length; runIndex++) {
                execution.runList.push({ index: runIndex, text: `Run ${runIndex + 1} of ${workbookResults.length}` })
                const runResults = workbookResults[runIndex]
                const resultList = []
                for (let resultIndex = 0; resultIndex < runResults.length; resultIndex++) {
                    const request = requests.entities[runResults[resultIndex].requestId]
                    resultList.push({ index: resultIndex, text: `${request?.name ?? '(Unnamed)'}` })
                }
                execution.resultLists.push(resultList)
            }
            execution.results = workbookResults
            execution.runIndex = workbookResults.length > 0 ? 0 : undefined
            execution.resultIndex = workbookResults.length > 0 && workbookResults[0].length > 1 ? -1 : 0
            execution.milliseconds = results.milliseconds
        }

        const updatedRunning = structuredClone(running)
        updatedRunning.set(requestOrGroupId, false)
        setRunning(updatedRunning)
    }

    const getExecutionInfo = (requestOrGroupId: string) => {
        const match = requestExecutions.get(requestOrGroupId)
        if (match) {
            return {
                running: match.running,
                runIndex: match.runIndex,
                runList: match.runList,
                resultIndex: match.resultIndex,
                resultLists: match.resultLists,
                executedAt: match.executedAt,
                milliseconds: match.milliseconds,
                panel: match.panel
            }
        } else {
            return null
        }
    }

    const getExecutionRun = (requestOrGroupId: string, runIndex: number) => {
        const match = requestExecutions.get(requestOrGroupId)
        if (match && match.results && runIndex < match.results.length) {
            return match.results[runIndex]
        } else {
            return null
        }
    }

    const getExecutionRunResult = (requestOrGroupId: string, runIndex: number, resultIndex: number) => {
        const match = getExecutionRun(requestOrGroupId, runIndex)
        if (match && resultIndex < match.length) {
            return match[resultIndex]
        } else {
            return null
        }
    }

    const getExecutionSummary = (requestOrGroupId: string, runIndex: number, resultIndex: number):
        WorkbookExecutionResultSummary | WorkbookExecutionResultSummary[] | null => {
        const match = getExecutionRun(requestOrGroupId, runIndex)
        if (match) {
            if (resultIndex === -1) {
                return match.map(result => ({
                    requestId: result.requestId,
                    failedTestCount: result.failedTestCount,
                    status: result.response?.status,
                    statusText: result.response?.statusText,
                    tests: result.tests,
                    executedAt: result.executedAt,
                    milliseconds: result.milliseconds,
                    success: result.success,
                    errorMessage: result.errorMessage
                }))
            } else if (resultIndex < match.length) {
                const result = match[resultIndex]
                return {
                    requestId: result.requestId,
                    failedTestCount: result.failedTestCount,
                    status: result.response?.status,
                    statusText: result.response?.statusText,
                    tests: result.tests,
                    executedAt: result.executedAt,
                    milliseconds: result.milliseconds,
                    success: result.success,
                    errorMessage: result.errorMessage
                }
            }
        }
        return null
    }

    const getExecutionRequest = (requestOrGroupId: string, runIndex: number, resultIndex: number) => {
        const match = getExecutionRunResult(requestOrGroupId, runIndex, resultIndex)
        return match?.request ?? null
    }

    const getExecutionResultHeaders = (requestOrGroupId: string, runIndex: number, resultIndex: number) => {
        const match = getExecutionRunResult(requestOrGroupId, runIndex, resultIndex)
        return match?.response?.headers ?? null
    }

    const getExecutionResultBody = (requestOrGroupId: string, runIndex: number, resultIndex: number) => {
        const match = getExecutionRunResult(requestOrGroupId, runIndex, resultIndex)
        return match?.response?.body ?? null
    }

    const changePanel = (requestOrGroupId: string, panel: string) => {
        const match = requestExecutions.get(requestOrGroupId)
        if (match) {
            match.panel = panel
        }
    }

    const changeRunIndex = (requestOrGroupId: string, runIndex: number) => {
        const execution = requestExecutions.get(requestOrGroupId)
        if (!execution) throw new Error(`Invalid ID ${requestOrGroupId}`)
        execution.runIndex = runIndex
    }

    const changeResultIndex = (requestOrGroupId: string, resultIndex: number) => {
        const execution = requestExecutions.get(requestOrGroupId)
        if (!execution) throw new Error(`Invalid ID ${requestOrGroupId}`)
        execution.resultIndex = resultIndex
    }

    const value = useMemo(
        () => ({
            running,
            clear, runStart, runCancel, runComplete, getExecutionInfo, getExecutionRequest, getExecutionSummary, getExecutionResultHeaders, getExecutionResultBody,
            changePanel, changeRunIndex, changeResultIndex,
        }),
        [
            running,
            clear, runStart, runCancel, runComplete, getExecutionInfo, getExecutionRequest, getExecutionSummary, getExecutionResultHeaders, getExecutionResultBody, changePanel,
        ]
    )

    return <ExecutionContext.Provider value={value}>{children}</ExecutionContext.Provider>
}
