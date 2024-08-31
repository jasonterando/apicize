import { action, makeObservable, observable, toJS } from "mobx"
import { DEFAULT_SELECTION_ID, NO_SELECTION, NO_SELECTION_ID } from "../models/store"
import { WorkbookExecution } from "../models/workbook/workbook-execution"
import { editableWorkspaceToStoredWorkspace, newEditableWorkspace, stateToGlobalSettingsStorage, storedWorkspaceToEditableWorkspace } from "../services/apicize-serializer"
import { EditableWorkbookRequestEntry } from "../models/workbook/editable-workbook-request-entry"
import { EditableWorkbookScenario } from "../models/workbook/editable-workbook-scenario"
import { EditableWorkbookApiKeyAuthorization, EditableWorkbookAuthorizationEntry, EditableWorkbookBasicAuthorization, EditableWorkbookOAuth2ClientAuthorization } from "../models/workbook/editable-workbook-authorization"
import { EditableWorkbookCertificateEntry, EditableWorkbookPkcs12Certificate, EditableWorkbookPkcs8PemCertificate } from "../models/workbook/editable-workbook-certificate"
import { EditableWorkbookProxy } from "../models/workbook/editable-workbook-proxy"
import { RootStore } from "./root.store"
import { Identifiable, Named, IndexedEntities, GetTitle, WorkbookRequestType, Persistence, addNestedEntity, removeNestedEntity, moveNestedEntity, getNestedEntity, WorkbookGroupExecution, addEntity, removeEntity, moveEntity, WorkbookBodyType, WorkbookMethod, WorkbookBodyData, WorkbookOAuth2ClientAuthorization, WorkbookAuthorizationType, WorkbookApiKeyAuthorization, WorkbookCertificateType, findParentEntity, Workspace } from "@apicize/lib-typescript"
import { EntitySelection } from "../models/workbook/entity-selection"
import { EditableNameValuePair } from "../models/workbook/editable-name-value-pair"
import { EditableWorkbookRequest, EditableWorkbookRequestGroup } from "../models/workbook/editable-workbook-request"
import { GenerateIdentifier } from "../services/random-identifier-generator"
import { EditableEntityType } from "../models/workbook/editable-entity-type"
import { Editable, EditableItem } from "../models/editable"
import { RunInformation } from "../models/workbook/run-information"

const encodeFormData = (data: EditableNameValuePair[]) =>
    (data.length === 0)
        ? ''
        : data.map(nv =>
            `${encodeURIComponent(nv.name)}=${encodeURIComponent(nv.value)}`
        ).join('&')

const decodeFormData = (bodyData: string | number[] | undefined) => {
    let data: string | undefined;
    if (bodyData instanceof Array) {
        const buffer = Uint8Array.from(bodyData)
        data = (new TextDecoder()).decode(buffer)
    } else {
        data = bodyData
    }
    if (data && data.length > 0) {
        const parts = data.split('&')
        return parts.map(p => {
            const id = GenerateIdentifier()
            const nv = p.split('=')
            if (nv.length == 1) {
                return { id, name: decodeURIComponent(nv[0]), value: "" } as EditableNameValuePair
            } else {
                return { id, name: decodeURIComponent(nv[0]), value: decodeURIComponent(nv[1]) } as EditableNameValuePair
            }
        })
    } else {
        return []
    }
}

export class WorkspaceStore {
    /**
     * Workspace representing all requests, scenarios, authorizations, certificates and proxies
     */
    @observable accessor workspace = newEditableWorkspace()

    /**
     * Request executions underway or completed
     */
    @observable accessor requestExecutions = new Map<string, WorkbookExecution>()

    @observable accessor active: EditableItem | null = null

    // *** Placeholde for now... ***
    @observable accessor activeExecutionId: string | null = null

    @observable accessor helpVisible = false
    @observable accessor helpTopic = ''
    @observable accessor nextHelpTopic = ''
    @observable accessor helpHistory: string[] = []

    constructor(private readonly root: RootStore) {
        makeObservable(this)
    }

    @action
    showHelp(topic: string) {
        const historyLength = this.helpHistory.length
        if (historyLength >= 25) {
            if (this.helpHistory[historyLength - 1] !== topic) {
                this.helpHistory = [...this.helpHistory.slice(1), topic]
            }
        } if ((historyLength === 0 || this.helpHistory[historyLength - 1] !== topic)) {
            this.helpHistory.push(topic)
        }
        this.helpTopic = topic
        this.helpVisible = true
    }

    @action
    showNextHelpTopic() {
        this.showHelp((this.nextHelpTopic.length > 0) ? this.nextHelpTopic : 'home')
    }

    @action
    hideHelp() {
        this.helpVisible = false
    }

    @action
    backHelp() {
        if (this.helpHistory.length > 1) {
            this.helpHistory.pop()
            const lastTopic = this.helpHistory.pop()
            if (lastTopic) {
                this.helpTopic = lastTopic
                this.helpVisible = true
            }
        }
    }

    @action
    newWorkspace() {
        this.workspace = newEditableWorkspace()
        this.requestExecutions.clear()
        this.clearActive()
    }

    @action
    loadWorkspace(newWorkspace: Workspace) {
        this.workspace = storedWorkspaceToEditableWorkspace(newWorkspace)
        this.requestExecutions.clear()
        this.clearActive()
    }

    getWorkspace() {
        return editableWorkspaceToStoredWorkspace(
            this.workspace.requests,
            this.workspace.scenarios,
            this.workspace.authorizations,
            this.workspace.certificates,
            this.workspace.proxies,
            this.workspace.selectedScenario,
            this.workspace.selectedAuthorization,
            this.workspace.selectedCertificate,
            this.workspace.selectedProxy,
        )
    }

    getSettings(workbookDirectory: string, lastWorkbookFileName: string | undefined) {
        return stateToGlobalSettingsStorage(
            workbookDirectory,
            lastWorkbookFileName)
    }


    @action
    changeActive(type: EditableEntityType, id: string) {
        switch (type) {
            case EditableEntityType.Request:
                this.hideHelp()
                const r = this.workspace.requests.entities.get(id)
                if (!r) throw new Error(`Invalid request ID ${id}`)
                this.active = r
                if (r.type === WorkbookRequestType.Request) {
                    this.nextHelpTopic = 'requests'
                } else {
                    this.nextHelpTopic = 'groups'
                }
                break
            case EditableEntityType.Scenario:
                this.hideHelp()
                const s = this.workspace.scenarios.entities.get(id)
                if (!s) throw new Error(`Invalid scenario ID ${id}`)
                this.active = s
                this.nextHelpTopic = 'scenarios'
                break
            case EditableEntityType.Authorization:
                this.hideHelp()
                const a = this.workspace.authorizations.entities.get(id)
                if (!a) throw new Error(`Invalid authorization ID ${id}`)
                this.active = a
                this.nextHelpTopic = 'authorizations'
                break
            case EditableEntityType.Certificate:
                this.hideHelp()
                const c = this.workspace.certificates.entities.get(id)
                if (!c) throw new Error(`Invalid certificate ID ${id}`)
                this.active = c
                this.nextHelpTopic = 'certificates'
                break
            case EditableEntityType.Proxy:
                this.hideHelp()
                const p = this.workspace.proxies.entities.get(id)
                if (!p) throw new Error(`Invalid proxy ID ${id}`)
                this.active = p
                this.nextHelpTopic = 'proxies'
                break
            default:
                this.active = null
                this.hideHelp()
                break
        }
    }

    @action
    clearActive() {
        this.active = null
    }

    /**
     * Generate a list of entities, including default and none selections, returns list and selected ID
     * @param entityList 
     * @param activeId 
     * @returns tuple of list and selected ID
     */
    private buildEntityList = <T extends Identifiable & Named>(
        entityList: IndexedEntities<T>,
        defaultName?: string): EntitySelection[] => {
        const list: EntitySelection[] = []
        if (defaultName !== undefined) {
            list.push({ id: DEFAULT_SELECTION_ID, name: `Default (${defaultName})` })
        }
        list.push({ id: NO_SELECTION_ID, name: `Off` })
        for (const id of entityList.topLevelIds) {
            const e = entityList.entities.get(id)
            if (e) {
                list.push({ id: e.id, name: GetTitle(e) })
            }
        }
        return list
    }


    @action
    addRequest(targetID?: string | null) {
        const entry = new EditableWorkbookRequest()
        entry.id = GenerateIdentifier()
        entry.type = WorkbookRequestType.Request
        entry.runs = 1
        entry.test = `describe('status', () => {
    it('equals 200', () => {
        expect(response.status).to.equal(200)
    })
})`
        addNestedEntity(entry, this.workspace.requests, false, targetID)
        this.root.window.changeDirty(true)
        this.changeActive(EditableEntityType.Request, entry.id)
    }

    @action
    deleteRequest(id: string) {
        if (this.active?.id === id) {
            this.clearActive()
        }
        removeNestedEntity(id, this.workspace.requests)
        this.root.execution.deleteExecution(id)
        this.root.window.changeDirty(true)
    }

    @action
    moveRequest(id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        moveNestedEntity(id, destinationID, onLowerHalf, onLeft, this.workspace.requests)
        this.root.window.changeDirty(true)
        if (this.active?.id !== id) {
            this.changeActive(EditableEntityType.Request, id)
        }
    }

    @action
    copyRequest(id: string) {
        // Return the ID of the duplicated entry
        const copyEntry = (entry: EditableWorkbookRequestEntry) => {
            const dupe = structuredClone(entry)
            // For some reason, structuredClone doesn't work with requests reliably
            // const dupe = JSON.parse(JSON.stringify(entry))
            dupe.id = GenerateIdentifier()
            dupe.name = `${GetTitle(dupe)} - copy`
            dupe.dirty = true

            if (entry.type === WorkbookRequestType.Request) {
                const request = dupe as EditableWorkbookRequest
                request.headers?.forEach(h => h.id = GenerateIdentifier())
                request.queryStringParams?.forEach(p => p.id = GenerateIdentifier())
                this.workspace.requests.entities.set(request.id, request)
                return request
            }

            const group = dupe as EditableWorkbookRequestGroup
            if (this.workspace.requests.childIds) {
                const sourceChildIDs = this.workspace.requests.childIds?.get(source.id)
                if (sourceChildIDs && sourceChildIDs.length > 0) {
                    const dupedChildIDs: string[] = []
                    this.workspace.requests.childIds.set(group.id, dupedChildIDs)

                    sourceChildIDs.forEach(childID => {
                        const childEntry = this.workspace.requests.entities.get(childID)
                        if (childEntry) {
                            const dupedChildID = copyEntry(childEntry).id
                            dupedChildIDs.push(dupedChildID)
                        }
                    })
                }
            }
            this.workspace.requests.entities.set(group.id, group)
            return group
        }

        const source = getNestedEntity(id, this.workspace.requests)
        const entry = copyEntry(source)

        let append = true
        if (this.workspace.requests.childIds) {
            for (const childIDs of this.workspace.requests.childIds.values()) {
                let idxChild = childIDs.indexOf(id)
                if (idxChild !== -1) {
                    childIDs.splice(idxChild + 1, 0, entry.id)
                    append = false
                    break
                }
            }
        }

        if (append) {
            const idx = this.workspace.requests.topLevelIds.indexOf(id)
            if (idx !== -1) {
                this.workspace.requests.topLevelIds.splice(idx + 1, 0, entry.id)
                append = false
            }
        }

        if (append) {
            this.workspace.requests.topLevelIds.push(entry.id)
        }

        this.root.window.changeDirty(true)
        this.changeActive(EditableEntityType.Request, entry.id)
    }

    getRequest(id: string) {
        return this.workspace.requests.entities.get(id)
    }

    @action
    setRequestName(value: string) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableWorkbookRequestEntry
            request.name = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setRequestUrl(value: string) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const requestEntry = this.active as EditableWorkbookRequestEntry
            if (requestEntry.type === WorkbookRequestType.Request) {
                const request = requestEntry as EditableWorkbookRequest
                request.url = value
                this.root.window.changeDirty(true)
            }
        }
    }

    @action
    setRequestMethod(value: WorkbookMethod) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const requestEntry = this.active as EditableWorkbookRequestEntry
            if (requestEntry.type === WorkbookRequestType.Request) {
                const request = requestEntry as EditableWorkbookRequest
                request.method = value
                this.root.window.changeDirty(true)
            }
        }
    }

    @action
    setRequestTimeout(value: number) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const requestEntry = this.active as EditableWorkbookRequestEntry
            if (requestEntry.type === WorkbookRequestType.Request) {
                const request = requestEntry as EditableWorkbookRequest
                request.timeout = value
                this.root.window.changeDirty(true)
            }
        }
    }

    @action
    setRequestQueryStringParams(value: EditableNameValuePair[]) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const requestEntry = this.active as EditableWorkbookRequestEntry
            if (requestEntry.type === WorkbookRequestType.Request) {
                const request = requestEntry as EditableWorkbookRequest
                request.queryStringParams = value
                this.root.window.changeDirty(true)
            }
        }
    }

    @action
    setRequestHeaders(value: EditableNameValuePair[] | undefined) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const requestEntry = this.active as EditableWorkbookRequestEntry
            if (requestEntry.type === WorkbookRequestType.Request) {
                const request = requestEntry as EditableWorkbookRequest
                request.headers = value ?? []
                this.root.window.changeDirty(true)
            }
        }
    }

    @action
    setRequestBodyType(value: WorkbookBodyType | undefined) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const requestEntry = this.active as EditableWorkbookRequestEntry
            if (requestEntry.type === WorkbookRequestType.Request) {
                const request = requestEntry as EditableWorkbookRequest
                let oldBodyType = request.body?.type ?? WorkbookBodyType.None
                let newBodyData = request.body?.data
                let newBodyType = value ?? WorkbookBodyType.None

                if (newBodyType !== oldBodyType) {
                    switch (newBodyType) {
                        case WorkbookBodyType.Form:
                            const formData = decodeFormData(newBodyData as string)
                            formData.forEach(d => (d as EditableNameValuePair).id = GenerateIdentifier())
                            newBodyData = formData
                            break
                        default:
                            switch (oldBodyType) {
                                case WorkbookBodyType.Form:
                                    newBodyData = encodeFormData(newBodyData as EditableNameValuePair[])
                                    break
                                case WorkbookBodyType.Raw:
                                    const data = newBodyData as number[] | undefined
                                    if (data && data.length > 0) {
                                        newBodyData = (new TextDecoder('utf-8')).decode(Uint8Array.from(data))
                                    } else {
                                        newBodyData = ''
                                    }
                                    break
                            }
                            break
                    }
                }
                request.body = {
                    type: newBodyType,
                    data: newBodyData
                }
                this.root.window.changeDirty(true)
            }
        }
    }

    @action
    setRequestBodyData(value: WorkbookBodyData | undefined) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const requestEntry = this.active as EditableWorkbookRequestEntry
            if (requestEntry.type === WorkbookRequestType.Request) {
                const request = requestEntry as EditableWorkbookRequest
                if (request.body) {
                    request.body.data = value
                } else {
                    request.body = { data: value }
                }
                this.root.window.changeDirty(true)
            }
        }
    }

    @action
    setRequestRuns(value: number) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const requestEntry = this.active as EditableWorkbookRequestEntry
            requestEntry.runs = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setRequestTest(value: string | undefined) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const requestEntry = this.active as EditableWorkbookRequestEntry
            if (requestEntry.type === WorkbookRequestType.Request) {
                const request = requestEntry as EditableWorkbookRequest
                request.test = value ?? ''
                this.root.window.changeDirty(true)
            }
        }
    }

    @action
    setRequestSelectedScenarioId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const requestEntry = this.active as EditableWorkbookRequestEntry
            requestEntry.selectedScenario = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(this.workspace.scenarios.entities.get(entityId)) }
            this.root.window.changeDirty(true)
        }
    }

    @action
    setRequestSelectedAuthorizationId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const requestEntry = this.active as EditableWorkbookRequestEntry
            requestEntry.selectedAuthorization = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(this.workspace.authorizations.entities.get(entityId)) }
            this.root.window.changeDirty(true)
        }
    }

    @action
    setRequestSelectedCertificateId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const requestEntry = this.active as EditableWorkbookRequestEntry
            requestEntry.selectedCertificate = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(this.workspace.certificates.entities.get(entityId)) }
            this.root.window.changeDirty(true)
        }
    }

    @action
    setRequestSelectedProxyId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const requestEntry = this.active as EditableWorkbookRequestEntry
            requestEntry.selectedProxy = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(this.workspace.proxies.entities.get(entityId)) }
            this.root.window.changeDirty(true)
        }
    }

    getRequestParameterLists() {
        let activeScenarioId = DEFAULT_SELECTION_ID
        let activeAuthorizationId = DEFAULT_SELECTION_ID
        let activeCertificateId = DEFAULT_SELECTION_ID
        let activeProxyId = DEFAULT_SELECTION_ID

        // Determine the active credentials by working our way up the hierarchy
        if (this.active?.entityType === EditableEntityType.Request) {
            const requestEntry = this.active as EditableWorkbookRequestEntry
            let e = findParentEntity(requestEntry.id, this.workspace.requests)
            while (e) {
                let r = e as (EditableWorkbookRequest & EditableWorkbookRequest)
                if (activeScenarioId === DEFAULT_SELECTION_ID && r.selectedScenario) {
                    activeScenarioId = r.selectedScenario.id
                }
                if (activeAuthorizationId === DEFAULT_SELECTION_ID && r.selectedAuthorization) {
                    activeAuthorizationId = r.selectedAuthorization.id
                }
                if (activeCertificateId === DEFAULT_SELECTION_ID && r.selectedCertificate) {
                    activeCertificateId = r.selectedCertificate.id
                }
                if (activeProxyId === DEFAULT_SELECTION_ID && r.selectedProxy) {
                    activeProxyId = r.selectedProxy.id
                }

                if (activeScenarioId !== DEFAULT_SELECTION_ID
                    && activeAuthorizationId !== DEFAULT_SELECTION_ID
                    && activeCertificateId !== DEFAULT_SELECTION_ID
                    && activeProxyId !== DEFAULT_SELECTION_ID
                ) {
                    break
                }

                e = findParentEntity(e.id, this.workspace.requests)
            }
        }

        const defaultScenario = activeScenarioId == DEFAULT_SELECTION_ID
            ? 'None Configured'
            : activeScenarioId === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(this.workspace.scenarios.entities.get(activeScenarioId))

        const defaultAuthorization = activeAuthorizationId == DEFAULT_SELECTION_ID
            ? 'None Configured'
            : activeAuthorizationId === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(this.workspace.authorizations.entities.get(activeAuthorizationId))

        const defaultCertificate = activeCertificateId == DEFAULT_SELECTION_ID
            ? 'None Configured'
            : activeCertificateId === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(this.workspace.certificates.entities.get(activeCertificateId))

        const defaultProxy = activeProxyId == DEFAULT_SELECTION_ID
            ? 'None Configured'
            : activeProxyId === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(this.workspace.proxies.entities.get(activeProxyId))


        return {
            scenarios: this.buildEntityList(this.workspace.scenarios, defaultScenario),
            authorizations: this.buildEntityList(this.workspace.authorizations, defaultAuthorization),
            certificates: this.buildEntityList(this.workspace.certificates, defaultCertificate),
            proxies: this.buildEntityList(this.workspace.proxies, defaultProxy),
        }
    }

    getRequestRunInformation(): RunInformation | null {
        if (this.active?.entityType === EditableEntityType.Request) {
            const requestEntry = this.active as EditableWorkbookRequestEntry
            const result = {
                requestId: requestEntry.id,
                workspace: editableWorkspaceToStoredWorkspace(
                    this.workspace.requests,
                    this.workspace.scenarios,
                    this.workspace.authorizations,
                    this.workspace.certificates,
                    this.workspace.proxies,
                    this.workspace.selectedScenario,
                    this.workspace.selectedAuthorization,
                    this.workspace.selectedCertificate,
                    this.workspace.selectedProxy,
                )
            }
            return result
        } else {
            return null
        }
    }

    @action
    addGroup(targetID?: string | null) {
        const entry = new EditableWorkbookRequestGroup()
        entry.id = GenerateIdentifier()
        entry.type = WorkbookRequestType.Group
        entry.runs = 1
        addNestedEntity(entry, this.workspace.requests, true, targetID)
        this.root.window.changeDirty(true)
        this.changeActive(EditableEntityType.Request, entry.id)
    }

    @action
    deleteGroup(id: string) {
        this.deleteRequest(id)
    }

    @action
    moveGroup(id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        this.moveRequest(id, destinationID, onLeft, onLowerHalf)
    }

    @action
    copyGroup(id: string) {
        this.copyRequest(id)
    }

    @action
    setGroupExecution(value: WorkbookGroupExecution) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const requestEntry = this.active as EditableWorkbookRequestEntry
            if (requestEntry.type === WorkbookRequestType.Group) {
                (requestEntry as EditableWorkbookRequestGroup).execution = value
                this.root.window.changeDirty(true)
            }
        }
    }

    @action
    addScenario(targetID?: string | null) {
        const scenario = new EditableWorkbookScenario()
        scenario.id = GenerateIdentifier()
        this.workspace.scenarios.entities.set(scenario.id, scenario)
        addEntity(scenario, this.workspace.scenarios, targetID)
        this.changeActive(EditableEntityType.Scenario, scenario.id)
        this.root.window.changeDirty(true)
    }

    @action
    deleteScenario(id: string) {
        for (const entity of this.workspace.requests.entities.values()) {
            if (entity.selectedScenario?.id === id) {
                entity.selectedScenario = undefined
            }
        }
        removeEntity(id, this.workspace.scenarios)
        this.clearActive()
        this.root.window.changeDirty(true)
    }

    @action
    moveScenario(id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        moveEntity<EditableWorkbookScenario>(id, destinationID, onLowerHalf, onLeft, this.workspace.scenarios)
        this.root.window.changeDirty(true)
        // if (selectedScenario !== NO_SELECTION) {
        //     activateScenario(id)
        // }
    }

    @action
    copyScenario(id: string) {
        const source = this.workspace.scenarios.entities.get(id)
        const scenario = new EditableWorkbookScenario()
        scenario.id = GenerateIdentifier()
        scenario.name = `${GetTitle(source)} - Copy`
        scenario.dirty = true
        const idx = this.workspace.scenarios.topLevelIds.findIndex(eid => eid === id)
        if (idx === -1) {
            this.workspace.scenarios.topLevelIds.push(scenario.id)
        } else {
            this.workspace.scenarios.topLevelIds.splice(idx + 1, 0, scenario.id)
        }
        this.workspace.scenarios.entities.set(scenario.id, scenario)
        this.root.window.changeDirty(true)
        this.changeActive(EditableEntityType.Scenario, scenario.id)
    }

    getScenario(id: string) {
        return this.workspace.scenarios.entities.get(id)
    }

    @action
    setScenarioName(value: string) {
        if (this.active?.entityType === EditableEntityType.Scenario) {
            const scenario = this.active as EditableWorkbookScenario
            scenario.name = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setScenarioPersistence(value: Persistence) {
        if (this.active?.entityType === EditableEntityType.Scenario) {
            const scenario = this.active as EditableWorkbookScenario
            scenario.persistence = value
        }
    }

    @action
    setScenarioVariables(value: EditableNameValuePair[]) {
        if (this.active?.entityType === EditableEntityType.Scenario) {
            const scenario = this.active as EditableWorkbookScenario
            scenario.variables = value
        }
    }

    @action
    addAuthorization(targetID?: string | null) {
        const authorization = new EditableWorkbookBasicAuthorization()
        authorization.id = GenerateIdentifier()

        this.workspace.authorizations.entities.set(authorization.id, authorization)

        addEntity(authorization, this.workspace.authorizations, targetID)
        this.changeActive(EditableEntityType.Authorization, authorization.id)
        this.root.window.changeDirty(true)
    }

    @action
    deleteAuthorization(id: string) {
        for (const entity of this.workspace.requests.entities.values()) {
            if (entity.selectedAuthorization?.id === id) {
                entity.selectedAuthorization = undefined
            }
        }

        removeEntity(id, this.workspace.authorizations)
        this.clearActive()
        this.root.window.changeDirty(true)
    }

    @action
    moveAuthorization(id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        moveEntity<EditableWorkbookAuthorizationEntry>(id, destinationID, onLowerHalf, onLeft, this.workspace.authorizations)
        this.root.window.changeDirty(true)
        // if (selectedAuthorizationId !== id) {
        //     activateAuthorization(id)
        // }
    }

    @action
    copyAuthorization(id: string) {
        const source = this.workspace.authorizations.entities.get(id)
        if (source) {
            const authorization = structuredClone(source)
            authorization.id = GenerateIdentifier()
            authorization.name = `${GetTitle(source)} - Copy`
            authorization.dirty = true
            const idx = this.workspace.authorizations.topLevelIds.indexOf(source.id)
            if (idx === -1) {
                this.workspace.authorizations.topLevelIds.push(authorization.id)
            } else {
                this.workspace.authorizations.topLevelIds.splice(idx + 1, 0, authorization.id)
            }
            this.workspace.authorizations.entities.set(authorization.id, authorization)
            this.root.window.changeDirty(true)
            this.changeActive(EditableEntityType.Authorization, authorization.id)
        }
    }

    getAuthorization(id: string) {
        return this.workspace.authorizations.entities.get(id)
    }

    getAuthorizationCertificateList() {
        return this.buildEntityList(this.workspace.certificates)
    }

    getAuthorizationProxyList() {
        return this.buildEntityList(this.workspace.proxies)
    }

    @action
    setAuthorizationName(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorizationEntry
            auth.name = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setAuthorizationType(value: WorkbookAuthorizationType.ApiKey | WorkbookAuthorizationType.Basic | WorkbookAuthorizationType.OAuth2Client) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorizationEntry
            auth.type = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setAuthorizationUsername(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorizationEntry
            (auth as EditableWorkbookBasicAuthorization).username = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setAuthorizationPassword(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorizationEntry
            (auth as EditableWorkbookBasicAuthorization).password = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setAuthorizatinoAccessTokenUrl(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorizationEntry
            (auth as EditableWorkbookOAuth2ClientAuthorization).accessTokenUrl = value
            this.root.window.changeDirty(true)
        }
    }
    @action
    setAuthorizationClientId(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorizationEntry
            (auth as EditableWorkbookOAuth2ClientAuthorization).clientId = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setAuthorizationClientSecret(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorizationEntry
            (auth as EditableWorkbookOAuth2ClientAuthorization).clientSecret = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setAuthorizationScope(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorizationEntry
            (auth as EditableWorkbookOAuth2ClientAuthorization).scope = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setAuthorizationSelectedCertificateId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorizationEntry
            (auth as EditableWorkbookOAuth2ClientAuthorization).selectedCertificate =
                entityId === DEFAULT_SELECTION_ID
                    ? undefined
                    : entityId == NO_SELECTION_ID
                        ? NO_SELECTION
                        : { id: entityId, name: GetTitle(this.workspace.certificates.entities.get(entityId)) }
            this.root.window.changeDirty(true)
        }
    }

    @action
    setAuthorizationSelectedProxyId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorizationEntry
            (auth as EditableWorkbookOAuth2ClientAuthorization).selectedProxy =
                entityId === DEFAULT_SELECTION_ID
                    ? undefined
                    : entityId == NO_SELECTION_ID
                        ? NO_SELECTION
                        : { id: entityId, name: GetTitle(this.workspace.proxies.entities.get(entityId)) }
            this.root.window.changeDirty(true)
        }
    }

    @action
    setAuthorizationHeader(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorizationEntry
            (auth as EditableWorkbookApiKeyAuthorization).header = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setAuthorizationValue(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorizationEntry
            (auth as EditableWorkbookApiKeyAuthorization).value = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setAuthorizationPersistence(value: Persistence) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorizationEntry
            auth.persistence = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    addCertificate(targetID?: string | null) {
        const certificate = new EditableWorkbookPkcs8PemCertificate()
        certificate.id = GenerateIdentifier()
        this.workspace.certificates.entities.set(certificate.id, certificate)
        addEntity(certificate, this.workspace.certificates, targetID)
        this.changeActive(EditableEntityType.Certificate, certificate.id)
        this.root.window.changeDirty(true)
    }

    @action
    deleteCertificate(id: string) {
        for (const entity of this.workspace.requests.entities.values()) {
            if (entity.selectedCertificate?.id === id) {
                entity.selectedCertificate = undefined
            }
        }
        removeEntity(id, this.workspace.certificates)
        this.clearActive()
        this.root.window.changeDirty(true)
    }

    @action
    moveCertificate(id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        moveEntity(id, destinationID, onLowerHalf, onLeft, this.workspace.certificates)
        this.root.window.changeDirty(true)
    }

    @action
    copyCertificate(id: string) {
        const source = this.workspace.certificates.entities.get(id)
        if (source) {
            const certificate = structuredClone(source)
            certificate.id = GenerateIdentifier()
            certificate.name = `${GetTitle(source)} - Copy`
            certificate.dirty = true
            const idx = this.workspace.certificates.topLevelIds.findIndex(cid => cid === source.id)
            if (idx === -1) {
                this.workspace.certificates.topLevelIds.push(certificate.id)
            } else {
                this.workspace.certificates.topLevelIds.splice(idx + 1, 0, certificate.id)
            }
            this.workspace.certificates.entities.set(certificate.id, certificate)
            this.root.window.changeDirty(true)
            this.changeActive(EditableEntityType.Certificate, certificate.id)
        }
    }

    getCertificate(id: string) {
        return this.workspace.certificates.entities.get(id)
    }

    @action
    setCertificateName(value: string) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableWorkbookCertificateEntry
            certificate.name = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setCertificatePersistence(value: Persistence) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableWorkbookCertificateEntry
            certificate.persistence = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setCertificateType(value: WorkbookCertificateType.PEM | WorkbookCertificateType.PKCS8_PEM | WorkbookCertificateType.PKCS12) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableWorkbookCertificateEntry
            certificate.type = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setCertificatePem(value: string) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableWorkbookCertificateEntry
            (certificate as EditableWorkbookPkcs8PemCertificate).pem = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setCertificateKey(value: string | undefined) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableWorkbookCertificateEntry
            (certificate as EditableWorkbookPkcs8PemCertificate).key = value || ''
            this.root.window.changeDirty(true)
        }
    }

    @action
    setCertificatePfx(value: string) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableWorkbookCertificateEntry
            (certificate as EditableWorkbookPkcs12Certificate).pfx = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setCertificatePassword(value: string) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableWorkbookCertificateEntry
            (certificate as EditableWorkbookPkcs12Certificate).password = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    addProxy(targetID?: string | null) {
        const proxy = new EditableWorkbookProxy()
        proxy.id = GenerateIdentifier()
        this.workspace.proxies.entities.set(proxy.id, proxy)
        addEntity(proxy, this.workspace.proxies, targetID)
        this.changeActive(EditableEntityType.Proxy, proxy.id)
        this.root.window.changeDirty(true)
    }

    @action
    deleteProxy(id: string) {
        for (const entity of this.workspace.requests.entities.values()) {
            if (entity.selectedProxy?.id === id) {
                entity.selectedProxy = undefined
            }
        }
        removeEntity(id, this.workspace.proxies)
        this.clearActive()
        this.root.window.changeDirty(true)
    }

    @action
    moveProxy(id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        moveEntity(id, destinationID, onLowerHalf, onLeft, this.workspace.proxies)
        this.root.window.changeDirty(true)
        // if (selectedProxyId !== id) {
        //     activateProxy(id)
        // }
    }

    @action
    copyProxy(id: string) {
        const source = this.workspace.proxies.entities.get(id)
        if (source) {
            const proxy = structuredClone(source)
            proxy.id = GenerateIdentifier()
            proxy.name = `${GetTitle(source)} - Copy`
            proxy.dirty = true
            const idx = this.workspace.proxies.topLevelIds.findIndex(pid => pid === id)
            if (idx === -1) {
                this.workspace.proxies.topLevelIds.push(proxy.id)
            } else {
                this.workspace.proxies.topLevelIds.splice(idx + 1, 0, proxy.id)
            }
            this.workspace.proxies.entities.set(proxy.id, proxy)
            this.root.window.changeDirty(true)
            this.changeActive(EditableEntityType.Proxy, proxy.id)
        }
    }

    @action
    setProxyName(value: string) {
        if (this.active?.entityType === EditableEntityType.Proxy) {
            const proxy = this.active as EditableWorkbookProxy
            proxy.name = value
            this.root.window.changeDirty(true)
        }
    }

    @action
    setProxyUrl(url: string) {
        if (this.active?.entityType === EditableEntityType.Proxy) {
            const proxy = this.active as EditableWorkbookProxy
            proxy.url = url
            this.root.window.changeDirty(true)
        }
    }

    @action
    setProxyPersistence(value: Persistence) {
        if (this.active?.entityType === EditableEntityType.Proxy) {
            const proxy = this.active as EditableWorkbookProxy
            proxy.persistence = value
            this.root.window.changeDirty(true)
        }
    }

    getProxy(id: string) {
        return this.workspace.proxies.entities.get(id)
    }

}
