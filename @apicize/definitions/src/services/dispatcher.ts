import { ResultResponse } from "../models/result";
import { WorkbookAuthorization } from "../models/workbook/workbook-authorization";
import { WorkbookRequest } from "../models/workbook/workbook-request";

export interface Dispatcher {
    dispatch(
        abort: AbortSignal,
        test: WorkbookRequest,
        authorization?: WorkbookAuthorization
    ): Promise<ResultResponse>;
}