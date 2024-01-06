import { Named } from "../named";
import { NameValuePair } from "./workbook-request";

export const NO_ENVIRONMENT = '\0'

export interface WorkbookEnvironment extends Named {
    variables?: NameValuePair[] 
}
