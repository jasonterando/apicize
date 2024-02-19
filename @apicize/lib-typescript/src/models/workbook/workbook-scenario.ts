import { Identifiable } from "../identifiable";
import { Named } from "../named";
import { WorkbookNameValuePair } from "./workbook-request";

export const NO_SCENARIO = '\0'

export interface WorkbookScenario extends Identifiable, Named {
    variables?: WorkbookNameValuePair[] 
}
