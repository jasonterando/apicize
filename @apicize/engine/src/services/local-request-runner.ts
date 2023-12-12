import { Dispatcher, EditableWorkbookRequest, RequestRunner, Result, WorkbookAuthorization, WorkbookEnvironment, WorkbookRequest } from "@apicize/definitions"
import mime from 'mime'
import { TestEvaluationService } from "./test-evaluation-service";
import { RequestPreparation } from "./request-preparation";

export class LocalRequestRunner implements RequestRunner {
    
    private _abortControllers = new Map<string, [AbortController, boolean]>()

    public constructor(private readonly dispatcher: Dispatcher, private readonly evaluator: TestEvaluationService) { }

    /**
     * Keep track of the abort controller for the specifried ID
     * @param id Request ID
     * @param abort Abort controller if specified (clears if not)
     */
    private setAbortController(id: string, abort: AbortController) {
        this._abortControllers.set(id, [abort, false])
    }

    private clearAbortController(id: string) {
        this._abortControllers.delete(id)
    }

    /**
     * If the specified request has an active call, its abort controller is triggered
     * @param request
     */
    public cancel(ids: string[]) {
        ids.forEach(id => {
            const match = this._abortControllers.get(id)
            if (match) {
                match[1] = true
                this._abortControllers.set(id, match)
                match[0].abort()
            }
        })
    }

    /**
     * Run the specified requests
     * @param requests 
     * @param authorization 
     * @returns Run results
     */
    public async run(
        requests: EditableWorkbookRequest[],
        authorization: WorkbookAuthorization,
        environment: WorkbookEnvironment): Promise<Result[]> {
        const results = []

        const preparer = new RequestPreparation(environment)

        for (const request of requests) {
            const cloned = preparer.cloneRequest(request)
            const now = new Date();
            const executionTime = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
            const timerStart = performance.now()
            const abortController = new AbortController()
            this.setAbortController(request.id, abortController)

            try {
                const timeout = request.timeout ?? 60000
                const abortTimeout = setTimeout(() => {
                    abortController.abort()
                }, timeout) // Default to 1 minute timeout
        
                const response = await this.dispatcher.dispatch(abortController.signal, cloned, authorization)

                clearTimeout(abortTimeout)

                const contentTypeHeader = Object.keys(response.headers).find(h => h.toLowerCase() === 'content-type')
                const extension = contentTypeHeader
                    ? mime.getExtension(response.headers[contentTypeHeader])
                    : undefined

                const result: Result = {
                    requestID: request.id,
                    success: true,
                    milliseconds: performance.now() - timerStart,
                    executionTime,
                    response,
                    request: cloned,
                    extension: extension ?? undefined // make sure we don't return null
                }

                if (request.test && (request.test.length ?? 0) > 0) {
                    try {
                        result.tests = this.evaluator.evaluate(request.test, response)
                    } catch(e1) {
                        result.success = false
                        result.errorMessage = `Unable to run tests (${e1})`
                    }
                }

                results.push(result)
            } catch(e) {
                let msg: string | undefined
                if (e instanceof Error && e.name === 'AbortError') {
                    const match = this._abortControllers.get(request.id)
                    if (match) {
                        msg = match[1] ? 'Request Cancelled' : 'Request Timed Out'
                    } else {
                        msg = e.message
                    }
                }
                results.push({
                    requestID: request.id,
                    success: false,
                    errorMessage: msg ?? `${e}`,
                    milliseconds: performance.now() - timerStart,
                    executionTime,
                    request: cloned
                })
            } finally {
                this.clearAbortController(request.id)
            }
        }
        return results
    }
}