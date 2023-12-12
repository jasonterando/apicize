import { WorkbookRequest } from "../workbook-request";
import { Editable } from "../../editable";
import { Result } from "../../result";
import { EditableNameValuePair } from "./editable-name-value-pair";

export interface EditableWorkbookRequest extends Editable, WorkbookRequest {
    running?: boolean
    result?: Result
}

/**
 * Strip editable artifacts from request
 * @param requestItem 
 * @returns 
 */
export function EditableWorkbookRequestToRequest(requestItem: EditableWorkbookRequest): WorkbookRequest {
    const cloned = structuredClone(requestItem)
    cloned.dirty = undefined
    cloned.invalid = undefined
    cloned.running = undefined
    console.log(`Setting item ${requestItem.id} result to undefined`)
    cloned.result = undefined
    cloned.headers?.forEach(h => {
        const h1 = h as EditableNameValuePair
        h1.isNew = undefined
    })
    cloned.queryStringParams?.forEach(q => {
        const q1 = q as EditableNameValuePair
        q1.isNew = undefined
    })
    return cloned
}
