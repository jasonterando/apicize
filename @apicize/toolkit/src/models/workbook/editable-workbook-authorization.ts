import { Editable } from "../editable"
import { WorkbookApiKeyAuthorization, WorkbookBaseAuthorization, WorkbookBasicAuthorization, WorkbookOAuth2ClientAuthorization } from "@apicize/lib-typescript/dist/models/workbook/workbook-authorization"

export interface EditableWorkbookAuthorization extends Editable, WorkbookBaseAuthorization {
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
export function EditableWorkbookAuthorizationToAuthorization(authorization: EditableWorkbookAuthorization): WorkbookBaseAuthorization {
    const cloned = structuredClone(authorization)
    delete cloned.dirty
    delete cloned.invalid
    return cloned
}