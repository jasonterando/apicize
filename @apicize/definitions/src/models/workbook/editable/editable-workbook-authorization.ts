import { Editable } from '../../editable'
import { StateStorage } from '../../storage/state-storage';
import { WorkbookAuthorization } from "../workbook-authorization";

export interface EditableWorkbookAuthorization extends Editable, WorkbookAuthorization {
}

/**
 * Strip editable artifacts from editable authorization
 * @param authorization 
 * @returns 
 */
export function EditableWorkbookAuthorizationToAuthorization(authorization: EditableWorkbookAuthorization): WorkbookAuthorization {
    const cloned = structuredClone(authorization)
    cloned.dirty = undefined
    cloned.invalid = undefined
    return cloned
}