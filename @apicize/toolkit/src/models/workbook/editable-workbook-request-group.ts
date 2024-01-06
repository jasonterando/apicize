import { WorkbookRequestGroup } from "@apicize/common"
import { Editable } from "../editable"
import { EditableWorkbookRequestItem } from "./editable-workbook-request-item"

export interface EditableWorkbookRequestGroup extends Editable, WorkbookRequestGroup {
    requests: EditableWorkbookRequestItem[]
}

/**
 * Strip editable artifacts from group
 * @param requestGroup
 * @returns 
 */
export function EditableWorkbookRequestGroupToRequestGroup(requestItem: EditableWorkbookRequestGroup): WorkbookRequestGroup {
    const cloned = structuredClone(requestItem)
    cloned.dirty = undefined
    cloned.invalid = undefined
    return cloned
}