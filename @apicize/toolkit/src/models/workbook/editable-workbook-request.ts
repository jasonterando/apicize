import { WorkbookRequest } from "@apicize/lib-typescript"
import { Editable } from "../editable"
import { EditableNameValuePair } from "./editable-name-value-pair"

export interface EditableWorkbookRequest extends Editable, WorkbookRequest {
    headers?: EditableNameValuePair[]
    queryStringParams?: EditableNameValuePair[]
}
