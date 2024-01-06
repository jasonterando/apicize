import { WorkbookRequest } from "@apicize/common"
import { Editable } from "../editable"
import { EditableNameValuePair } from "./editable-name-value-pair"

export interface EditableWorkbookRequest extends Editable, WorkbookRequest {
    headers?: EditableNameValuePair[]
    queryStringParams?: EditableNameValuePair[]
}
