import { WorkbookNameValuePair, WorkbookRequest } from "@apicize/lib-typescript"
import { Editable } from "../editable"
import { EditableNameValuePair } from "./editable-name-value-pair"
import { EntitySelection } from "./entity-selection"

export interface EditableWorkbookRequest extends Editable, WorkbookRequest {
    headers?: EditableNameValuePair[]
    queryStringParams?: EditableNameValuePair[]
}
