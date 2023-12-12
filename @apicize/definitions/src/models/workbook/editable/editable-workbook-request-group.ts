import { Editable } from "../../editable";
import { WorkbookRequestGroup } from "../workbook-request-group";

export interface EditableWorkbookRequestGroup extends Editable, WorkbookRequestGroup {
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