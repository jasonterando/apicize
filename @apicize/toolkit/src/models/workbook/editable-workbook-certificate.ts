import { WorkbookBaseCertificate, WorkbookPkcs12Certificate, WorkbookPkcs8PemCertificate, WorkbookPemCertificate } from "@apicize/lib-typescript"
import { Editable } from "../editable"

export interface EditableWorkbookCertificate extends Editable, WorkbookBaseCertificate {
}

export interface EditableWorkbookPkcs8PemCertificate extends Editable, WorkbookPkcs8PemCertificate {
}

export interface EditableWorkbookPPemCertificate extends Editable, WorkbookPemCertificate {
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

/**
 * Type of certificate file to open
 */
export enum CertificateFileType {
    PEM,
    Key,
    PFX
}