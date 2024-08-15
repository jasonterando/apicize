
import { ReactNode, createContext, useContext } from "react"
import { EditableWorkbookAuthorization } from "../models/workbook/editable-workbook-authorization"
import { castEntryAsGroup, castEntryAsRequest, EditableWorkbookRequestEntry } from "../models/workbook/editable-workbook-request-entry"
import { EditableWorkbookScenario } from "../models/workbook/editable-workbook-scenario"
import {
    WorkbookBodyData, GetTitle, WorkbookAuthorizationType, WorkbookBasicAuthorization, WorkbookOAuth2ClientAuthorization, WorkbookApiKeyAuthorization, StoredGlobalSettings, WorkbookMethod, WorkbookBodyType, Persistence, removeEntity, moveEntity, addNestedEntity, moveNestedEntity, getNestedEntity, getEntity, Workspace, addEntity, removeNestedEntity, findParentEntity, IndexedEntities, Identifiable, Named, WorkbookRequestGroup, WorkbookGroupExecution, 
    WorkbookCertificateType, WorkbookPkcs12Certificate, WorkbookPkcs8PemCertificate} from "@apicize/lib-typescript"
import { newEditableWorkspace, stateToGlobalSettingsStorage, editableWorkspaceToStoredWorkspace, storedWorkspaceToEditableWorkspace } from "../services/apicize-serializer"
import {
    ResultType, NavigationType, NO_SELECTION, NO_SELECTION_ID, DEFAULT_SELECTION_ID,
} from "../models/store"
import { EditableWorkbookRequest } from "../models/workbook/editable-workbook-request"
import { GenerateIdentifier } from "../services/random-identifier-generator"
import { EditableNameValuePair } from "../models/workbook/editable-name-value-pair"
import { EditableWorkbookRequestGroup } from "../models/workbook/editable-workbook-request-group"
import { WorkbookExecution, WorkbookExecutionResult, WorkbookExecutionSummary } from "../models/workbook/workbook-execution"
import { NavigationListItem } from "../models/navigation-list-item"
import { MAX_TEXT_RENDER_LENGTH } from "../controls/viewers/text-viewer"
import { EditableWorkbookProxy } from "../models/workbook/editable-workbook-proxy"
import { EntitySelection } from "../models/workbook/entity-selection"
import { EditableWorkbookCertificate } from "../models/workbook/editable-workbook-certificate"

import { useNavigationState } from './navigation-state-context'
import { useNavigationContent } from './navigation-content-context'
import { useWindow } from "./window-context"
import { useHelp } from "./help-context"
import { GlobalStorageType } from "../models/global-storage"
import { useExecution } from "./execution-context"


const WorkspaceActions = (store: GlobalStorageType) => {

    let navigationStateCtx = useNavigationState()
    let navigationContentCtx = useNavigationContent()
    let executionCtx = useExecution()
    let windowCtx = useWindow()
    let helpCtx = useHelp()

    let activeType = navigationStateCtx.activeType
    let activeID = navigationStateCtx.activeId
    let activeFileName = windowCtx.workbookFullName

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

    // Generate request navigation list
    const generateRequestNavList = () => {
        const mapItem = (id: string) => {
            const requestItem = store.workspace.requests.entities[id]
            const result: NavigationListItem = { id, name: GetTitle(requestItem), type: 'request' }
            const children = store.workspace.requests.childIds ? store.workspace.requests.childIds[id] : undefined
            if (children) {
                result.children = children.map(id => mapItem(id))
            } else {
                result.children = undefined
            }
            return result
        }
        return store.workspace.requests.topLevelIds.map(id => mapItem(id))
    }

    // Generate scenario navigation list
    const generateScenarioNavList = () =>
        store.workspace.scenarios.topLevelIds.map(id => (
            { id, name: GetTitle(store.workspace.scenarios.entities[id]), type: 'scenario' }
        ))

    // Generate authorization navigation list
    const generateAuthorizationNavList = () =>
        store.workspace.authorizations.topLevelIds.map(id => (
            { id, name: GetTitle(store.workspace.authorizations.entities[id]), type: 'auth' }
        ))

    // Generate certificate navigation list
    const generateCertificateNavList = () =>
        store.workspace.certificates.topLevelIds.map(id => (
            { id, name: GetTitle(store.workspace.certificates.entities[id]), type: 'cert' }
        ))

    // Generate proxy navigation list
    const generateProxyNavList = () =>
        store.workspace.proxies.topLevelIds.map(id => (
            { id, name: GetTitle(store.workspace.proxies.entities[id]), type: 'proxy' }
        ))

    // Clear all selected records
    const clearAllActivations = () => {
        navigationStateCtx.clearActive()
    }

    /**
     * Generate a list of entities, including default and none selections, returns list and selected ID
     * @param entityList 
     * @param activeId 
     * @returns tuple of list and selected ID
     */
    const buildEntityList = <T extends Identifiable & Named>(
        entityList: IndexedEntities<T>,
        defaultName?: string): EntitySelection[] => {
        const list: EntitySelection[] = []
        if (defaultName !== undefined) {
            list.push({ id: DEFAULT_SELECTION_ID, name: `Default (${defaultName})` })
        }
        list.push({ id: NO_SELECTION_ID, name: `Off` })
        for (const id of entityList.topLevelIds) {
            const e = entityList.entities[id]
            list.push({ id: e.id, name: GetTitle(e) })
        }
        return list
    }

    // Activate request or request group state for editing
    const activateRequestOrGroup = (id: string | null) => {
        let requestEntry
        if (id) {
            requestEntry = store.workspace.requests.entities[id]
            if (!requestEntry) throw new Error(`Invalid ID ${id}`)
        } else {
            requestEntry = null
        }

        const request = castEntryAsRequest(requestEntry)
        if (request) {
            helpCtx.hideHelp()
            helpCtx.changeNextHelpTopic('requests')
            navigationStateCtx.changeActive(NavigationType.Request, request.id)
        } else {
            helpCtx.hideHelp()
            helpCtx.changeNextHelpTopic('requests')

            const group = castEntryAsGroup(requestEntry)
            if (group) {
                navigationStateCtx.changeActive(NavigationType.Group, group.id)
            } else {
                navigationStateCtx.clearActive()
            }
        }

        // const execution = id ? requestExecutions.get(id) : null
        // if (execution) {
        //     activateExecution(id, execution)
        // } else {
        //     activateExecution(null, null)
        // }
    }

    // Copy scenario state for editing
    const activateScenario = (id: string | null) => {
        let scenario
        if (id) {
            scenario = store.workspace.scenarios.entities[id]
            if (!scenario) throw new Error(`Invalid ID ${id}`)
        } else {
            scenario = null
        }

        if (scenario) {
            helpCtx.hideHelp()
            helpCtx.changeNextHelpTopic('scenarios')
            navigationStateCtx.changeActive(NavigationType.Scenario, scenario.id)
        } else {
            navigationStateCtx.clearActive()
        }
    }

    // Copy authorization state for editing
    const activateAuthorization = (id: string | null) => {
        let authorization
        if (id) {
            authorization = store.workspace.authorizations.entities[id]
            if (!authorization) throw new Error(`Invalid ID ${id}`)
        } else {
            authorization = null
        }

        if (authorization) {
            helpCtx.hideHelp()
            helpCtx.changeNextHelpTopic('authorizations')
            navigationStateCtx.changeActive(NavigationType.Authorization, authorization.id)
        } else {
            navigationStateCtx.clearActive()
        }
    }

    // Copy certificate state for editing
    const activateCertificate = (id: string | null) => {
        let certificate
        if (id) {
            certificate = store.workspace.certificates.entities[id]
            if (!certificate) throw new Error(`Invalid ID ${id}`)
        } else {
            certificate = null
        }

        if (certificate) {
            helpCtx.hideHelp()
            helpCtx.changeNextHelpTopic('certificates')
            navigationStateCtx.changeActive(NavigationType.Certificate, certificate.id)
        } else {
            navigationStateCtx.clearActive()
        }
    }

    // Copy proxy state for editing
    const activateProxy = (id: string | null) => {
        let proxy
        if (id) {
            proxy = store.workspace.proxies.entities[id]
            if (!proxy) throw new Error(`Invalid ID ${id}`)
        } else {
            proxy = null
        }

        if (proxy) {
            helpCtx.hideHelp()
            helpCtx.changeNextHelpTopic('proxies')
            navigationStateCtx.changeActive(NavigationType.Proxy, proxy.id)
        } else {
            navigationStateCtx.clearActive()
        }
    }

    const activateExecution = (
        id: string | null,
        execution: WorkbookExecution | null,
    ) => {
        if (id && execution) {
            let longTextInResponse
            let resultType
            let result

            if (execution.runIndex === undefined || execution.results === undefined || (execution.results?.length ?? 0) === 0) {
                resultType = ResultType.None
                longTextInResponse = false
            } else {
                let resultIndex = Math.max(execution.resultIndex ?? 0, 0)
                switch (execution.results[execution.runIndex].length) {
                    case 0:
                        resultType = ResultType.Failed
                        longTextInResponse = false
                        break
                    case 1:
                        result = execution.results[execution.runIndex][resultIndex]
                        resultType = result?.success ? ResultType.Single : ResultType.Failed
                        longTextInResponse = (result?.response?.body?.text?.length ?? 0) > MAX_TEXT_RENDER_LENGTH
                        break
                    default:
                        let idx = execution.resultIndex ?? -1
                        if (idx >= 0) {
                            result = execution.results[execution.runIndex][resultIndex]
                            resultType = result?.success ? ResultType.Single : ResultType.Failed
                            longTextInResponse = (result?.response?.body?.text?.length ?? 0) > MAX_TEXT_RENDER_LENGTH
                        } else {
                            resultType = ResultType.Group
                            longTextInResponse = false
                        }
                        break
                }
            }

            // dispatch(executionActions.setExecution({
            //     id,
            //     resultType,
            //     longTextInResponse,
            //     failedTestCount: result ? result.failedTestCount : 0,
            //     runIndex: execution.runIndex,
            //     runList: execution.runList,
            //     resultIndex: execution.resultIndex,
            //     resultLists: execution.resultLists,
            //     milliseconds: execution.milliseconds,
            // }))
            navigationStateCtx.changeExecution(id)
        } else {
            navigationStateCtx.clearExecution()
        }
    }

    const getSelectedExecutionResult = (
        execution: WorkbookExecution | undefined
    ): {
        result?: WorkbookExecutionResult,
        summary?: WorkbookExecutionSummary
    } => {
        if (execution
            && execution.results
            && execution.runIndex !== undefined
            && execution.resultIndex !== undefined
            && execution.resultIndex <= (execution.results[execution.runIndex]?.length ?? -1)
        ) {
            const runResults = execution.results[execution.runIndex]
            if (execution.resultIndex === -1 && runResults.length > 1) {
                return {
                    summary: {
                        run: execution.runIndex + 1,
                        totalRuns: runResults[0].totalRuns,
                        requests: runResults.map(r => ({
                            name: store.workspace.requests.entities[r.requestId]?.name ?? '(Unnamed)',
                            response: r.response ? { status: r.response.status, statusText: r.response.statusText } : undefined,
                            tests: r.tests?.map(t => ({
                                testName: t.testName,
                                success: t.success,
                                error: t.error,
                                logs: t.logs
                            })),
                            executedAt: r.executedAt,
                            milliseconds: r.milliseconds,
                            success: r.success,
                            errorMessage: r.errorMessage
                        }))
                    }
                }
            } else {
                return {
                    result: runResults[execution.resultIndex === -1 ? 0 : execution.resultIndex]
                }
            }
        } else {
            return {}
        }
    }

    // Actions for updating request data and state
    const requestContextActions = {
        add: (targetID?: string | null) => {
            const id = GenerateIdentifier()
            const entry = {
                id,
                name: '',
                method: WorkbookMethod.Get,
                url: '',
                timeout: 5000,
                runs: 1,
                test: `describe('status', () => {
    it('equals 200', () => {
        expect(response.status).to.equal(200)
    })
})`} as EditableWorkbookRequest
            addNestedEntity(entry, store.workspace.requests, targetID)
            windowCtx.changeDirty(true)
            navigationContentCtx.changeRequestList(generateRequestNavList())
            activateRequestOrGroup(id)
        },
        delete: (id: string) => {
            removeNestedEntity(id, store.workspace.requests)
            if (activeID === id) {
                activateRequestOrGroup(null)
            }
            windowCtx.changeDirty(true)
            navigationContentCtx.changeRequestList(generateRequestNavList())
        },
        move: (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
            moveNestedEntity(id, destinationID, onLowerHalf, onLeft, store.workspace.requests)
            windowCtx.changeDirty(true)
            navigationContentCtx.changeRequestList(generateRequestNavList())
            // if (activeID !== id) {
            //     activateRequestOrGroup(id)
            // }
        },
        copy: (id: string) => {
            // Return the ID of the duplicated entry
            const copyEntry = (entry: EditableWorkbookRequestEntry) => {
                const dupe = structuredClone(entry)
                // For some reason, structuredClone doesn't work with requests reliably
                // const dupe = JSON.parse(JSON.stringify(entry))
                dupe.id = GenerateIdentifier()
                dupe.name = `${GetTitle(dupe)} - copy`
                dupe.dirty = true

                const request = castEntryAsRequest(dupe)
                if (request) {
                    request?.headers?.forEach(h => h.id = GenerateIdentifier())
                    request?.queryStringParams?.forEach(p => p.id = GenerateIdentifier())
                    store.workspace.requests.entities[request.id] = request
                    return request
                }

                const group = castEntryAsGroup(dupe)
                if (group) {
                    if (store.workspace.requests.childIds && store.workspace.requests.childIds) {
                        const sourceChildIDs = store.workspace.requests.childIds[source.id]
                        if (sourceChildIDs.length > 0) {
                            const dupedChildIDs: string[] = []
                            store.workspace.requests.childIds[group.id] = dupedChildIDs

                            sourceChildIDs.forEach(childID => {
                                const childEntry = store.workspace.requests.entities[childID]
                                const dupedChildID = copyEntry(childEntry).id
                                dupedChildIDs.push(dupedChildID)
                            })
                        }
                    }
                    store.workspace.requests.entities[group.id] = group
                    return group
                }

                throw new Error('Invalid entry')
            }

            const source = getNestedEntity(id, store.workspace.requests)
            const entry = copyEntry(source)

            let append = true
            if (store.workspace.requests.childIds) {
                for (const childIDs of Object.values(store.workspace.requests.childIds)) {
                    let idxChild = childIDs.indexOf(id)
                    if (idxChild !== -1) {
                        childIDs.splice(idxChild + 1, 0, entry.id)
                        append = false
                        break
                    }
                }
            }

            if (append) {
                const idx = store.workspace.requests.topLevelIds.indexOf(id)
                if (idx !== -1) {
                    store.workspace.requests.topLevelIds.splice(idx + 1, 0, entry.id)
                    append = false
                }
            }

            if (append) {
                store.workspace.requests.topLevelIds.push(entry.id)
            }

            windowCtx.changeDirty(true)
            navigationContentCtx.changeRequestList(generateRequestNavList())
            activateRequestOrGroup(entry.id)
        },
        getRequest: (id: string) => {
            return store.workspace.requests.entities[id] as EditableWorkbookRequestEntry
        },
        setName: (id: string, value: string) => {
            let entry = store.workspace.requests.entities[id] as EditableWorkbookRequestEntry
            entry.name = value
            windowCtx.changeDirty(true)
            navigationContentCtx.changeRequestList(generateRequestNavList())
        },
        setUrl: (id: string, value: string) => {
            let entry = store.workspace.requests.entities[id] as EditableWorkbookRequest
            entry.url = value
            windowCtx.changeDirty(true)
        },
        setMethod: (id: string, value: WorkbookMethod) => {
            let entry = store.workspace.requests.entities[id] as EditableWorkbookRequest
            entry.method = value
            windowCtx.changeDirty(true)
        },
        setTimeout: (id: string, value: number) => {
            let entry = store.workspace.requests.entities[id] as EditableWorkbookRequest
            entry.timeout = value
            windowCtx.changeDirty(true)
        },
        setQueryStringParams: (id: string, value: EditableNameValuePair[] | undefined) => {
            let entry = store.workspace.requests.entities[id] as EditableWorkbookRequest
            entry.queryStringParams = value
            windowCtx.changeDirty(true)
        },
        setHeaders: (id: string, value: EditableNameValuePair[] | undefined) => {
            let entry = store.workspace.requests.entities[id] as EditableWorkbookRequest
            entry.headers = value
            windowCtx.changeDirty(true)
        },
        setBodyType: (id: string, value: WorkbookBodyType | undefined) => {
            let entry = store.workspace.requests.entities[id] as EditableWorkbookRequest
            let oldBodyType = entry.body?.type ?? WorkbookBodyType.None
            let newBodyData = entry.body?.data
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
            entry.body = {
                type: newBodyType,
                data: newBodyData
            }
            windowCtx.changeDirty(true)
        },
        setBodyData: (id: string, value: WorkbookBodyData | undefined) => {
            let entry = store.workspace.requests.entities[id] as EditableWorkbookRequest
            if (entry.body) {
                entry.body.data = value
            } else {
                entry.body = { data: value }
            }
            windowCtx.changeDirty(true)
        },
        setRuns: (id: string, value: number) => {
            let entry = store.workspace.requests.entities[id] as EditableWorkbookRequest
            entry.runs = value
            windowCtx.changeDirty(true)
        },
        setTest: (id: string, value: string | undefined) => {
            let entry = store.workspace.requests.entities[id] as EditableWorkbookRequest
            entry.test = value
            // generateRequestNavList()
            windowCtx.changeDirty(true)
        },
        setSelectedScenarioId: (requestId: string, entityId: string) => {
            let entry = store.workspace.requests.entities[requestId] as EditableWorkbookRequest
            entry.selectedScenario = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(store.workspace.scenarios.entities[entityId]) }
            windowCtx.changeDirty(true)
        },
        setSelectedAuthorizationId: (requestId: string, entityId: string) => {
            let entry = store.workspace.requests.entities[requestId] as EditableWorkbookRequest
            entry.selectedAuthorization = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(store.workspace.authorizations.entities[entityId]) }
            windowCtx.changeDirty(true)
        },
        setSelectedCertificateId: (requestId: string, entityId: string) => {
            let entry = store.workspace.requests.entities[requestId] as EditableWorkbookRequest
            entry.selectedCertificate = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(store.workspace.certificates.entities[entityId]) }
            windowCtx.changeDirty(true)
        },
        setSelectedProxyId: (requestId: string, entityId: string) => {
            let entry = store.workspace.requests.entities[requestId] as EditableWorkbookRequest
            entry.selectedProxy = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(store.workspace.proxies.entities[entityId]) }
            windowCtx.changeDirty(true)
        },
        getRunInformation: () => {
            const result = (activeType === NavigationType.Request && activeID)
                ? {
                    requestId: activeID,
                    workspace: editableWorkspaceToStoredWorkspace(
                        store.workspace.requests,
                        store.workspace.scenarios,
                        store.workspace.authorizations,
                        store.workspace.certificates,
                        store.workspace.proxies,
                        store.workspace.selectedScenario,
                        store.workspace.selectedAuthorization,
                        store.workspace.selectedCertificate,
                        store.workspace.selectedProxy,
                    )
                }
                : undefined
            return result
        }
    }

    // Actions for updating request groups data and state
    const groupContextActions = {
        add: (targetID?: string | null) => {
            const id = GenerateIdentifier()
            const entry = {
                id,
                name: '',
                runs: 1,
            } as EditableWorkbookRequestGroup
            addNestedEntity(entry, store.workspace.requests, targetID)
            windowCtx.changeDirty(true)
            navigationContentCtx.changeRequestList(generateRequestNavList())
            activateRequestOrGroup(id)
        },
        delete: (id: string) => {
            requestContextActions.delete(id)
        },
        move: (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
            requestContextActions.move(id, destinationID, onLeft, onLowerHalf)
        },
        copy: (id: string) => {
            requestContextActions.copy(id)
        },
        setName: (id: string, value: string) => {
            let entry = store.workspace.requests.entities[id]
            entry.name = value
            windowCtx.changeDirty(true)
            navigationContentCtx.changeRequestList(generateRequestNavList())
        },
        setExecution: (id: string, value: WorkbookGroupExecution) => {
            let entry = store.workspace.requests.entities[id] as WorkbookRequestGroup
            entry.execution = value
            windowCtx.changeDirty(true)
            navigationContentCtx.changeRequestList(generateRequestNavList())
        },
        setRuns: (id: string, value: number) => {
            let entry = store.workspace.requests.entities[id] as EditableWorkbookRequestGroup
            entry.runs = value
            windowCtx.changeDirty(true)
        },
        getRunInformation: () => {
            const result = (activeType === NavigationType.Group && activeID)
                ? {
                    requestId: activeID,
                    workspace: editableWorkspaceToStoredWorkspace(
                        store.workspace.requests,
                        store.workspace.scenarios,
                        store.workspace.authorizations,
                        store.workspace.certificates,
                        store.workspace.proxies,
                        store.workspace.selectedScenario,
                        store.workspace.selectedAuthorization,
                        store.workspace.selectedCertificate,
                        store.workspace.selectedProxy,
                    )
                }
                : undefined
            return result
        }
    }


    // Actions for updating scenario data and state
    const scenarioContextActions = {
        add: (targetID?: string | null) => {
            const id = GenerateIdentifier()
            const scenario = {
                id,
                name: '',
                variables: [] as EditableNameValuePair[]
            } as EditableWorkbookScenario

            store.workspace.scenarios.entities[scenario.id] = scenario
            addEntity(scenario, store.workspace.scenarios, targetID)
            activateScenario(id)
            windowCtx.changeDirty(true)
            navigationContentCtx.changeScenarioList(generateScenarioNavList())
        },
        delete: (id: string) => {
            for (const entity of Object.values(store.workspace.requests.entities)) {
                if (entity.selectedScenario?.id === id) {
                    entity.selectedScenario = undefined
                }
            }
            removeEntity(id, store.workspace.scenarios)
            activateScenario(null)
            activateRequestOrGroup(null)
            windowCtx.changeDirty(true)
            navigationContentCtx.changeScenarioList(generateScenarioNavList())
        },
        move: (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
            moveEntity<EditableWorkbookScenario>(id, destinationID, onLowerHalf, onLeft, store.workspace.scenarios)
            windowCtx.changeDirty(true)
            navigationContentCtx.changeScenarioList(generateScenarioNavList())
            // if (selectedScenario !== NO_SELECTION) {
            //     activateScenario(id)
            // }
        },
        copy: (id: string) => {
            const source = getEntity(id, store.workspace.scenarios)
            const scenario = structuredClone(source)
            scenario.id = GenerateIdentifier()
            scenario.name = `${GetTitle(source)} - Copy`
            scenario.dirty = true
            const idx = store.workspace.scenarios.topLevelIds.findIndex(id => id === source.id)
            if (idx === -1) {
                store.workspace.scenarios.topLevelIds.push(scenario.id)
            } else {
                store.workspace.scenarios.topLevelIds.splice(idx + 1, 0, scenario.id)
            }
            store.workspace.scenarios.entities[scenario.id] = scenario
            windowCtx.changeDirty(true)
            navigationContentCtx.changeScenarioList(generateScenarioNavList())
            activateScenario(scenario.id)
        },
        getScenario: (id: string) => {
            console.log(`Retrieving scenario ${id}`)
            return store.workspace.scenarios.entities[id]
        },
        setName: (id: string, value: string) => {
            let entry = store.workspace.scenarios.entities[id]
            entry.name = value
            navigationContentCtx.changeScenarioList(generateScenarioNavList())
        },
        setPersistence: (id: string, value: Persistence) => {
            let entry = store.workspace.scenarios.entities[id]
            entry.persistence = value
        },
        setVariables: (id: string, value: EditableNameValuePair[] | undefined) => {
            let entry = store.workspace.scenarios.entities[id]
            entry.variables = value
        }
    }

    // Actions for updating authorization data and state
    const authorizationContextActions = {
        add: (targetID?: string | null) => {
            const id = GenerateIdentifier()
            const authorization = {
                id,
                name: '',
                persistence: Persistence.Workbook,
                type: WorkbookAuthorizationType.Basic,
                data: {
                    username: '',
                    password: '',
                    accessTokenUrl: '',
                    clientID: '',
                    clientSecret: '',
                    scope: '',
                    certificateId: NO_SELECTION_ID,
                    proxyId: NO_SELECTION_ID,
                    // sendCredentialsInBody: false,
                    header: 'x-api-key',
                    value: ''
                },
            } as EditableWorkbookAuthorization

            store.workspace.authorizations.entities[authorization.id] = authorization

            addEntity(authorization, store.workspace.authorizations, targetID)
            activateAuthorization(id)
            windowCtx.changeDirty(true)
            navigationContentCtx.changeAuthorizationList(generateAuthorizationNavList())
        },
        delete: (id: string) => {
            for (const entity of Object.values(store.workspace.requests.entities)) {
                if (entity.selectedAuthorization?.id === id) {
                    entity.selectedAuthorization = undefined
                }
            }
            removeEntity(id, store.workspace.authorizations)
            activateAuthorization(null)
            windowCtx.changeDirty(true)
            navigationContentCtx.changeAuthorizationList(generateAuthorizationNavList())
        },
        move: (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
            moveEntity<EditableWorkbookAuthorization>(id, destinationID, onLowerHalf, onLeft, store.workspace.authorizations)
            windowCtx.changeDirty(true)
            navigationContentCtx.changeAuthorizationList(generateAuthorizationNavList())
            // if (selectedAuthorizationId !== id) {
            //     activateAuthorization(id)
            // }
        },
        copy: (id: string) => {
            const source = getNestedEntity(id, store.workspace.authorizations)
            const authorization = structuredClone(source)
            authorization.id = GenerateIdentifier()
            authorization.name = `${GetTitle(source)} - Copy`
            authorization.dirty = true
            const idx = store.workspace.authorizations.topLevelIds.indexOf(source.id)
            if (idx === -1) {
                store.workspace.authorizations.topLevelIds.push(authorization.id)
            } else {
                store.workspace.authorizations.topLevelIds.splice(idx + 1, 0, authorization.id)
            }
            store.workspace.authorizations.entities[authorization.id] = authorization
            windowCtx.changeDirty(true)
            navigationContentCtx.changeAuthorizationList(generateAuthorizationNavList())
            activateAuthorization(authorization.id)
        },
        getAuthorization: (id: string) => {
            return store.workspace.authorizations.entities[id]
        },
        getCertificateList: () => buildEntityList(store.workspace.certificates),
        getProxyList: () => buildEntityList(store.workspace.proxies),
        setName: (id: string, value: string) => {
            let entry = store.workspace.authorizations.entities[id]
            entry.name = value
            navigationContentCtx.changeAuthorizationList(generateAuthorizationNavList())
        },
        setType: (id: string, value: WorkbookAuthorizationType) => {
            let entry = store.workspace.authorizations.entities[id]
            entry.type = value
        },
        setUsername: (id: string, value: string) => {
            let entry = store.workspace.authorizations.entities[id] as WorkbookBasicAuthorization
            entry.username = value
        },
        setPassword: (id: string, value: string) => {
            let entry = store.workspace.authorizations.entities[id] as WorkbookBasicAuthorization
            entry.password = value
        },
        setAccessTokenUrl: (id: string, value: string) => {
            let entry = store.workspace.authorizations.entities[id] as WorkbookOAuth2ClientAuthorization
            entry.accessTokenUrl = value
        },
        setClientId: (id: string, value: string) => {
            let entry = store.workspace.authorizations.entities[id] as WorkbookOAuth2ClientAuthorization
            entry.clientId = value
        },
        setClientSecret: (id: string, value: string) => {
            let entry = store.workspace.authorizations.entities[id] as WorkbookOAuth2ClientAuthorization
            entry.clientSecret = value
        },
        setScope: (id: string, value: string) => {
            let entry = store.workspace.authorizations.entities[id] as WorkbookOAuth2ClientAuthorization
            entry.scope = value
        },
        setSelectedCertificateId: (id: string, entityId: string) => {
            let entry = store.workspace.authorizations.entities[id] as WorkbookOAuth2ClientAuthorization
            entry.selectedCertificate = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(store.workspace.certificates.entities[entityId]) }
            windowCtx.changeDirty(true)
        },
        setSelectedProxyId: (id: string, entityId: string) => {
            let entry = store.workspace.authorizations.entities[id] as WorkbookOAuth2ClientAuthorization
            entry.selectedProxy = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(store.workspace.proxies.entities[entityId]) }
            windowCtx.changeDirty(true)
        },
        setHeader: (id: string, value: string) => {
            let entry = store.workspace.authorizations.entities[id] as WorkbookApiKeyAuthorization
            entry.header = value
        },
        setValue: (id: string, value: string) => {
            let entry = store.workspace.authorizations.entities[id] as WorkbookApiKeyAuthorization
            entry.value = value
        },
        setPersistence: (id: string, value: Persistence) => {
            let entry = store.workspace.authorizations.entities[id]
            entry.persistence = value
        },
    }

    // Actions for updating certificate data and state
    const certificateContextActions = {
        add: (targetID?: string | null) => {
            const id = GenerateIdentifier()
            const certificate = {
                id,
                name: '',
                persistence: Persistence.Private,
                type: WorkbookCertificateType.PKCS8_PEM,
                pem: undefined,
                key: undefined,
                pfx: undefined,
            } as EditableWorkbookCertificate

            store.workspace.certificates.entities[certificate.id] = certificate
            addEntity(certificate, store.workspace.certificates, targetID)
            activateCertificate(id)
            windowCtx.changeDirty(true)
            navigationContentCtx.changeCertificateList(generateCertificateNavList())
        },
        delete: (id: string) => {
            for (const entity of Object.values(store.workspace.requests.entities)) {
                if (entity.selectedCertificate?.id === id) {
                    entity.selectedCertificate = undefined
                }
            }
            removeEntity(id, store.workspace.certificates)
            activateCertificate(null)
            activateRequestOrGroup(null)
            windowCtx.changeDirty(true)
            navigationContentCtx.changeCertificateList(generateCertificateNavList())
        },
        move: (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
            moveEntity<EditableWorkbookCertificate>(id, destinationID, onLowerHalf, onLeft, store.workspace.certificates)
            windowCtx.changeDirty(true)
            navigationContentCtx.changeCertificateList(generateCertificateNavList())
            // if (selectedScenario !== NO_SELECTION) {
            //     activateScenario(id)
            // }
        },
        copy: (id: string) => {
            const source = getEntity(id, store.workspace.certificates)
            const certificate = structuredClone(source)
            certificate.id = GenerateIdentifier()
            certificate.name = `${GetTitle(source)} - Copy`
            certificate.dirty = true
            const idx = store.workspace.certificates.topLevelIds.findIndex(id => id === source.id)
            if (idx === -1) {
                store.workspace.certificates.topLevelIds.push(certificate.id)
            } else {
                store.workspace.certificates.topLevelIds.splice(idx + 1, 0, certificate.id)
            }
            store.workspace.certificates.entities[certificate.id] = certificate
            windowCtx.changeDirty(true)
            navigationContentCtx.changeCertificateList(generateCertificateNavList())
            activateCertificate(certificate.id)
        },
        getCertificate: (id: string) => {
            return store.workspace.certificates.entities[id]
        },
        setName: (id: string, value: string) => {
            let entry = store.workspace.certificates.entities[id]
            entry.name = value
            navigationContentCtx.changeCertificateList(generateCertificateNavList())
            windowCtx.changeDirty(true)
        },
        setPersistence: (id: string, value: Persistence) => {
            let entry = store.workspace.certificates.entities[id]
            entry.persistence = value
            windowCtx.changeDirty(true)
        },
        setType: (id: string, value: WorkbookCertificateType) => {
            let entry = store.workspace.certificates.entities[id]
            entry.type = value
            navigationContentCtx.changeCertificateList(generateCertificateNavList())
            windowCtx.changeDirty(true)
        },
        setPem: (id: string, value: string) => {
            let entry = store.workspace.certificates.entities[id] as WorkbookPkcs8PemCertificate
            entry.pem = value
            windowCtx.changeDirty(true)
        },
        setKey: (id: string, value: string | undefined) => {
            let entry = store.workspace.certificates.entities[id] as WorkbookPkcs8PemCertificate
            entry.key = value
            windowCtx.changeDirty(true)
        },
        setPfx: (id: string, value: string) => {
            let entry = store.workspace.certificates.entities[id] as WorkbookPkcs12Certificate
            entry.pfx = value
            windowCtx.changeDirty(true)
        },
        setPassword: (id: string, value: string) => {
            let entry = store.workspace.certificates.entities[id] as WorkbookPkcs12Certificate
            entry.password = value
            windowCtx.changeDirty(true)
        },
    }

    // Actions for updating proxy data and state
    const proxyContextActions = {
        add: (targetID?: string | null) => {
            const id = GenerateIdentifier()
            const proxy = {
                id,
                name: '',
                url: '',
                persistence: Persistence.Private,

            } as EditableWorkbookProxy

            store.workspace.proxies.entities[proxy.id] = proxy
            addEntity(proxy, store.workspace.proxies, targetID)
            activateProxy(id)
            windowCtx.changeDirty(true)
            navigationContentCtx.changeProxyList(generateProxyNavList())
        },
        delete: (id: string) => {
            for (const entity of Object.values(store.workspace.requests.entities)) {
                if (entity.selectedProxy?.id === id) {
                    entity.selectedProxy = undefined
                }
            }
            removeEntity(id, store.workspace.proxies)
            activateProxy(null)
            activateRequestOrGroup(null)
            windowCtx.changeDirty(true)
            navigationContentCtx.changeProxyList(generateProxyNavList())
        },
        move: (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
            moveEntity<EditableWorkbookProxy>(id, destinationID, onLowerHalf, onLeft, store.workspace.proxies)
            windowCtx.changeDirty(true)
            navigationContentCtx.changeProxyList(generateProxyNavList())
            // if (selectedProxyId !== id) {
            //     activateProxy(id)
            // }
        },
        copy: (id: string) => {
            const source = getEntity(id, store.workspace.proxies)
            const proxy = structuredClone(source)
            proxy.id = GenerateIdentifier()
            proxy.name = `${GetTitle(source)} - Copy`
            proxy.dirty = true
            const idx = store.workspace.proxies.topLevelIds.findIndex(id => id === source.id)
            if (idx === -1) {
                store.workspace.proxies.topLevelIds.push(proxy.id)
            } else {
                store.workspace.proxies.topLevelIds.splice(idx + 1, 0, proxy.id)
            }
            store.workspace.proxies.entities[proxy.id] = proxy
            windowCtx.changeDirty(true)
            navigationContentCtx.changeProxyList(generateProxyNavList())
            activateProxy(proxy.id)
        },
        setName: (id: string, value: string) => {
            let entry = store.workspace.proxies.entities[id]
            entry.name = value
            navigationContentCtx.changeProxyList(generateProxyNavList())
        },
        setUrl: (id: string, url: string) => {
            let entry = store.workspace.proxies.entities[id]
            entry.url = url
        },
        setPersistence: (id: string, value: Persistence) => {
            let entry = store.workspace.proxies.entities[id]
            entry.persistence = value
        },
        getProxy: (id: string) => {
            return store.workspace.proxies.entities[id]
        }
    }

    const workspaceContextActions = {
        clearAllActivations,
        activateRequestOrGroup,
        activateScenario,
        activateAuthorization,
        activateCertificate,
        activateProxy,
    }

    // const executionContextActions = {
    //     getExecution: (id: string) => {
    //         return requestExecutions.get(id)
    //     },
    //     setPanel: (panel: string) => {
    //         // dispatch(executionActions.setPanel(panel))
    //     },
    //     runStart: (id: string) => {
    //         const match = requestExecutions.get(id)
    //         if (match) {
    //             match.running = true
    //             // match.results = undefined
    //         } else {
    //             requestExecutions.set(id, {
    //                 requestID: id,
    //                 running: true,
    //             })
    //         }
    //         navigationStateCtx.changeExecution(id)
    //         // dispatch(executionActions.runStart(id))
    //     },
    //     runCancel: (id: string) => {
    //         const match = requestExecutions.get(id)
    //         if (match) {
    //             match.running = false
    //             match.results = undefined
    //         }
    //         // dispatch(executionActions.runCancel({
    //         //     id,
    //         // }))
    //     },
    //     runComplete: (id: string, results: ApicizeExecutionResults | undefined) => {
    //         const execution = requestExecutions.get(id)
    //         if (!execution) throw new Error(`Invalid ID ${id}`)

    //         execution.running = false
    //         execution.runList = []
    //         execution.resultLists = []
    //         if (results) {
    //             // Stop the executions
    //             const workbookResults = ApicizeRunResultsToWorkbookExecutionResults(results.runs, store.workspace.requests.entities)
    //             for (let runIndex = 0; runIndex < workbookResults.length; runIndex++) {
    //                 execution.runList.push({ index: runIndex, text: `Run ${runIndex + 1} of ${workbookResults.length}` })
    //                 const runResults = workbookResults[runIndex]
    //                 const resultList = []
    //                 for (let resultIndex = 0; resultIndex < runResults.length; resultIndex++) {
    //                     const request = store.workspace.requests.entities[runResults[resultIndex].requestId]
    //                     resultList.push({ index: resultIndex, text: `${request?.name ?? '(Unnamed)'}` })
    //                 }
    //                 execution.resultLists.push(resultList)
    //             }
    //             execution.results = workbookResults
    //             execution.runIndex = workbookResults.length > 0 ? 0 : undefined
    //             execution.resultIndex = workbookResults.length > 0 && workbookResults[0].length > 0 ? -1 : undefined
    //             execution.milliseconds = results.milliseconds
    //             activateExecution(id, execution)
    //         }
    //     },
    //     selectExecutionResult: (
    //         id: string,
    //         runIndex: number | undefined,
    //         resultIndex: number | undefined
    //     ) => {
    //         const execution = requestExecutions.get(id)
    //         if (!execution) throw new Error(`Invalid ID ${id}`)
    //         execution.runIndex = runIndex
    //         execution.resultIndex = resultIndex
    //         activateExecution(id, execution)
    //     },
    //     getSummary: (
    //         id: string
    //     ): ExecutionSummaryInfo | ExecutionSummaryInfo[] | undefined => {
    //         const execution = requestExecutions.get(id)
    //         if (!execution) throw new Error(`Invalid ID ${id}`)
    //         const selectedResult = getSelectedExecutionResult(execution)
    //         if (selectedResult.result) {
    //             return {
    //                 status: selectedResult.result.response?.status,
    //                 statusText: selectedResult.result.response?.statusText,
    //                 tests: selectedResult.result.tests,
    //                 executedAt: selectedResult.result.executedAt,
    //                 milliseconds: selectedResult.result.milliseconds,
    //                 success: selectedResult.result.success,
    //                 errorMessage: selectedResult.result.errorMessage
    //             }
    //         } else if (selectedResult.summary) {
    //             return selectedResult.summary.requests.map(r => ({
    //                 name: r.name,
    //                 status: r.response?.status,
    //                 statusText: r.response?.statusText,
    //                 tests: r.tests,
    //                 executedAt: r.executedAt,
    //                 milliseconds: r.milliseconds,
    //                 success: r.success,
    //                 errorMessage: r.errorMessage
    //             }))
    //         } else {
    //             return undefined
    //         }
    //     },
    //     getResponseHeaders: (
    //         id: string
    //     ) => {
    //         const execution = requestExecutions.get(id)
    //         if (!execution) throw new Error(`Invalid ID ${id}`)
    //         return getSelectedExecutionResult(execution).result?.response?.headers
    //     },
    //     getResponseBody: (
    //         id: string
    //     ) => {
    //         const execution = requestExecutions.get(id)
    //         if (!execution) throw new Error(`Invalid ID ${id}`)
    //         return getSelectedExecutionResult(execution).result?.response?.body
    //     },
    //     getRequest: (
    //         id: string
    //     ) => {
    //         const execution = requestExecutions.get(id)
    //         if (!execution) throw new Error(`Invalid ID ${id}`)
    //         return getSelectedExecutionResult(execution).result?.request
    //     },
    // }

    return {
        request: requestContextActions,
        group: groupContextActions,
        scenario: scenarioContextActions,
        authorization: authorizationContextActions,
        certificate: certificateContextActions,
        proxy: proxyContextActions,
        workbook: workspaceContextActions,
        // execution: executionContextActions,

        getWorkbookFileName: () => {
            return activeFileName
        },
        newWorkbook: (globalSettings: StoredGlobalSettings) => {
            store.workspace = newEditableWorkspace()
            executionCtx.clear()

            navigationStateCtx.clearActive()
            navigationStateCtx.clearExecution()
            // dispatch(executionActions.resetExecution())

            navigationContentCtx.changeLists([], [], [], [], [])
            windowCtx.changeWorkbook('', '')
        },
        openWorkbook: (fullName: string, displayName: string, workspaceToOpen: Workspace) => {
            store.workspace = storedWorkspaceToEditableWorkspace(workspaceToOpen)
            executionCtx.clear()

            navigationStateCtx.clearActive()
            navigationStateCtx.clearExecution()
            // dispatch(executionActions.resetExecution())


            navigationContentCtx.changeLists(
                generateRequestNavList(),
                generateScenarioNavList(),
                generateAuthorizationNavList(),
                generateCertificateNavList(),
                generateProxyNavList(),
            )
            // dispatch(executionActions.resetExecution())
            windowCtx.changeWorkbook(fullName, displayName)
        },
        getWorkspaceFromStore: () =>
            editableWorkspaceToStoredWorkspace(
                store.workspace.requests,
                store.workspace.scenarios,
                store.workspace.authorizations,
                store.workspace.certificates,
                store.workspace.proxies,
                store.workspace.selectedScenario,
                store.workspace.selectedAuthorization,
                store.workspace.selectedCertificate,
                store.workspace.selectedProxy,
            ),
        getSettingsFromStore: (workbookDirectory: string, lastWorkbookFileName: string | undefined) =>
            stateToGlobalSettingsStorage(
                workbookDirectory,
                lastWorkbookFileName),
        onSaveWorkbook: (fullName: string, displayName: string) => {
            windowCtx.changeWorkbook(fullName, displayName)
        },
        getRequestParameterLists: (requestOrGroupId: string) => {
            let activeScenarioId = DEFAULT_SELECTION_ID
            let activeAuthorizationId = DEFAULT_SELECTION_ID
            let activeCertificateId = DEFAULT_SELECTION_ID
            let activeProxyId = DEFAULT_SELECTION_ID

            // Determine the active credentials by working our way up the hierarchy
            if (requestOrGroupId.length > 0) {
                let e = findParentEntity(requestOrGroupId, store.workspace.requests)
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

                    e = findParentEntity(e.id, store.workspace.requests)
                }
            }

            const defaultScenario = activeScenarioId == DEFAULT_SELECTION_ID
                ? 'None Configured'
                : activeScenarioId === NO_SELECTION_ID
                    ? 'Off'
                    : GetTitle(store.workspace.scenarios.entities[activeScenarioId])

            const defaultAuthorization = activeAuthorizationId == DEFAULT_SELECTION_ID
                ? 'None Configured'
                : activeAuthorizationId === NO_SELECTION_ID
                    ? 'Off'
                    : GetTitle(store.workspace.authorizations.entities[activeAuthorizationId])

            const defaultCertificate = activeCertificateId == DEFAULT_SELECTION_ID
                ? 'None Configured'
                : activeCertificateId === NO_SELECTION_ID
                    ? 'Off'
                    : GetTitle(store.workspace.certificates.entities[activeCertificateId])

            const defaultProxy = activeProxyId == DEFAULT_SELECTION_ID
                ? 'None Configured'
                : activeProxyId === NO_SELECTION_ID
                    ? 'Off'
                    : GetTitle(store.workspace.proxies.entities[activeProxyId])


            return {
                scenarios: buildEntityList(store.workspace.scenarios, defaultScenario),
                authorizations: buildEntityList(store.workspace.authorizations, defaultAuthorization),
                certificates: buildEntityList(store.workspace.certificates, defaultCertificate),
                proxies: buildEntityList(store.workspace.proxies, defaultProxy),
            }
        }

    }
}

const WorkspaceContext = createContext({} as ReturnType<typeof WorkspaceActions>)

export function useWorkspace() {
    const context = useContext(WorkspaceContext)
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
}

/**
 * Note - workspace provider does not have any stateful information, it's just calls to
 * retrieve and update global data and to update other contexts
 * @param param0 
 * @returns 
 */
export function WorkspaceProvider({ store, children }: { store: GlobalStorageType, children?: ReactNode }) {
    return (
        <WorkspaceContext.Provider value={WorkspaceActions(store)}>
            {children}
        </WorkspaceContext.Provider>
    )
}
