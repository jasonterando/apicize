import { action, makeObservable, observable } from "mobx";
import { RootStore } from "./root.store";
import { ApicizeExecutionResults, ApicizeRequest, ApicizeResult, ApicizeTestResult, WorkbookGroupExecution, WorkbookRequestGroup, WorkbookRequestType } from "@apicize/lib-typescript";
import { WorkbookExecution, WorkbookExecutionGroupSummary, WorkbookExecutionGroupSummaryRequest, WorkbookExecutionResult, WorkbookExecutionRun, WorkbookExecutionRunMenuItem } from "../models/workbook/workbook-execution";
import { ApicizeResponseBody } from "@apicize/lib-typescript/dist/models/lib/apicize-response";
import { MAX_TEXT_RENDER_LENGTH } from "../controls/viewers/text-viewer";

class WorkbookExecutionEntry implements WorkbookExecution {
    @observable accessor running = false
    @observable accessor runIndex = NaN
    @observable accessor resultIndex = NaN
    @observable accessor runs: WorkbookExecutionRunMenuItem[] = []

    @observable accessor panel = 'Info'
    @observable accessor results = new Map<string, WorkbookExecutionResult>()

    constructor() {
        makeObservable(this)
    }
}

export class ExecutionStore {
    @observable accessor requestExecutions = new Map<string, WorkbookExecution>()

    constructor(private readonly root: RootStore) {
        makeObservable(this)
    }

    getExecution(requestOrGroupId: string) {
        let execution = this.requestExecutions.get(requestOrGroupId)
        if (!execution) {
            execution = new WorkbookExecutionEntry()
            this.requestExecutions.set(requestOrGroupId, execution)
        }
        return execution
    }

    deleteExecution(requestOrGroupId: string) {
        this.requestExecutions.delete(requestOrGroupId)
    }

    getExecutionGroupSummary(requestOrGroupId: string, runIndex: number): WorkbookExecutionGroupSummary | undefined {
        return this.requestExecutions.get(requestOrGroupId)?.runs?.at(runIndex)?.groupSummary
    }

    getExecutionResult(requestOrGroupId: string, runIndex: number, resultIndex: number): WorkbookExecutionResult | undefined {
        return this.requestExecutions.get(requestOrGroupId)?.results?.get(`${runIndex}-${resultIndex}`)
    }

    getExecutionResultHeaders(requestOrGroupId: string, runIndex: number, resultIndex: number): { [name: string]: string } | undefined {
        return this.getExecutionResult(requestOrGroupId, runIndex, resultIndex)?.response?.headers
    }

    getExecutionResultBody(requestOrGroupId: string, runIndex: number, resultIndex: number): ApicizeResponseBody | undefined {
        return this.getExecutionResult(requestOrGroupId, runIndex, resultIndex)?.response?.body
    }

    getExecutionRequest(requestOrGroupId: string, runIndex: number, resultIndex: number): ApicizeRequest | undefined {
        return this.getExecutionResult(requestOrGroupId, runIndex, resultIndex)?.request
    }

    @action
    runStart(requestOrGroupId: string) {
        const match = this.requestExecutions.get(requestOrGroupId)
        if (match) {
            match.running = true
        } else {
            const newExecution = new WorkbookExecutionEntry()
            newExecution.running = true
            this.requestExecutions.set(requestOrGroupId, newExecution)
        }
    }

    @action
    runCancel(requestOrGroupId: string) {
        const match = this.requestExecutions.get(requestOrGroupId)
        if (match) {
            match.running = false
        }
    }

    @action
    runComplete(requestOrGroupId: string, executionResults: ApicizeExecutionResults | undefined) {
        const execution = this.requestExecutions.get(requestOrGroupId)
        const request = this.root.workspace.getRequest(requestOrGroupId)
        const group = request?.type === WorkbookRequestType.Group
            ? request as WorkbookRequestGroup
            : null

        if (!execution || !request) throw new Error(`Invalid ID ${requestOrGroupId}`)

        execution.running = false
        const previousPanel = execution.panel

        if (executionResults?.runs) {
            let runCtr = 0
            const newRunList: WorkbookExecutionRunMenuItem[] = []
            const newIndexedResults = new Map<string, WorkbookExecutionResult>()

            let allTestsSucceeded = true

            executionResults.runs.forEach((run, runIndex) => {
                const concurrent = group?.execution === WorkbookGroupExecution.Concurrent

                let executedAt = 0
                let milliseconds = 0
                let success = true
                let requests: WorkbookExecutionGroupSummaryRequest[] = []

                const results: { title: string, index: number }[] = []

                if (run.length > 1) {
                    results.push({ title: 'Summary', index: -1 })
                }

                run.forEach((result, resultIndex) => {
                    const index = `${runIndex}-${resultIndex}`
                    const resultRequest = this.root.workspace.getRequest(result.requestId)
                    results.push({ title: `${resultRequest?.name}`, index: resultIndex })
                    newIndexedResults.set(index, {
                        ...result,
                        hasRequest: !!result.request,
                        disableOtherPanels: !result.success,
                        longTextInResponse: (result.response?.body?.text?.length ?? 0) > MAX_TEXT_RENDER_LENGTH,
                        infoColor: result.success
                            ? (result.failedTestCount ?? -1) === 0
                                ? 'success'
                                : 'warning'
                            : 'error'
                    })

                    if (group) {
                        executedAt = Math.min(result.executedAt, executedAt)
                        milliseconds = concurrent
                            ? Math.max(result.milliseconds, milliseconds)
                            : result.milliseconds + milliseconds
                        success = success && result.success
                        const resultRequest = this.root.workspace.getRequest(result.requestId)
                        const requestName = (resultRequest && resultRequest.name.length > 0) ? resultRequest.name : '(Unnamed)'
                        if (allTestsSucceeded && result.tests) {
                            result.tests.forEach(test => allTestsSucceeded = allTestsSucceeded && test.success)
                        }
                        requests.push({
                            requestName,
                            status: result.response?.status,
                            statusText: result.response?.statusText,
                            milliseconds: result.milliseconds,
                            tests: result.tests,
                            errorMessage: result.errorMessage
                        })
                    }
                })


                newRunList.push({
                    title: `Run ${runIndex + 1} of ${executionResults.runs.length}`,
                    results,
                    groupSummary: group ? {
                        executedAt,
                        milliseconds,
                        success,
                        allTestsSucceeded,
                        requests,
                        infoColor: success
                            ? allTestsSucceeded
                                ? 'success'
                                : 'warning'
                            : 'error'

                    } : undefined
                })
            })

            execution.panel = (! group && previousPanel && allTestsSucceeded) ? previousPanel : 'Info'
            execution.runs = newRunList
            execution.results = newIndexedResults

            if (newRunList.length > 0) {
                execution.runIndex = 0
                const entry = newRunList[0]
                execution.resultIndex = entry
                    ? (entry.groupSummary ? -1: 0)
                    : 0
            }
        }
    }

    @action
    changePanel(requestOrGroupId: string, panel: string) {
        const match = this.requestExecutions.get(requestOrGroupId)
        if (match) {
            match.panel = panel
        }
    }

    @action
    changeRunIndex(requestOrGroupId: string, runIndex: number) {
        const execution = this.requestExecutions.get(requestOrGroupId)
        if (!execution) throw new Error(`Invalid Request ID ${requestOrGroupId}`)
        execution.runIndex = runIndex
    }

    @action
    changeResultIndex(requestOrGroupId: string, resultIndex: number) {
        const execution = this.requestExecutions.get(requestOrGroupId)
        if (!execution) throw new Error(`Invalid Request ID ${requestOrGroupId}`)
        execution.resultIndex = resultIndex
    }

}
