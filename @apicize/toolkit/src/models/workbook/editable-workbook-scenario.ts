import { WorkbookScenario } from "@apicize/common"
import { Editable } from "../editable"
import { EditableNameValuePair } from "./editable-name-value-pair"

export interface EditableWorkbookScenario extends Editable, WorkbookScenario {
    variables?: EditableNameValuePair[] 
}

/**
 * Strip editable artifacts from editable scenarios
 * @param authorization 
 * @returns 
 */
export function EditableWorkbookScenarioToScenario(scenario: EditableWorkbookScenario): WorkbookScenario {
    const cloned = structuredClone(scenario)
    cloned.dirty = undefined
    cloned.invalid = undefined
    return cloned
}
