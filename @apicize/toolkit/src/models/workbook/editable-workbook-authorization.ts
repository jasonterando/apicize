import {
    Persistence, WorkbookApiKeyAuthorization, WorkbookAuthorization, WorkbookAuthorizationType, WorkbookBaseAuthorization,
    WorkbookBasicAuthorization, WorkbookOAuth2ClientAuthorization, Selection
} from "@apicize/lib-typescript"
import { Editable } from "../editable"
import { observable } from "mobx"
import { NO_SELECTION } from "../store"
import { EditableEntityType } from "./editable-entity-type"

export type EditableWorkbookAuthorization = EditableWorkbookApiKeyAuthorization | EditableWorkbookBasicAuthorization | EditableWorkbookOAuth2ClientAuthorization

export abstract class EditableWorkbookAuthorizationEntry extends Editable<WorkbookAuthorization> implements WorkbookBaseAuthorization {
    public readonly entityType = EditableEntityType.Authorization
    abstract type: WorkbookAuthorizationType
    @observable accessor persistence = Persistence.Private

    static fromWorkspace(entry: WorkbookAuthorization): EditableWorkbookAuthorization {
        let result: EditableWorkbookAuthorization
        switch (entry.type) {
            case WorkbookAuthorizationType.ApiKey:
                result = new EditableWorkbookApiKeyAuthorization()
                result.header = entry.header
                result.value = entry.value
                break
            case WorkbookAuthorizationType.Basic:
                result = new EditableWorkbookBasicAuthorization()
                result.username = entry.username
                result.password = entry.password
                break
            case WorkbookAuthorizationType.OAuth2Client:
                result = new EditableWorkbookOAuth2ClientAuthorization()
                result.accessTokenUrl = entry.accessTokenUrl
                result.clientId = entry.clientId
                result.clientSecret = entry.clientSecret
                result.scope = entry.scope
                result.selectedCertificate = entry.selectedCertificate ?? NO_SELECTION
                result.selectedProxy = entry.selectedProxy ?? NO_SELECTION
                break
            default:
                throw new Error('Invalid authorization type')
        }

        result.id = entry.id
        result.name = entry.name ?? ''
        result.persistence = entry.persistence ?? Persistence.Private
        return result
    }

    toWorkspace(): WorkbookAuthorization {
        let result: WorkbookAuthorization
        switch (this.type) {
            case WorkbookAuthorizationType.ApiKey:
                const a1 = this as unknown as EditableWorkbookApiKeyAuthorization
                result = {
                    type: WorkbookAuthorizationType.ApiKey,
                    header: a1.header,
                    value: a1.value
                } as WorkbookApiKeyAuthorization
                break
            case WorkbookAuthorizationType.Basic:
                const a2 = this as unknown as EditableWorkbookBasicAuthorization
                result = {
                    type: WorkbookAuthorizationType.Basic,
                    username: a2.username,
                    password: a2.password
                } as WorkbookBasicAuthorization
                break
            case WorkbookAuthorizationType.OAuth2Client:
                const a3 = this as unknown as EditableWorkbookOAuth2ClientAuthorization    
                result = {
                    type: WorkbookAuthorizationType.OAuth2Client,
                    accessTokenUrl: a3.accessTokenUrl,
                    clientId: a3.clientId,
                    clientSecret: a3.clientSecret,
                    scope: a3.scope,
                    selectedCertificate: a3.selectedCertificate ?? NO_SELECTION,
                    selectedProxy: a3.selectedProxy ?? NO_SELECTION
                } as WorkbookOAuth2ClientAuthorization
                break
            default:
                throw new Error('Invalid authorization type')
        }

        result.id = this.id
        result.name = this.name ?? ''
        result.persistence = this.persistence ?? Persistence.Private
        return result
    }
}

export class EditableWorkbookApiKeyAuthorization extends EditableWorkbookAuthorizationEntry implements WorkbookApiKeyAuthorization {
    public readonly entityType = EditableEntityType.Authorization
    @observable accessor type: WorkbookAuthorizationType.ApiKey = WorkbookAuthorizationType.ApiKey
    @observable accessor persistence = Persistence.Private
    @observable accessor header: string = ''
    @observable accessor value: string = ''
}

export class EditableWorkbookBasicAuthorization extends EditableWorkbookAuthorizationEntry implements WorkbookBasicAuthorization {
    public readonly entityType = EditableEntityType.Authorization
    @observable accessor type: WorkbookAuthorizationType.Basic = WorkbookAuthorizationType.Basic
    @observable accessor persistence = Persistence.Private
    @observable accessor username: string = ''
    @observable accessor password: string = ''
}

export class EditableWorkbookOAuth2ClientAuthorization extends EditableWorkbookAuthorizationEntry implements WorkbookOAuth2ClientAuthorization {
    public readonly entityType = EditableEntityType.Authorization
    @observable accessor type: WorkbookAuthorizationType.OAuth2Client = WorkbookAuthorizationType.OAuth2Client
    @observable accessor persistence = Persistence.Private
    @observable accessor accessTokenUrl = ''
    @observable accessor clientId = ''
    @observable accessor clientSecret = ''
    @observable accessor scope = ''
    @observable accessor selectedCertificate: Selection | undefined = undefined
    @observable accessor selectedProxy: Selection | undefined = undefined
    // sendCredentialsInBody: boolean}
}
