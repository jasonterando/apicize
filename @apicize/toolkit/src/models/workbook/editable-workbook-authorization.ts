import { WorkbookAuthorization } from "@apicize/lib-typescript"
import { Editable } from "../editable"
import { WorkbookApiKeyAuthorization, WorkbookAuthorizationBase, WorkbookBasicAuthorization, WorkbookOAuth2ClientAuthorization } from "@apicize/lib-typescript/dist/models/workbook/workbook-authorization"

export interface EditableWorkbookAuthorization extends Editable, WorkbookAuthorizationBase {
}

export interface EditableWorkbookApiKeyAuthorization extends Editable, WorkbookApiKeyAuthorization {
}

export interface EditableWorkbookBasicAuthorization extends Editable, WorkbookBasicAuthorization {    
}

export interface EditableWorkbookOAuth2ClientAuthorization extends Editable, WorkbookOAuth2ClientAuthorization {    
}

/**
 * Strip editable artifacts from editable authorization
 * @param authorization 
 * @returns 
 */
export function EditableWorkbookAuthorizationToAuthorization(authorization: EditableWorkbookAuthorization): WorkbookAuthorizationBase {
    const cloned = structuredClone(authorization)
    cloned.dirty = undefined
    cloned.invalid = undefined
    return cloned
}