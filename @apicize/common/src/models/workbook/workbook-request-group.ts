import { Identifiable } from "../identifiable";
import { Named } from "../named";
import { WorkbookRequest } from "./workbook-request";

export interface WorkbookRequestGroup extends Identifiable, Named {
    id: string
    children: (WorkbookRequest | WorkbookRequestGroup)[]
    runs: number
}