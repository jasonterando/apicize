import { WorkbookBaseCertificate, WorkbookPkcs12Certificate, WorkbookPkcs8PemCertificate, WorkbookPemCertificate, WorkbookCertificateType, Persistence, WorkbookCertificate } from "@apicize/lib-typescript"
import { Editable } from "../editable"
import { observable } from "mobx"
import { EditableEntityType } from "./editable-entity-type"

export type EditableWorkbookCertificate = EditableWorkbookPkcs8PemCertificate | EditableWorkbookPemCertificate | EditableWorkbookPkcs12Certificate

export abstract class EditableWorkbookCertificateEntry extends Editable<WorkbookCertificate> implements WorkbookBaseCertificate {
    public readonly entityType = EditableEntityType.Certificate
    abstract type: WorkbookCertificateType
    @observable accessor persistence = Persistence.Private

    static fromWorkspace(entry: WorkbookCertificate) : EditableWorkbookCertificate {
        let result: EditableWorkbookCertificate
        switch(entry.type) {
            case WorkbookCertificateType.PKCS8_PEM:
                result = new EditableWorkbookPkcs8PemCertificate()
                result.pem = entry.pem
                result.key = entry.key ?? ''
                break
            case WorkbookCertificateType.PEM:
                result = new EditableWorkbookPemCertificate()
                result.pem = entry.pem
                break
            case WorkbookCertificateType.PKCS12:
                result = new EditableWorkbookPkcs12Certificate()
                result.pfx = entry.pfx
                result.password = entry.password
                break
            default:
                throw new Error('Invalid certificate type')
        }
        
        result.id = entry.id
        result.name = entry.name ?? ''
        result.persistence = entry.persistence ?? Persistence.Private
        return result
    }

    toWorkspace(): WorkbookCertificate {
        return {
            id: this.id,
            name: this.name,
            persistence: this.persistence,
            type: this.type,
            pem: (this as unknown as EditableWorkbookPkcs8PemCertificate).pem,
            key: (this as unknown as EditableWorkbookPkcs8PemCertificate).key,
            pfx: (this as unknown as EditableWorkbookPkcs12Certificate).pfx,
            password: (this as unknown as EditableWorkbookPkcs12Certificate).password
        } as unknown as WorkbookCertificate
    }
}

export class EditableWorkbookPkcs8PemCertificate extends EditableWorkbookCertificateEntry implements WorkbookPkcs8PemCertificate {
    @observable accessor type: WorkbookCertificateType.PKCS8_PEM = WorkbookCertificateType.PKCS8_PEM
    @observable accessor pem = ''
    @observable accessor key = ''
}

export class EditableWorkbookPemCertificate extends EditableWorkbookCertificateEntry implements WorkbookPemCertificate {
    @observable accessor type: WorkbookCertificateType.PEM = WorkbookCertificateType.PEM
    @observable accessor persistence = Persistence.Private
    @observable accessor pem = ''
}

export class EditableWorkbookPkcs12Certificate extends EditableWorkbookCertificateEntry implements WorkbookPkcs12Certificate {    
    @observable accessor type: WorkbookCertificateType.PKCS12 = WorkbookCertificateType.PKCS12
    @observable accessor persistence = Persistence.Private
    @observable accessor pfx = ''
    @observable accessor password = ''
}


/**
 * Type of certificate file to open
 */
export enum CertificateFileType {
    PEM,
    Key,
    PFX
}