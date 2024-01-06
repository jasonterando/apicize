import { Named } from "../named";
import { WorkbookRequest } from "./workbook-request";

export interface WorkbookRequestGroup extends Named {
    requests: (WorkbookRequest | WorkbookRequestGroup)[]
}