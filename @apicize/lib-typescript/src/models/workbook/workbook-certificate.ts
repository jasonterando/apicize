import { Identifiable } from "../identifiable"
import { Named } from "../named"
import { Persisted } from "../persistence"

/**
 * Specifies the type of certificate used for a request
 */
export enum WorkbookCertificateType { None = 'none', PKCS12 = 'PFX (PKCS #12)',  PKCS8 = 'PEM (PKCS #8)'};

// export interface WorkbookAuthorization extends Named {
//     type: WorkbookAuthorizationType
// }

export type WorkbookCertificate = WorkbookBaseCertificate | WorkbookPkcs12Certificate | WorkbookPkcs8Certificate

export interface WorkbookBaseCertificate extends Identifiable, Named, Persisted {
    type: WorkbookCertificateType
}

/**
 * Information required for PFX certificate
 */
export interface WorkbookPkcs12Certificate extends WorkbookBaseCertificate {
    type: WorkbookCertificateType.PKCS12
    der: any
    password: string
}

/**
 * Information required for PEM certificate / key
 */
export interface WorkbookPkcs8Certificate extends WorkbookBaseCertificate {
    type: WorkbookCertificateType.PKCS8
    pem: string
    key?: string
}

