import { Identifiable } from "../identifiable";
import { EditableWorkbookEnvironment } from "./editable/editable-workbook-environment";
import { NameValuePair } from "./workbook-request";

export const NO_ENVIRONMENT = '\0'

export interface WorkbookEnvironment extends Identifiable {
    variables?: NameValuePair[] 
}
