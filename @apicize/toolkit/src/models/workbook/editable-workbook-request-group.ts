import { WorkbookRequestGroup } from "@apicize/common"
import { Editable } from "../editable"
import { EditableWorkbookRequestEntry } from "./editable-workbook-request-entry"

export interface EditableWorkbookRequestGroup extends Editable, WorkbookRequestGroup {
    children: EditableWorkbookRequestEntry[]
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