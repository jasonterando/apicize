import { Identifiable } from "../identifiable";
import { Named } from "../named";
import { WorkbookNameValuePair } from "./workbook-request";

export const NO_ENVIRONMENT = '\0'

export interface WorkbookEnvironment extends Identifiable, Named {
    variables?: WorkbookNameValuePair[] 
}
