import { Selection, WorkbookBody, WorkbookBodyType, WorkbookGroupExecution, WorkbookMethod, WorkbookNameValuePair, WorkbookRequest, WorkbookRequestEntry, WorkbookRequestGroup, WorkbookRequestType } from "@apicize/lib-typescript"
import { Editable } from "../editable"
import { observable, toJS } from "mobx"
import { EditableNameValuePair } from "./editable-name-value-pair"
import { GenerateIdentifier } from "../../services/random-identifier-generator"
import { EditableEntityType } from "./editable-entity-type"

export abstract class EditableWorkbookRequestEntry extends Editable<WorkbookRequestEntry> {
    abstract type: WorkbookRequestType
    @observable accessor runs = 0
    @observable accessor selectedScenario: Selection | undefined = undefined
    @observable accessor selectedAuthorization: Selection | undefined = undefined
    @observable accessor selectedCertificate: Selection | undefined = undefined
    @observable accessor selectedProxy: Selection | undefined = undefined

    abstract toWorkspace(): WorkbookRequestEntry

    static fromWorkspace(entry: WorkbookRequestEntry): EditableWorkbookRequest | EditableWorkbookRequestGroup {
        const r = entry as WorkbookRequest
        let result: EditableWorkbookRequest | EditableWorkbookRequestGroup
        if (r.url === undefined) {
            const g = entry as WorkbookRequestGroup
            const resultAsGroup = new EditableWorkbookRequestGroup()
            resultAsGroup.id = g.id
            resultAsGroup.name = g.name ?? ''
            resultAsGroup.type = WorkbookRequestType.Group
            resultAsGroup.execution = g.execution
            result = resultAsGroup
        } else {
            const resultAsRequest = new EditableWorkbookRequest()
            resultAsRequest.id = r.id
            resultAsRequest.name = r.name ?? ''
            resultAsRequest.type = WorkbookRequestType.Request
            resultAsRequest.url = r.url ?? ''
            resultAsRequest.method = r.method ?? WorkbookMethod.Get
            resultAsRequest.timeout = r.timeout ?? 30000
            resultAsRequest.keepalive = r.keepalive
            resultAsRequest.headers = r.headers?.map(h => ({
                id: GenerateIdentifier(),
                ...h
            })) ?? []
            resultAsRequest.queryStringParams = r.queryStringParams?.map(q => ({
                id: GenerateIdentifier(),
                ...q
            })) ?? []
            resultAsRequest.body = r.body ?? { type: WorkbookBodyType.None }
            if (resultAsRequest.body && resultAsRequest.body.data) {
                switch (resultAsRequest.body.type) {
                    case WorkbookBodyType.JSON:
                        resultAsRequest.body.data = JSON.stringify(resultAsRequest.body.data)
                        break
                    case WorkbookBodyType.Form:
                        resultAsRequest.body.data = (resultAsRequest.body.data as WorkbookNameValuePair[]).map(r => ({
                            id: GenerateIdentifier(),
                            ...r
                        }))
                        break
                }
            } else {
                resultAsRequest.body = {
                    type: WorkbookBodyType.None
                }
            }
            resultAsRequest.test = r.test ?? ''
            result = resultAsRequest
        }

        result.runs = r.runs
        result.selectedScenario = r.selectedScenario ?? undefined
        result.selectedAuthorization = r.selectedAuthorization ?? undefined
        result.selectedCertificate = r.selectedCertificate ?? undefined
        result.selectedProxy = r.selectedProxy ?? undefined

        return result
    }
}

export class EditableWorkbookRequest extends EditableWorkbookRequestEntry implements WorkbookRequest {
    public readonly entityType = EditableEntityType.Request
    @observable public accessor type: WorkbookRequestType.Request = WorkbookRequestType.Request
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

    toWorkspace(): WorkbookRequestEntry {
        const { dirty, invalid, ...cloned } = toJS(this)
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
    }
}

export class EditableWorkbookRequestGroup extends EditableWorkbookRequestEntry implements WorkbookRequestGroup {
    public readonly entityType = EditableEntityType.Request
    @observable accessor type: WorkbookRequestType.Group = WorkbookRequestType.Group
    @observable accessor execution = WorkbookGroupExecution.Sequential

    toWorkspace(): WorkbookRequestEntry {
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