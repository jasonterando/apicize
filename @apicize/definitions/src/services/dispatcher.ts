import { TestResponse } from "../models/test-response";
import { WorkbookAuthorization } from "../models/workbook/workbook-authorization";
import { WorkbookTest } from "../models/workbook/workbook-test";

export interface Dispatcher {
    dispatch(
        test: WorkbookTest,
        authorization?: WorkbookAuthorization
    ): Promise<TestResponse>;
}