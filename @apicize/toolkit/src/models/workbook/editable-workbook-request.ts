import { Selection, WorkbookBody, WorkbookBodyType, WorkbookGroupExecution, WorkbookMethod, WorkbookNameValuePair, WorkbookRequest, WorkbookRequestEntry, WorkbookRequestGroup, WorkbookRequestType } from "@apicize/lib-typescript"
import { Editable } from "../editable"
import { computed, observable, toJS } from "mobx"
import { EditableNameValuePair } from "./editable-name-value-pair"
import { GenerateIdentifier } from "../../services/random-identifier-generator"
import { EditableEntityType } from "./editable-entity-type"

export class EditableWorkbookRequest extends Editable<WorkbookRequest | WorkbookRequestGroup> {
    public readonly entityType = EditableEntityType.Request
    type: WorkbookRequestType.Request | WorkbookRequestType.Group = WorkbookRequestType.Request

    @observable public accessor url = ''

    @observable public accessor method = WorkbookMethod.Get
    @observable public accessor timeout = 30000
    @observable public accessor keepalive = false as boolean | undefined
    @observable public accessor headers: EditableNameValuePair[] = []
    @observable public accessor queryStringParams: EditableNameValuePair[] = []
    @observable public accessor body = { type: WorkbookBodyType.None } as WorkbookBody
    @observable public accessor redirect = undefined
    @observable public accessor integrity = undefined
    @observable public accessor mode = undefined
    @observable public accessor referrer = undefined
    @observable public accessor referrerPolicy = undefined
    @observable public accessor duplex = undefined
    @observable public accessor test = ''

    @observable public accessor execution = WorkbookGroupExecution.Sequential

    @observable accessor runs = 0
    @observable accessor selectedScenario: Selection | undefined = undefined
    @observable accessor selectedAuthorization: Selection | undefined = undefined
    @observable accessor selectedCertificate: Selection | undefined = undefined
    @observable accessor selectedProxy: Selection | undefined = undefined

    static fromWorkspace(entry: WorkbookRequestEntry): EditableWorkbookRequest {
        const result = new EditableWorkbookRequest()
        result.id = entry.id
        result.name = entry.name ?? ''

        result.runs = result.runs
        result.selectedScenario = result.selectedScenario ?? undefined
        result.selectedAuthorization = result.selectedAuthorization ?? undefined
        result.selectedCertificate = result.selectedCertificate ?? undefined
        result.selectedProxy = result.selectedProxy ?? undefined

        const entryAsRequest = entry as WorkbookRequest
        entry.type = entryAsRequest.url === undefined
            ? WorkbookRequestType.Group
            : WorkbookRequestType.Request

        switch (entry.type) {
            case WorkbookRequestType.Request:
                result.type = WorkbookRequestType.Request
                result.url = entry.url ?? ''
                result.method = entry.method ?? WorkbookMethod.Get
                result.timeout = entry.timeout ?? 30000
                result.keepalive = entry.keepalive
                result.headers = entry.headers?.map(h => ({
                    id: GenerateIdentifier(),
                    ...h
                })) ?? []
                result.queryStringParams = entry.queryStringParams?.map(q => ({
                    id: GenerateIdentifier(),
                    ...q
                })) ?? []
                result.body = result.body ?? { type: WorkbookBodyType.None }
                if (result.body && result.body.data) {
                    switch (result.body.type) {
                        case WorkbookBodyType.JSON:
                            result.body.data = JSON.stringify(result.body.data)
                            break
                        case WorkbookBodyType.Form:
                            result.body.data = (result.body.data as WorkbookNameValuePair[]).map(r => ({
                                id: GenerateIdentifier(),
                                ...r
                            }))
                            break
                    }
                } else {
                    result.body = {
                        type: WorkbookBodyType.None
                    }
                }
                result.test = result.test ?? ''
                break
            case WorkbookRequestType.Group:
                result.type = WorkbookRequestType.Group
                result.execution = entry.execution
                break
        }

        return result
    }

    toWorkspace(): WorkbookRequest | WorkbookRequestGroup {
        const { dirty, invalid, ...cloned } = toJS(this)

        if (this.type === WorkbookRequestType.Request) {
            const stored: WorkbookRequest = {
                id: this.id,
                name: this.name,
                runs: this.runs,
                type: this.type,
                url: this.url,
                method: this.method,
                headers: toJS(this.headers),
                queryStringParams: toJS(this.queryStringParams),
                body: toJS(this.body),
                test: this.test,
                duplex: this.duplex,
                integrity: this.integrity,
                keepalive: this.keepalive,
                mode: this.mode,
            }

            let bodyIsValid = false
            if (stored.body?.data) {
                switch (stored.body?.type) {
                    case WorkbookBodyType.Form:
                        const bodyAsForm = stored.body.data as EditableNameValuePair[]
                        bodyIsValid = bodyAsForm.length > 0
                        if (bodyIsValid) {
                            stored.body = {
                                type: WorkbookBodyType.Form,
                                data: bodyAsForm.map(pair => ({
                                    name: pair.name,
                                    value: pair.value,
                                    disabled: pair.disabled
                                }))
                            }
                        }
                        break
                    case WorkbookBodyType.JSON:
                        if (typeof stored.body.data === 'string') {
                            try {
                                stored.body.data = JSON.parse(stored.body.data)
                                bodyIsValid = true
                            } catch (e) {
                                throw new Error(`Invalid JSON data - ${(e as Error).message}`)
                            }
                        }
                        break
                    default:
                        const bodyAsText = stored.body.data as string
                        bodyIsValid = bodyAsText.length > 0
                        if (bodyIsValid) {
                            stored.body = {
                                type: stored.body.type,
                                data: bodyAsText
                            }
                        }
                        break
                }
            }
            if (!bodyIsValid) {
                delete stored.body
            }

            if ((stored.headers?.length ?? 0) === 0) {
                delete stored.headers
            } else {
                stored.headers?.forEach(h => delete (h as unknown as any).id)
            }
            if ((stored.queryStringParams?.length ?? 0) === 0) {
                delete stored.queryStringParams
            } else {
                stored.queryStringParams?.forEach(p => delete (p as unknown as any).id)
            }
            return stored
        } else {
            return {
                id: this.id,
                name: this.name,
                runs: this.runs,
                type: this.type,
                execution: this.execution,
                selectedScenario: this.selectedScenario ?? undefined,
                selectedAuthorization: this.selectedAuthorization ?? undefined,
                selectedCertificate: this.selectedCertificate ?? undefined,
                selectedProxy: this.selectedProxy ?? undefined,
            } as WorkbookRequestGroup
        }
    }

    @computed get nameInvalid() {
        return ((this.name?.length ?? 0) === 0)
    }

    @computed get urlInvalid() {
        return ! /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test(this.url)
    }

    @computed get invalid() {
        if (this.type === WorkbookRequestType.Request) {
            return this.nameInvalid
                || this.urlInvalid
        } else {
            return this.nameInvalid
        }

    }
}
