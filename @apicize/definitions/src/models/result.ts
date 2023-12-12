import { WorkbookRequest } from "./workbook/workbook-request"

export interface Result {
     requestID: string
     success: boolean
     errorMessage?: string
     response?: ResultResponse
     extension?: string
     executionTime: string
     milliseconds?: number
     request: WorkbookRequest
     tests?: TestResult[]
}

export type TestResult = { name: string, success: boolean, logs: string[], error?: string }

export interface ResultResponse {
     headers: { [name: string]: string }
     ok: boolean
     status: number
     statusText: string
     url: string
     redirected: boolean

     text?: string
     base64?: string
}