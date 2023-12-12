import { Editable } from "../../editable";
import { Result } from "../../result";
import { WorkbookEnvironment } from "../workbook-environment";

export interface EditableWorkbookEnvironment extends Editable, WorkbookEnvironment {
}

/**
 * Strip editable artifacts from editable authorization
 * @param authorization 
 * @returns 
 */
export function EditableWorkbookEnvironmentToEnvironment(environment: EditableWorkbookEnvironment): WorkbookEnvironment {
    const cloned = structuredClone(environment)
    cloned.dirty = undefined
    cloned.invalid = undefined
    return cloned
}
