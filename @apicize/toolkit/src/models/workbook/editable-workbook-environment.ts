import { WorkbookEnvironment } from "@apicize/common"
import { Editable } from "../editable"
import { EditableNameValuePair } from "./editable-name-value-pair"

export interface EditableWorkbookEnvironment extends Editable, WorkbookEnvironment {
    variables?: EditableNameValuePair[] 
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
