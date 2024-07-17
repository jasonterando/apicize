
import { ReactNode, createContext } from "react"
import { EditableWorkbookApiKeyAuthorization, EditableWorkbookAuthorization, EditableWorkbookBasicAuthorization, EditableWorkbookOAuth2ClientAuthorization } from "../models/workbook/editable-workbook-authorization"
import { castEntryAsGroup, castEntryAsRequest, EditableWorkbookRequestEntry } from "../models/workbook/editable-workbook-request-entry"
import { EditableWorkbookScenario } from "../models/workbook/editable-workbook-scenario"
import { WorkbookBodyData, GetTitle, WorkbookAuthorizationType, WorkbookBasicAuthorization, WorkbookOAuth2ClientAuthorization, WorkbookApiKeyAuthorization, ApicizeResult, StoredGlobalSettings, WorkbookMethod, WorkbookBodyType, Persistence, removeEntity, moveEntity, addNestedEntity, moveNestedEntity, getNestedEntity, getEntity, Workspace, addEntity, removeNestedEntity, findParentEntity, IndexedEntities, Identifiable, Selection, Named, IndexedNestedRequests, WorkbookRequestGroup, WorkbookGroupExecution } from "@apicize/lib-typescript"
import { newStateStorage, stateToGlobalSettingsStorage, stateToWorkspace, workspaceToState } from "../services/apicize-serializer"
import { WorkbookState, requestActions, navigationActions, authorizationActions, scenarioActions, groupActions, workbookActions, executionActions, ResultType, NavigationType, helpActions, proxyActions, NO_SELECTION, NO_SELECTION_ID, parametersActions, DEFAULT_SELECTION_ID } from "../models/store"
import { EditableWorkbookRequest } from "../models/workbook/editable-workbook-request"
import { GenerateIdentifier } from "../services/random-identifier-generator"
import { EditableNameValuePair } from "../models/workbook/editable-name-value-pair"
import { useDispatch, useSelector } from "react-redux"
import { EditableWorkbookRequestGroup } from "../models/workbook/editable-workbook-request-group"
import { ApicizeRunResultsToWorkbookExecutionResults, WorkbookExecution, WorkbookExecutionResult, WorkbookExecutionSummary } from "../models/workbook/workbook-execution"
import { NavigationListItem } from "../models/navigation-list-item"
import { ExecutionSummaryInfo } from "../models/workbook/execution-summary-info"
import { MAX_TEXT_RENDER_LENGTH } from "../controls/viewers/text-viewer"
import { EditableWorkbookProxy } from "../models/workbook/editable-workbook-proxy"
import { EditableWorkbookCertificate } from "../models/workbook/editable-workbook-certificate"
import { EntitySelection } from "../models/workbook/entity-selection"
import { request } from "http"
import { WorkbookRequestEntry } from "@apicize/lib-typescript/dist/models/workbook/workbook-request-entry"

let stateStorage = newStateStorage()

let requestExecutions = new Map<string, WorkbookExecution>()

const storageActions = () => {

    const dispatch = useDispatch()

    let activeType = useSelector((state: WorkbookState) => state.navigation.activeType)
    let activeID = useSelector((state: WorkbookState) => state.navigation.activeID)

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
            const requestItem = stateStorage.requests.entities[id]
            const result: NavigationListItem = { id, name: GetTitle(requestItem), type: 'request' }
            const children = stateStorage.requests.childIds ? stateStorage.requests.childIds[id] : undefined
            if (children) {
                result.children = children.map(id => mapItem(id))
            } else {
                result.children = undefined
            }
            return result
        }
        return stateStorage.requests.topLevelIds.map(id => mapItem(id))
    }

    // Generate authorization navigation list
    const generateAuthorizationNavList = () =>
        stateStorage.authorizations.topLevelIds.map(id => (
            { id, name: GetTitle(stateStorage.authorizations.entities[id]), type: 'auth' }
        ))

    // Generate scenario navigation list
    const generateScenarioNavList = () =>
        stateStorage.scenarios.topLevelIds.map(id => (
            { id, name: GetTitle(stateStorage.scenarios.entities[id]), type: 'scenario' }
        ))

    // Generate proxy navigation list
    const generateProxyNavList = () =>
        stateStorage.proxies.topLevelIds.map(id => (
            { id, name: GetTitle(stateStorage.proxies.entities[id]), type: 'proxy' }
        ))

    // Clear all selected records
    const clearAllActivations = () => {
        dispatch(navigationActions.closeEditor());
    }

    const helpContextActions = {
        setNextHelpTopic: (topic: string) => {
            dispatch(helpActions.setNextHelpTopic(topic))
        }
    };

    /**
     * Generate a list of entities, including default and none selections, returns list and selected ID
     * @param entityList 
     * @param activeId 
     * @returns tuple of list and selected ID
     */
    const buildEntityList = <T extends Identifiable & Named>(
        entityList: IndexedEntities<T>,
        defaultName: string): EntitySelection[] => {
        const list: EntitySelection[] = [
            { id: DEFAULT_SELECTION_ID, name: `Default (${defaultName})` },
            { id: NO_SELECTION_ID, name: `Off` },
        ]
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
            requestEntry = stateStorage.requests.entities[id]
            if (!requestEntry) throw new Error(`Invalid ID ${id}`)
        } else {
            requestEntry = null
        }

        let activeScenarioId = DEFAULT_SELECTION_ID
        let activeAuthorizationId = DEFAULT_SELECTION_ID
        let activeCertificateId = DEFAULT_SELECTION_ID
        let activeProxyId = DEFAULT_SELECTION_ID

        // Determine the active credentials by working our way up the hierarchy
        if (requestEntry) {
            let e = findParentEntity(requestEntry.id, stateStorage.requests)
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

                e = findParentEntity(e.id, stateStorage.requests)
            }
        }

        const defaultScenario = activeScenarioId == DEFAULT_SELECTION_ID
            ? 'None Configured'
            : activeScenarioId === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(stateStorage.scenarios.entities[activeScenarioId])

        const defaultAuthorization = activeAuthorizationId == DEFAULT_SELECTION_ID
            ? 'None Configured'
            : activeAuthorizationId === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(stateStorage.authorizations.entities[activeAuthorizationId])

        const defaultCertificate = activeCertificateId == DEFAULT_SELECTION_ID
            ? 'None Configured'
            : activeCertificateId === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(stateStorage.certificates.entities[activeCertificateId])

        const defaultProxy = activeProxyId == DEFAULT_SELECTION_ID
            ? 'None Configured'
            : activeProxyId === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(stateStorage.proxies.entities[activeProxyId])

        const scenarios = buildEntityList(stateStorage.scenarios, defaultScenario)
        const authorizations = buildEntityList(stateStorage.authorizations, defaultAuthorization)
        const certificates = buildEntityList(stateStorage.certificates, defaultCertificate)
        const proxies = buildEntityList(stateStorage.proxies, defaultProxy)

        const scenarioId = requestEntry?.selectedScenario?.id ?? DEFAULT_SELECTION_ID
        const authorizationId = requestEntry?.selectedAuthorization?.id ?? DEFAULT_SELECTION_ID
        const certificateId = requestEntry?.selectedCertificate?.id ?? DEFAULT_SELECTION_ID
        const proxyId = requestEntry?.selectedProxy?.id ?? DEFAULT_SELECTION_ID

        dispatch(parametersActions.set({
            scenarios,
            scenarioId,
            authorizations,
            authorizationId,
            certificates,
            certificateId,
            proxies,
            proxyId
        }))

        const selectionAsId = (selection: Selection | undefined) => {
            return selection === undefined
                ? DEFAULT_SELECTION_ID
                : selection.id === ''
                    ? NO_SELECTION_ID
                    : selection.id
        }

        const request = castEntryAsRequest(requestEntry)
        if (request) {
            dispatch(helpActions.hideHelp())
            dispatch(helpActions.setNextHelpTopic('requests'))

            console.log('Request selected scenario', request.selectedScenario)

            dispatch(requestActions.initialize({
                id: request.id,
                name: request.name ?? '',
                url: request.url,
                method: request.method ?? WorkbookMethod.Get,
                timeout: request.timeout ?? 30000,
                queryStringParams: request.queryStringParams,
                headers: request.headers,
                test: request.test,
                bodyType: request.body?.type,
                bodyData: request.body?.data,
                runs: request.runs,
                selectedScenarioId: selectionAsId(request.selectedScenario),
                selectedAuthorizationId: selectionAsId(request.selectedAuthorization),
                selectedCertificateId: selectionAsId(request.selectedCertificate),
                selectedProxyId: selectionAsId(request.selectedProxy),
            }))
            dispatch(navigationActions.openEditor({
                type: NavigationType.Request,
                id: request.id
            }))
        } else {
            dispatch(helpActions.hideHelp())
            dispatch(helpActions.setNextHelpTopic('requests'))

            const group = castEntryAsGroup(requestEntry)
            if (group) {
                dispatch(groupActions.initialize({
                    id: group.id,
                    name: group.name ?? '',
                    runs: group.runs,
                    execution: WorkbookGroupExecution.Sequential,
                }))
                dispatch(navigationActions.openEditor({
                    type: NavigationType.Group,
                    id: group.id
                }))
            } else {
                dispatch(navigationActions.closeEditor())
            }
        }

        const execution = id ? requestExecutions.get(id) : null
        if (execution) {
            activateExecution(id, execution)
        } else {
            activateExecution(null, null)
        }
    }

    // Copy authorization state for editing
    const activateAuthorization = (id: string | null) => {
        let authorization
        if (id) {
            authorization = stateStorage.authorizations.entities[id]
            if (!authorization) throw new Error(`Invalid ID ${id}`)
        } else {
            authorization = null
        }

        if (authorization) {
            dispatch(helpActions.hideHelp())
            dispatch(helpActions.setNextHelpTopic('authorizations'))
            dispatch(authorizationActions.initialize({
                id: authorization.id,
                name: authorization.name ?? '',
                type: authorization.type,
                persistence: authorization.persistence,
                username: (authorization as EditableWorkbookBasicAuthorization)?.username,
                password: (authorization as EditableWorkbookBasicAuthorization)?.password,
                accessTokenUrl: (authorization as EditableWorkbookOAuth2ClientAuthorization)?.accessTokenUrl,
                clientId: (authorization as EditableWorkbookOAuth2ClientAuthorization).clientId,
                clientSecret: (authorization as EditableWorkbookOAuth2ClientAuthorization).clientSecret,
                scope: (authorization as EditableWorkbookOAuth2ClientAuthorization).scope,
                header: (authorization as EditableWorkbookApiKeyAuthorization).header,
                value: (authorization as EditableWorkbookApiKeyAuthorization).value
            }))
            dispatch(navigationActions.openEditor({
                type: NavigationType.Authorization,
                id: authorization.id
            }))
        } else {
            dispatch(navigationActions.closeEditor())
        }
    }

    // Copy scenario state for editing
    const activateScenario = (id: string | null) => {
        let scenario
        if (id) {
            scenario = stateStorage.scenarios.entities[id]
            if (!scenario) throw new Error(`Invalid ID ${id}`)
        } else {
            scenario = null
        }

        if (scenario) {
            dispatch(helpActions.hideHelp())
            dispatch(helpActions.setNextHelpTopic('scenarios'))
            dispatch(scenarioActions.initialize({
                id: scenario.id,
                name: scenario.name ?? '',
                persistence: scenario.persistence,
                variables: scenario.variables
            }))
            dispatch(navigationActions.openEditor({
                type: NavigationType.Scenario,
                id: scenario.id
            }))

        } else {
            dispatch(navigationActions.closeEditor())
        }
    }

    // Copy proxy state for editing
    const activateProxy = (id: string | null) => {
        let proxy
        if (id) {
            proxy = stateStorage.proxies.entities[id]
            if (!proxy) throw new Error(`Invalid ID ${id}`)
        } else {
            proxy = null
        }

        if (proxy) {
            dispatch(helpActions.hideHelp())
            dispatch(helpActions.setNextHelpTopic('proxies'))
            dispatch(proxyActions.initialize({
                id: proxy.id,
                name: proxy.name ?? '',
                persistence: proxy.persistence,
                url: proxy.url ?? ''
            }))
            dispatch(navigationActions.openEditor({
                type: NavigationType.Proxy,
                id: proxy.id
            }))

        } else {
            dispatch(navigationActions.closeEditor())
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

            dispatch(executionActions.setExecution({
                id,
                resultType,
                longTextInResponse,
                failedTestCount: result ? result.failedTestCount : 0,
                runIndex: execution.runIndex,
                runList: execution.runList,
                resultIndex: execution.resultIndex,
                resultLists: execution.resultLists,
            }))
            dispatch(navigationActions.openExecution(id))
        } else {
            dispatch(navigationActions.closeExecution())
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
                            name: stateStorage.requests.entities[r.requestId]?.name ?? '(Unnamed)',
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
            addNestedEntity(entry, stateStorage.requests, targetID)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setRequestList(generateRequestNavList()))
            activateRequestOrGroup(id)
        },
        delete: (id: string) => {
            removeNestedEntity(id, stateStorage.requests)
            if (activeID === id) {
                activateRequestOrGroup(null)
            }
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setRequestList(generateRequestNavList()))
        },
        move: (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
            moveNestedEntity(id, destinationID, onLowerHalf, onLeft, stateStorage.requests)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setRequestList(generateRequestNavList()))
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
                    stateStorage.requests.entities[request.id] = request
                    return request
                }

                const group = castEntryAsGroup(dupe)
                if (group) {
                    if (stateStorage.requests.childIds && stateStorage.requests.childIds) {
                        const sourceChildIDs = stateStorage.requests.childIds[source.id]
                        if (sourceChildIDs.length > 0) {
                            const dupedChildIDs: string[] = []
                            stateStorage.requests.childIds[group.id] = dupedChildIDs

                            sourceChildIDs.forEach(childID => {
                                const childEntry = stateStorage.requests.entities[childID]
                                const dupedChildID = copyEntry(childEntry).id
                                dupedChildIDs.push(dupedChildID)
                            })
                        }
                    }
                    stateStorage.requests.entities[group.id] = group
                    return group
                }

                throw new Error('Invalid entry')
            }

            const source = getNestedEntity(id, stateStorage.requests)
            const entry = copyEntry(source)

            let append = true
            if (stateStorage.requests.childIds) {
                for (const childIDs of Object.values(stateStorage.requests.childIds)) {
                    let idxChild = childIDs.indexOf(id)
                    if (idxChild !== -1) {
                        childIDs.splice(idxChild + 1, 0, entry.id)
                        append = false
                        break
                    }
                }
            }

            if (append) {
                const idx = stateStorage.requests.topLevelIds.indexOf(id)
                if (idx !== -1) {
                    stateStorage.requests.topLevelIds.splice(idx + 1, 0, entry.id)
                    append = false
                }
            }

            if (append) {
                stateStorage.requests.topLevelIds.push(entry.id)
            }

            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setRequestList(generateRequestNavList()))
            activateRequestOrGroup(entry.id)
        },
        setName: (id: string, value: string) => {
            let entry = stateStorage.requests.entities[id] as EditableWorkbookRequestEntry
            entry.name = value
            dispatch(requestActions.setName(value))
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setRequestList(generateRequestNavList()))
        },
        setURL: (id: string, value: string) => {
            let entry = stateStorage.requests.entities[id] as EditableWorkbookRequest
            entry.url = value
            dispatch(workbookActions.setDirty(true))
            dispatch(requestActions.setURL(value))
        },
        setMethod: (id: string, value: WorkbookMethod) => {
            let entry = stateStorage.requests.entities[id] as EditableWorkbookRequest
            entry.method = value
            dispatch(workbookActions.setDirty(true))
            dispatch(requestActions.setMethod(value))
        },
        setTimeout: (id: string, value: number) => {
            let entry = stateStorage.requests.entities[id] as EditableWorkbookRequest
            entry.timeout = value
            dispatch(workbookActions.setDirty(true))
            dispatch(requestActions.setRequestTimeout(value))
        },
        setQueryStringParams: (id: string, value: EditableNameValuePair[] | undefined) => {
            let entry = stateStorage.requests.entities[id] as EditableWorkbookRequest
            entry.queryStringParams = value
            dispatch(workbookActions.setDirty(true))
            dispatch(requestActions.setQueryStringParams(value))
        },
        setHeaders: (id: string, value: EditableNameValuePair[] | undefined) => {
            let entry = stateStorage.requests.entities[id] as EditableWorkbookRequest
            entry.headers = value
            dispatch(workbookActions.setDirty(true))
            dispatch(requestActions.setHeaders(value))
        },
        setBodyType: (id: string, value: WorkbookBodyType | undefined) => {
            let entry = stateStorage.requests.entities[id] as EditableWorkbookRequest
            let oldBodyType = entry.body?.type ?? WorkbookBodyType.None
            let newBodyData = entry.body?.data
            let newBodyType = value ?? WorkbookBodyType.None

            if (newBodyType !== oldBodyType) {
                switch (newBodyType) {
                    case WorkbookBodyType.Raw:
                        newBodyData = Array.from((new TextEncoder()).encode(newBodyData?.toString() ?? ''))
                        break
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
            dispatch(workbookActions.setDirty(true))
            dispatch(requestActions.setBody({ type: newBodyType, data: newBodyData }))
        },
        setBodyData: (id: string, value: WorkbookBodyData | undefined) => {
            let entry = stateStorage.requests.entities[id] as EditableWorkbookRequest
            if (entry.body) {
                entry.body.data = value
            } else {
                entry.body = { data: value }
            }
            dispatch(workbookActions.setDirty(true))
            dispatch(requestActions.setBody({ type: entry.body?.type || WorkbookBodyType.None, data: value }))
        },
        setRuns: (id: string, value: number) => {
            let entry = stateStorage.requests.entities[id] as EditableWorkbookRequest
            entry.runs = value
            dispatch(workbookActions.setDirty(true))
            dispatch(requestActions.setRuns(value))
        },
        setTest: (id: string, value: string | undefined) => {
            let entry = stateStorage.requests.entities[id] as EditableWorkbookRequest
            entry.test = value
            // generateRequestNavList()
            dispatch(workbookActions.setDirty(true))
            dispatch(requestActions.setTest(value))
        },
        setSelectedScenarioId: (requestId: string, entityId: string) => {
            let entry = stateStorage.requests.entities[requestId] as EditableWorkbookRequest
            entry.selectedScenario = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(stateStorage.scenarios.entities[entityId]) }
            dispatch(workbookActions.setDirty(true))
            dispatch(parametersActions.setSelectedScenarioId(entityId))
        },
        setSelectedAuthorizationId: (requestId: string, entityId: string) => {
            let entry = stateStorage.requests.entities[requestId] as EditableWorkbookRequest
            entry.selectedAuthorization = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(stateStorage.authorizations.entities[entityId]) }
            dispatch(workbookActions.setDirty(true))
            dispatch(parametersActions.setSelectedAuthorizationId(entityId))
        },
        setSelectedCertificateId: (requestId: string, entityId: string) => {
            let entry = stateStorage.requests.entities[requestId] as EditableWorkbookRequest
            entry.selectedCertificate = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(stateStorage.certificates.entities[entityId]) }
            dispatch(workbookActions.setDirty(true))
            dispatch(parametersActions.setSelectedCertificateId(entityId))
        },
        setSelectedProxyId: (requestId: string, entityId: string) => {
            let entry = stateStorage.requests.entities[requestId] as EditableWorkbookRequest
            entry.selectedProxy = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(stateStorage.proxies.entities[entityId]) }
            dispatch(workbookActions.setDirty(true))
            dispatch(parametersActions.setSelectedProxyId(entityId))
        },
        getRunInformation: () => {
            const result = (activeType === NavigationType.Request && activeID)
                ? {
                    requestId: activeID,
                    workspace: stateToWorkspace(
                        stateStorage.requests,
                        stateStorage.scenarios,
                        stateStorage.authorizations,
                        stateStorage.certificates,
                        stateStorage.proxies,
                        stateStorage.selectedScenario,
                        stateStorage.selectedAuthorization,
                        stateStorage.selectedCertificate,
                        stateStorage.selectedProxy,
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
            addNestedEntity(entry, stateStorage.requests, targetID)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setRequestList(generateRequestNavList()))
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
            let entry = stateStorage.requests.entities[id]
            entry.name = value
            dispatch(workbookActions.setDirty(true))
            dispatch(groupActions.setName(value))
            dispatch(navigationActions.setRequestList(generateRequestNavList()))
        },
        setExecution: (id: string, value: WorkbookGroupExecution) => {
            let entry = stateStorage.requests.entities[id] as WorkbookRequestGroup
            entry.execution = value
            dispatch(workbookActions.setDirty(true))
            dispatch(groupActions.setExecution(value))
            dispatch(navigationActions.setRequestList(generateRequestNavList()))
        },
        setRuns: (id: string, value: number) => {
            let entry = stateStorage.requests.entities[id] as EditableWorkbookRequestGroup
            entry.runs = value
            dispatch(workbookActions.setDirty(true))
            dispatch(groupActions.setRuns(value))
        },
        getRunInformation: () => {
            const result = (activeType === NavigationType.Group && activeID)
                ? {
                    requestId: activeID,
                    workspace: stateToWorkspace(
                        stateStorage.requests,
                        stateStorage.scenarios,
                        stateStorage.authorizations,
                        stateStorage.certificates,
                        stateStorage.proxies,
                        stateStorage.selectedScenario,
                        stateStorage.selectedAuthorization,
                        stateStorage.selectedCertificate,
                        stateStorage.selectedProxy,
                    )
                }
                : undefined
            return result
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
                    // sendCredentialsInBody: false,
                    header: 'x-api-key',
                    value: ''
                },
            } as EditableWorkbookAuthorization

            stateStorage.authorizations.entities[authorization.id] = authorization

            addEntity(authorization, stateStorage.authorizations, targetID)
            activateAuthorization(id)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setAuthorizationList(generateAuthorizationNavList()))
        },
        delete: (id: string) => {
            removeEntity(id, stateStorage.authorizations)
            activateAuthorization(null)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setAuthorizationList(generateAuthorizationNavList()))
        },
        move: (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
            moveEntity<EditableWorkbookAuthorization>(id, destinationID, onLowerHalf, onLeft, stateStorage.authorizations)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setAuthorizationList(generateAuthorizationNavList()))
            // if (selectedAuthorizationId !== id) {
            //     activateAuthorization(id)
            // }
        },
        copy: (id: string) => {
            const source = getNestedEntity(id, stateStorage.authorizations)
            const authorization = structuredClone(source)
            authorization.id = GenerateIdentifier()
            authorization.name = `${GetTitle(source)} - Copy`
            authorization.dirty = true
            const idx = stateStorage.authorizations.topLevelIds.indexOf(source.id)
            if (idx === -1) {
                stateStorage.authorizations.topLevelIds.push(authorization.id)
            } else {
                stateStorage.authorizations.topLevelIds.splice(idx + 1, 0, authorization.id)
            }
            stateStorage.authorizations.entities[authorization.id] = authorization
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setAuthorizationList(generateAuthorizationNavList()))
            activateAuthorization(authorization.id)
        },
        setName: (id: string, value: string) => {
            let entry = stateStorage.authorizations.entities[id]
            entry.name = value
            dispatch(authorizationActions.setName(value))
            dispatch(navigationActions.setAuthorizationList(generateAuthorizationNavList()))
        },
        setType: (id: string, value: WorkbookAuthorizationType) => {
            let entry = stateStorage.authorizations.entities[id]
            entry.type = value
            dispatch(authorizationActions.setType(value))
        },
        setUsername: (id: string, value: string) => {
            let entry = stateStorage.authorizations.entities[id] as WorkbookBasicAuthorization
            entry.username = value
            dispatch(authorizationActions.setUsername(value))
        },
        setPassword: (id: string, value: string) => {
            let entry = stateStorage.authorizations.entities[id] as WorkbookBasicAuthorization
            entry.password = value
            dispatch(authorizationActions.setPassword(value))
        },
        setAccessTokenUrl: (id: string, value: string) => {
            let entry = stateStorage.authorizations.entities[id] as WorkbookOAuth2ClientAuthorization
            entry.accessTokenUrl = value
            dispatch(authorizationActions.setAccessTokenUrl(value))
        },
        setClientId: (id: string, value: string) => {
            let entry = stateStorage.authorizations.entities[id] as WorkbookOAuth2ClientAuthorization
            entry.clientId = value
            dispatch(authorizationActions.setClientId(value))
        },
        setClientSecret: (id: string, value: string) => {
            let entry = stateStorage.authorizations.entities[id] as WorkbookOAuth2ClientAuthorization
            entry.clientId = value
            dispatch(authorizationActions.setClientSecret(value))
        },
        setScope: (id: string, value: string) => {
            let entry = stateStorage.authorizations.entities[id] as WorkbookOAuth2ClientAuthorization
            entry.scope = value
            dispatch(authorizationActions.setScope(value))
        },
        setHeader: (id: string, value: string) => {
            let entry = stateStorage.authorizations.entities[id] as WorkbookApiKeyAuthorization
            entry.header = value
            dispatch(authorizationActions.setHeader(value))
        },
        setValue: (id: string, value: string) => {
            let entry = stateStorage.authorizations.entities[id] as WorkbookApiKeyAuthorization
            entry.value = value
            dispatch(authorizationActions.setValue(value))
        },
        setPersistence: (id: string, value: Persistence) => {
            let entry = stateStorage.authorizations.entities[id]
            entry.persistence = value
            dispatch(authorizationActions.setPersistence(value))
        },
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

            stateStorage.scenarios.entities[scenario.id] = scenario
            addEntity(scenario, stateStorage.scenarios, targetID)
            activateScenario(id)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setScenariosList(generateScenarioNavList()))
        },
        delete: (id: string) => {
            removeEntity(id, stateStorage.scenarios)
            activateScenario(null)
            activateRequestOrGroup(null)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setScenariosList(generateScenarioNavList()))
        },
        move: (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
            moveEntity<EditableWorkbookScenario>(id, destinationID, onLowerHalf, onLeft, stateStorage.scenarios)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setScenariosList(generateScenarioNavList()))
            // if (selectedScenario !== NO_SELECTION) {
            //     activateScenario(id)
            // }
        },
        copy: (id: string) => {
            const source = getEntity(id, stateStorage.scenarios)
            const scenario = structuredClone(source)
            scenario.id = GenerateIdentifier()
            scenario.name = `${GetTitle(source)} - Copy`
            scenario.dirty = true
            const idx = stateStorage.scenarios.topLevelIds.findIndex(id => id === source.id)
            if (idx === -1) {
                stateStorage.scenarios.topLevelIds.push(scenario.id)
            } else {
                stateStorage.scenarios.topLevelIds.splice(idx + 1, 0, scenario.id)
            }
            stateStorage.scenarios.entities[scenario.id] = scenario
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setScenariosList(generateScenarioNavList()))
            activateAuthorization(scenario.id)
        },
        setName: (id: string, value: string) => {
            let entry = stateStorage.scenarios.entities[id]
            entry.name = value
            dispatch(scenarioActions.setName(value))
            dispatch(navigationActions.setScenariosList(generateScenarioNavList()))
        },
        setPersistence: (id: string, value: Persistence) => {
            let entry = stateStorage.scenarios.entities[id]
            entry.persistence = value
            dispatch(scenarioActions.setPersistence(value))
        },
        setVariables: (id: string, value: EditableNameValuePair[] | undefined) => {
            let entry = stateStorage.scenarios.entities[id]
            entry.variables = value
            dispatch(scenarioActions.setVariables(value))
            dispatch(navigationActions.setScenariosList(generateScenarioNavList()))
        }
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

            stateStorage.proxies.entities[proxy.id] = proxy
            addEntity(proxy, stateStorage.proxies, targetID)
            activateProxy(id)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setProxiesList(generateProxyNavList()))
        },
        delete: (id: string) => {
            removeEntity(id, stateStorage.proxies)
            activateProxy(null)
            activateRequestOrGroup(null)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setProxiesList(generateProxyNavList()))
        },
        move: (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
            moveEntity<EditableWorkbookProxy>(id, destinationID, onLowerHalf, onLeft, stateStorage.proxies)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setProxiesList(generateProxyNavList()))
            // if (selectedProxyId !== id) {
            //     activateProxy(id)
            // }
        },
        copy: (id: string) => {
            const source = getEntity(id, stateStorage.proxies)
            const proxy = structuredClone(source)
            proxy.id = GenerateIdentifier()
            proxy.name = `${GetTitle(source)} - Copy`
            proxy.dirty = true
            const idx = stateStorage.proxies.topLevelIds.findIndex(id => id === source.id)
            if (idx === -1) {
                stateStorage.proxies.topLevelIds.push(proxy.id)
            } else {
                stateStorage.proxies.topLevelIds.splice(idx + 1, 0, proxy.id)
            }
            stateStorage.proxies.entities[proxy.id] = proxy
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setProxiesList(generateProxyNavList()))
            activateProxy(proxy.id)
        },
        setName: (id: string, value: string) => {
            let entry = stateStorage.proxies.entities[id]
            entry.name = value
            dispatch(proxyActions.setName(value))
            dispatch(navigationActions.setProxiesList(generateProxyNavList()))
        },
        setUrl: (id: string, url: string) => {
            let entry = stateStorage.proxies.entities[id]
            entry.url = url
            dispatch(proxyActions.setUrl(url))
            dispatch(navigationActions.setProxiesList(generateProxyNavList()))
        },
        setPersistence: (id: string, value: Persistence) => {
            let entry = stateStorage.proxies.entities[id]
            entry.persistence = value
            dispatch(proxyActions.setPersistence(value))
        },
    }

    const workspaceContextActions = {
        clearAllActivations,
        activateRequestOrGroup,
        activateAuthorization,
        activateScenario,
        activateProxy
    }

    const executionContextActions = {
        setPanel: (panel: string) => {
            dispatch(executionActions.setPanel(panel))
        },
        runStart: (id: string) => {
            const match = requestExecutions.get(id)
            if (match) {
                match.running = true
                // match.results = undefined
            } else {
                requestExecutions.set(id, {
                    requestID: id,
                    running: true,
                })
            }
            dispatch(navigationActions.openExecution(id))
            dispatch(executionActions.runStart(id))
        },
        runCancel: (id: string) => {
            const match = requestExecutions.get(id)
            if (match) {
                match.running = false
                match.results = undefined
            }
            dispatch(executionActions.runCancel({
                id,
            }))
        },
        runComplete: (id: string, results: ApicizeResult[][] | undefined) => {
            const execution = requestExecutions.get(id)
            if (!execution) throw new Error(`Invalid ID ${id}`)

            execution.running = false
            execution.runList = []
            execution.resultLists = []
            if (results) {
                // Stop the executions
                const workbookResults = ApicizeRunResultsToWorkbookExecutionResults(results, stateStorage.requests.entities)
                for (let runIndex = 0; runIndex < workbookResults.length; runIndex++) {
                    execution.runList.push({ index: runIndex, text: `Run ${runIndex + 1} of ${workbookResults.length}` })
                    const runResults = workbookResults[runIndex]
                    const resultList = []
                    for (let resultIndex = 0; resultIndex < runResults.length; resultIndex++) {
                        const request = stateStorage.requests.entities[runResults[resultIndex].requestId]
                        resultList.push({ index: resultIndex, text: `${request?.name ?? '(Unnamed)'}` })
                    }
                    execution.resultLists.push(resultList)
                }
                execution.results = workbookResults
                execution.runIndex = workbookResults.length > 0 ? 0 : undefined
                execution.resultIndex = workbookResults.length > 0 && workbookResults[0].length > 0 ? -1 : undefined
                activateExecution(id, execution)
            }
        },
        selectExecutionResult: (
            id: string,
            runIndex: number | undefined,
            resultIndex: number | undefined
        ) => {
            const execution = requestExecutions.get(id)
            if (!execution) throw new Error(`Invalid ID ${id}`)
            execution.runIndex = runIndex
            execution.resultIndex = resultIndex
            activateExecution(id, execution)
        },
        getSummary: (
            id: string
        ): ExecutionSummaryInfo | ExecutionSummaryInfo[] | undefined => {
            const execution = requestExecutions.get(id)
            if (!execution) throw new Error(`Invalid ID ${id}`)
            const selectedResult = getSelectedExecutionResult(execution)
            if (selectedResult.result) {
                return {
                    status: selectedResult.result.response?.status,
                    statusText: selectedResult.result.response?.statusText,
                    tests: selectedResult.result.tests,
                    executedAt: selectedResult.result.executedAt,
                    milliseconds: selectedResult.result.milliseconds,
                    success: selectedResult.result.success,
                    errorMessage: selectedResult.result.errorMessage
                }
            } else if (selectedResult.summary) {
                return selectedResult.summary.requests.map(r => ({
                    name: r.name,
                    status: r.response?.status,
                    statusText: r.response?.statusText,
                    tests: r.tests,
                    executedAt: r.executedAt,
                    milliseconds: r.milliseconds,
                    success: r.success,
                    errorMessage: r.errorMessage
                }))
            } else {
                return undefined
            }
        },
        getResponseHeaders: (
            id: string
        ) => {
            const execution = requestExecutions.get(id)
            if (!execution) throw new Error(`Invalid ID ${id}`)
            return getSelectedExecutionResult(execution).result?.response?.headers
        },
        getResponseBody: (
            id: string
        ) => {
            const execution = requestExecutions.get(id)
            if (!execution) throw new Error(`Invalid ID ${id}`)
            return getSelectedExecutionResult(execution).result?.response?.body
        },
        getRequest: (
            id: string
        ) => {
            const execution = requestExecutions.get(id)
            if (!execution) throw new Error(`Invalid ID ${id}`)
            return getSelectedExecutionResult(execution).result?.request
        },
    }

    return {
        request: requestContextActions,
        group: groupContextActions,
        authorization: authorizationContextActions,
        scenario: scenarioContextActions,
        proxy: proxyContextActions,
        workbook: workspaceContextActions,
        execution: executionContextActions,
        help: helpContextActions,

        newWorkbook: (globalSettings: StoredGlobalSettings) => {
            stateStorage = newStateStorage()
            requestExecutions.clear()

            dispatch(navigationActions.closeEditor())
            dispatch(navigationActions.setLists({
                requests: [],
                authorizations: [],
                scenarios: [],
                proxies: generateProxyNavList(),
            }))
            dispatch(executionActions.resetExecution())
            dispatch(workbookActions.initializeWorkbook({
                fullName: '',
                displayName: ''
            }))
        },
        openWorkbook: (fullName: string, displayName: string, workspaceToOpen: Workspace, globalSettings: StoredGlobalSettings) => {
            stateStorage = workspaceToState(workspaceToOpen)
            requestExecutions.clear()

            dispatch(navigationActions.closeEditor())
            dispatch(navigationActions.setLists({
                requests: generateRequestNavList(),
                authorizations: generateAuthorizationNavList(),
                scenarios: generateScenarioNavList(),
                proxies: generateProxyNavList(),
            }))
            dispatch(executionActions.resetExecution())
            dispatch(workbookActions.initializeWorkbook({
                fullName,
                displayName,
            }))
        },
        getWorkspaceFromStore: () =>
            stateToWorkspace(
                stateStorage.requests,
                stateStorage.scenarios,
                stateStorage.authorizations,
                stateStorage.certificates,
                stateStorage.proxies,
                stateStorage.selectedScenario,
                stateStorage.selectedAuthorization,
                stateStorage.selectedCertificate,
                stateStorage.selectedProxy,
            ),
        getSettingsFromStore: (workbookDirectory: string, lastWorkbookFileName: string | undefined) =>
            stateToGlobalSettingsStorage(
                workbookDirectory,
                lastWorkbookFileName),
        onSaveWorkbook: (fullName: string, displayName: string) => {
            dispatch(workbookActions.saveWorkbook({
                fullName,
                displayName,
            }))
        },
    }
}

export const WorkspaceContext = createContext({} as ReturnType<typeof storageActions>)

export function WorkspaceProvider({ children }: { children?: ReactNode }) {
    return (
        <WorkspaceContext.Provider value={storageActions()}>
            {children}
        </WorkspaceContext.Provider>
    )
}
