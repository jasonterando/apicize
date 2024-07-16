import { WorkbookBaseCertificate, WorkbookPkcs12Certificate, WorkbookPkcs8Certificate } from "@apicize/lib-typescript"
import { Editable } from "../editable"

export interface EditableWorkbookCertificate extends Editable, WorkbookBaseCertificate {
}

export interface EditableWorkbookPkcs8Certificate extends Editable, WorkbookPkcs8Certificate {
}

export interface EditableWorkbookPkcs12Certificate extends Editable, WorkbookPkcs12Certificate {    
}

/**
 * Strip editable artifacts from editable certificate
 * @param certificate
 * @returns 
 */
export function EditableWorkbookCertificateToCertificate(certificate: EditableWorkbookCertificate): WorkbookBaseCertificate {
    const cloned = structuredClone(certificate)
    delete cloned.dirty
    delete cloned.invalid
    return cloned
}