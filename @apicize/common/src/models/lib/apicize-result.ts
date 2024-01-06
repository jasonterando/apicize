import { ApicizeRequest } from "./apicize-request";
import { ApicizeResponse } from "./apicize-response";
import { ApicizeTestResult } from "./apicize-test-result";


export interface ApicizeResult {
    request?: ApicizeRequest,
    response?: ApicizeResponse,
    tests?: ApicizeTestResult[],
    executedAt: number,
    milliseconds: number,
    errorMessage?: string,
}

export type ApicizeResults = { [id: string]: ApicizeResult }

