import { ApicizeResult } from "@apicize/common";
import { EditableWorkbookRequestEntry } from "./editable-workbook-request-entry";
import { MAX_TEXT_RENDER_LENGTH } from "../../controls/viewers/text-viewer";

export interface WorkbookExecutionResult extends ApicizeResult {
     key: string;
     name: string;
     longTextInResponse: boolean;
}

export interface WorkbookExecution {
     requestID: string
     running: boolean
     results?: WorkbookExecutionResult[]
}

export function ApicizeResultsToWorkbookExecutionResult(results: ApicizeResult[], requests: {[id: string]: EditableWorkbookRequestEntry}) {
     return results.map(result => {
          const entry = requests[result.requestId]?.name ?? '(Unnamed)'
          const name = result.totalAttempts > 1 ? `${entry} ${result.attempt + 1} of ${result.totalAttempts}` : entry
          return {
               ...result,
               key: `${result.requestId}-${result.attempt}-${result.totalAttempts}}`,
               name,
               longTextInResponse: (result.response?.body?.text?.length ?? 0) > MAX_TEXT_RENDER_LENGTH
          } as WorkbookExecutionResult
     });
}