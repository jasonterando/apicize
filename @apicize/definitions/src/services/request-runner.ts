import { Result } from "../models/result";
import { EditableWorkbookRequest } from "../models/workbook/editable/editable-workbook-request";
import { WorkbookAuthorization } from "../models/workbook/workbook-authorization";
import { WorkbookEnvironment } from "../models/workbook/workbook-environment";

export type RunRequestsFunction = (
    requests: EditableWorkbookRequest[],
    authorization: WorkbookAuthorization,
    environment: WorkbookEnvironment) => Promise<Result[]>
export type CancelRequestsFunction = (ids: string[]) => void

export interface RequestRunner {
    run: RunRequestsFunction
    cancel: CancelRequestsFunction
}