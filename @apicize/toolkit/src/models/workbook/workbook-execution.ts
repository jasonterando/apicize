import { ApicizeResult } from "@apicize/lib-typescript";
import { EditableWorkbookRequestEntry } from "./editable-workbook-request-entry";
import { MAX_TEXT_RENDER_LENGTH } from "../../controls/viewers/text-viewer";

export interface WorkbookExecutionResult extends ApicizeResult {
     key: string;
     longTextInResponse: boolean;
}

interface IndexedText {
     index: number
     text: string
}


export interface WorkbookExecution {
     requestID: string
     running: boolean
     runIndex?: number
     resultIndex?: number
     runList?: IndexedText[]
     resultLists?: IndexedText[][]
     results?: WorkbookExecutionResult[][]
}

export function ApicizeRunResultsToWorkbookExecutionResults(runs: ApicizeResult[][], requests: { [id: string]: EditableWorkbookRequestEntry }) {
     return runs.map(results =>
          results.map(result => {
               return {
                    ...result,
                    key: `${result.requestId}-${result.run}-${result.totalRuns}}`,
                    longTextInResponse: (result.response?.body?.text?.length ?? 0) > MAX_TEXT_RENDER_LENGTH
               } as WorkbookExecutionResult
          })
     )
}