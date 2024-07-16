import { WorkbookProxy } from "@apicize/lib-typescript"
import { Editable } from "../editable"

export interface EditableWorkbookProxy extends Editable, WorkbookProxy {
}

/**
 * Strip editable artifacts from editable scenarios
 * @param authorization 
 * @returns 
 */
export function EditableWorkbookScenarioToScenario(proxy: EditableWorkbookProxy): WorkbookProxy {
    const cloned = structuredClone(proxy)
    cloned.dirty = undefined
    cloned.invalid = undefined
    return cloned
}
