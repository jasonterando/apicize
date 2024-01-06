import { ApicizeResult } from "./lib/apicize-result"

export interface WorkbookExecution {
     requestID: string
     running: boolean
     result?: ApicizeResult
}
