import { ReactNode, createContext } from "react"
import { deleteFromStorage, findInStorage, moveInStorage } from "../models/state-storage"
import { EditableWorkbookApiKeyAuthorization, EditableWorkbookAuthorization, EditableWorkbookBasicAuthorization, EditableWorkbookOAuth2ClientAuthorization } from "../models/workbook/editable-workbook-authorization"
import { EditableWorkbookRequestEntry } from "../models/workbook/editable-workbook-request-entry"
import { EditableWorkbookScenario } from "../models/workbook/editable-workbook-scenario"
import { BodyType, WorkbookBodyData, Method, GetTitle, WorkbookAuthorizationType, NO_AUTHORIZATION, NO_SCENARIO, StoredWorkbook, WorkbookBasicAuthorization, WorkbookOAuth2ClientAuthorization, WorkbookApiKeyAuthorization, ApicizeResult } from "@apicize/lib-typescript"
import { stateStorageToRequestEntry, stateStorageToWorkbook, workbookToStateStorage } from "../services/workbook-serializer"
import { WorkbookState, requestActions, navigationActions, authorizationActions, scenarioActions, groupActions, workbookActions, executionActions, ResultType } from "../models/store"
import { EditableWorkbookRequest } from "../models/workbook/editable-workbook-request"
import { GenerateIdentifier } from "../services/random-identifier-generator"
import { WorkbookStateStorage } from "../models/workbook/workbook-state-storage"
import { EditableNameValuePair } from "../models/workbook/editable-name-value-pair"
import { addRequestEntryToStore, addTopLevelEntryToStore, castEntryAsGroup, castEntryAsRequest, deleteRequestEntryFromStore } from "../models/workbook/helpers/editable-workbook-request-helpers"
import { useDispatch, useSelector } from "react-redux"
import { EditableWorkbookRequestGroup } from "../models/workbook/editable-workbook-request-group"
import { ApicizeRunResultsToWorkbookExecutionResults, WorkbookExecution, WorkbookExecutionRequest, WorkbookExecutionResult, WorkbookExecutionSummary } from "../models/workbook/workbook-execution"
import { NavigationListItem } from "../models/navigation-list-item"
import { ExecutionSummaryInfo } from "../models/workbook/execution-summary-info"


let indexedWorkbook = {
    requests: { entities: {}, topLevelIDs: [] },
    authorizations: { entities: {}, topLevelIDs: [] },
    scenarios: { entities: {}, topLevelIDs: [] },
    selectedAuthorizationID: NO_AUTHORIZATION,
    selectedScenarioID: NO_SCENARIO
} as WorkbookStateStorage

let requestExecutions = new Map<string, WorkbookExecution>()

const storageActions = () => {

    const dispatch = useDispatch()

    let activeRequestId = useSelector((state: WorkbookState) => state.request.id)
    let activeGroupId = useSelector((state: WorkbookState) => state.group.id)
    let activeAuthorizationId = useSelector((state: WorkbookState) => state.execution.selectedAuthorizationID)
    let activeScenarioId = useSelector((state: WorkbookState) => state.execution.selectedScenarioID)
    let activeExecutionId = useSelector((state: WorkbookState) => state.execution.id)

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
            const requestItem = indexedWorkbook.requests.entities[id]
            const result: NavigationListItem = { id, name: GetTitle(requestItem), type: 'request' }
            const children = indexedWorkbook.requests.childIDs ? indexedWorkbook.requests.childIDs[id] : undefined
            if (children) {
                result.children = children.map(id => mapItem(id))
            } else {
                result.children = undefined
            }
            return result
        }
        return indexedWorkbook.requests.topLevelIDs.map(id => mapItem(id))
    }

    // Generate authorization navigation list
    const generateAuthorizationNavList = () =>
        indexedWorkbook.authorizations.topLevelIDs.map(id => (
            { id, name: GetTitle(indexedWorkbook.authorizations.entities[id]), type: 'auth' }
        ))

    // Generate scenario navigation list
    const generateScenarioNavList = () =>
        indexedWorkbook.scenarios.topLevelIDs.map(id => (
            { id, name: GetTitle(indexedWorkbook.scenarios.entities[id]), type: 'scenario' }
        ))

    // Clear all selected records
    const clearAllActivations = () => {
        dispatch(requestActions.close())
        dispatch(groupActions.close())
        dispatch(authorizationActions.close())
        dispatch(scenarioActions.close())
        dispatch(executionActions.close())
    }

    // Copy request or request group state for editing
    const activateRequestOrGroup = (id: string | null) => {
        let requestEntry
        if (id) {
            requestEntry = indexedWorkbook.requests.entities[id]
            if (!requestEntry) throw new Error(`Invalid ID ${id}`)
        } else {
            requestEntry = null
        }

        dispatch(authorizationActions.close())
        dispatch(scenarioActions.close())

        const request = castEntryAsRequest(requestEntry)
        if (request) {
            dispatch(groupActions.close())
            dispatch(requestActions.initialize({
                id: request.id,
                name: request.name ?? '',
                url: request.url,
                method: request.method ?? Method.Get,
                timeout: request.timeout ?? 30000,
                queryStringParams: request.queryStringParams,
                headers: request.headers,
                test: request.test,
                bodyType: request.body?.type,
                bodyData: request.body?.data

            }))
        } else {
            const group = castEntryAsGroup(requestEntry)
            if (group) {
                dispatch(requestActions.close())
                dispatch(groupActions.initialize({
                    id: group.id,
                    name: group.name ?? '',
                    runs: group.runs
                }))
            } else {
                dispatch(requestActions.close())
                dispatch(groupActions.close())
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
            authorization = indexedWorkbook.authorizations.entities[id]
            if (!authorization) throw new Error(`Invalid ID ${id}`)
        } else {
            authorization = null
        }

        dispatch(requestActions.close())
        dispatch(groupActions.close())
        dispatch(scenarioActions.close())

        if (authorization) {
            dispatch(authorizationActions.initialize({
                id: authorization.id,
                name: authorization.name ?? '',
                type: authorization.type,
                username: (authorization as EditableWorkbookBasicAuthorization)?.username,
                password: (authorization as EditableWorkbookBasicAuthorization)?.password,
                accessTokenUrl: (authorization as EditableWorkbookOAuth2ClientAuthorization)?.accessTokenUrl,
                clientId: (authorization as EditableWorkbookOAuth2ClientAuthorization).clientId,
                clientSecret: (authorization as EditableWorkbookOAuth2ClientAuthorization).clientSecret,
                scope: (authorization as EditableWorkbookOAuth2ClientAuthorization).scope,
                header: (authorization as EditableWorkbookApiKeyAuthorization).header,
                value: (authorization as EditableWorkbookApiKeyAuthorization).value
            }))
        } else {
            dispatch(authorizationActions.close())
        }
    }

    // Copy scenario state for editing
    const activateScenario = (id: string | null) => {
        let scenario
        if (id) {
            scenario = indexedWorkbook.scenarios.entities[id]
            if (!scenario) throw new Error(`Invalid ID ${id}`)
        } else {
            scenario = null
        }

        dispatch(requestActions.close())
        dispatch(groupActions.close())
        dispatch(authorizationActions.close())

        if (scenario) {
            dispatch(scenarioActions.initialize({
                id: scenario.id,
                name: scenario.name ?? '',
                variables: scenario.variables
            }))
        } else {
            dispatch(scenarioActions.close())
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
                        longTextInResponse = (result?.response?.body?.text?.length ?? 0) > 16034
                        break
                    default:
                        let idx = execution.resultIndex ?? -1
                        if (idx >= 0) {
                            result = execution.results[execution.runIndex][resultIndex]
                            resultType = result?.success ? ResultType.Single : ResultType.Failed
                            longTextInResponse = (result?.response?.body?.text?.length ?? 0) > 16034
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
                runIndex: execution.runIndex,
                runList: execution.runList,
                resultIndex: execution.resultIndex,
                resultLists: execution.resultLists,
            }))
        } else {
            dispatch(executionActions.close())
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
                            name: indexedWorkbook.requests.entities[r.requestId]?.name ?? '(Unnamed)',
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
                method: Method.Get,
                url: '',
                timeout: 5000,
                test: `describe('status', () => {
    it('equals 200', () => {
        expect(response.status).to.equal(200)
    })
})`} as EditableWorkbookRequest
            addRequestEntryToStore(indexedWorkbook.requests, entry, false, targetID)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setRequestList(generateRequestNavList()))
            activateRequestOrGroup(id)
        },
        delete: (id: string) => {
            deleteRequestEntryFromStore(indexedWorkbook.requests, id)
            if (activeRequestId === id || activeGroupId === id) {
                activateRequestOrGroup(null)
            }
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setRequestList(generateRequestNavList()))
        },
        move: (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
            moveInStorage<EditableWorkbookRequestEntry>(id, destinationID, onLowerHalf, onLeft, indexedWorkbook.requests)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setRequestList(generateRequestNavList()))
            if (activeRequestId !== id && activeGroupId !== id) {
                activateRequestOrGroup(id)
            }
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
                    indexedWorkbook.requests.entities[request.id] = request
                    return request
                }

                const group = castEntryAsGroup(dupe)
                if (group) {
                    if (indexedWorkbook.requests.childIDs && indexedWorkbook.requests.childIDs) {
                        const sourceChildIDs = indexedWorkbook.requests.childIDs[source.id]
                        if (sourceChildIDs.length > 0) {
                            const dupedChildIDs: string[] = []
                            indexedWorkbook.requests.childIDs[group.id] = dupedChildIDs

                            sourceChildIDs.forEach(childID => {
                                const childEntry = indexedWorkbook.requests.entities[childID]
                                const dupedChildID = copyEntry(childEntry).id
                                dupedChildIDs.push(dupedChildID)
                            })
                        }
                    }
                    indexedWorkbook.requests.entities[group.id] = group
                    return group
                }

                throw new Error('Invalid entry')
            }

            const [_index, _list, source] = findInStorage(id, indexedWorkbook.requests)
            const entry = copyEntry(source)

            let append = true
            if (indexedWorkbook.requests.childIDs) {
                for (const childIDs of Object.entries(indexedWorkbook.requests.childIDs)) {
                    let idxChild = childIDs.indexOf(entry.id)
                    if (idxChild !== -1) {
                        childIDs.splice(idxChild + 1, 0, entry.id)
                        append = false
                        break
                    }
                }
            }

            if (append) {
                const idx = indexedWorkbook.requests.topLevelIDs.indexOf(source.id)
                if (idx !== -1) {
                    indexedWorkbook.requests.topLevelIDs.splice(idx + 1, 0, entry.id)
                    append = false
                }
            }

            if (append) {
                indexedWorkbook.requests.topLevelIDs.push(entry.id)
            }

            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setRequestList(generateRequestNavList()))
            activateRequestOrGroup(entry.id)
        },
        setName: (id: string, value: string) => {
            let entry = indexedWorkbook.requests.entities[id] as EditableWorkbookRequestEntry
            entry.name = value
            dispatch(requestActions.setName(value))
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setRequestList(generateRequestNavList()))
        },
        setURL: (id: string, value: string) => {
            let entry = indexedWorkbook.requests.entities[id] as EditableWorkbookRequest
            entry.url = value
            dispatch(workbookActions.setDirty(true))
            dispatch(requestActions.setURL(value))
        },
        setMethod: (id: string, value: Method) => {
            let entry = indexedWorkbook.requests.entities[id] as EditableWorkbookRequest
            entry.method = value
            dispatch(workbookActions.setDirty(true))
            dispatch(requestActions.setMethod(value))
        },
        setTimeout: (id: string, value: number) => {
            let entry = indexedWorkbook.requests.entities[id] as EditableWorkbookRequest
            entry.timeout = value
            dispatch(workbookActions.setDirty(true))
            dispatch(requestActions.setRequestTimeout(value))
        },
        setQueryStringParams: (id: string, value: EditableNameValuePair[] | undefined) => {
            let entry = indexedWorkbook.requests.entities[id] as EditableWorkbookRequest
            entry.queryStringParams = value
            dispatch(workbookActions.setDirty(true))
            dispatch(requestActions.setQueryStringParams(value))
        },
        setHeaders: (id: string, value: EditableNameValuePair[] | undefined) => {
            let entry = indexedWorkbook.requests.entities[id] as EditableWorkbookRequest
            entry.headers = value
            dispatch(workbookActions.setDirty(true))
            dispatch(requestActions.setHeaders(value))
        },
        setBodyType: (id: string, value: BodyType | undefined) => {
            let entry = indexedWorkbook.requests.entities[id] as EditableWorkbookRequest
            let oldBodyType = entry.body?.type ?? BodyType.None
            let newBodyData = entry.body?.data
            let newBodyType = value ?? BodyType.None

            if (newBodyType !== oldBodyType) {
                switch (newBodyType) {
                    case BodyType.Raw:
                        newBodyData = Array.from((new TextEncoder()).encode(newBodyData?.toString() ?? ''))
                        break
                    case BodyType.Form:
                        const formData = decodeFormData(newBodyData as string)
                        formData.forEach(d => (d as EditableNameValuePair).id = GenerateIdentifier())
                        newBodyData = formData
                        break
                    default:
                        switch (oldBodyType) {
                            case BodyType.Form:
                                newBodyData = encodeFormData(newBodyData as EditableNameValuePair[])
                                break
                            case BodyType.Raw:
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
            let entry = indexedWorkbook.requests.entities[id] as EditableWorkbookRequest
            if (entry.body) {
                entry.body.data = value
            } else {
                entry.body = { data: value }
            }
            dispatch(workbookActions.setDirty(true))
            dispatch(requestActions.setBody({ type: entry.body?.type || BodyType.None, data: value }))
        },
        setTest: (id: string, value: string | undefined) => {
            let entry = indexedWorkbook.requests.entities[id] as EditableWorkbookRequest
            entry.test = value
            // generateRequestNavList()
            dispatch(workbookActions.setDirty(true))
            dispatch(requestActions.setTest(value))
        },
        getRunInformation: () => {
            const id = activeRequestId ?? activeGroupId
            return id
                ? {
                    request: stateStorageToRequestEntry(id, indexedWorkbook.requests),
                    authorization: activeAuthorizationId ? indexedWorkbook.authorizations.entities[activeAuthorizationId] : undefined,
                    scenario: activeScenarioId ? indexedWorkbook.scenarios.entities[activeScenarioId] : undefined,
                }
                : undefined
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
            addRequestEntryToStore(indexedWorkbook.requests, entry, true, targetID)
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
            let entry = indexedWorkbook.requests.entities[id]
            entry.name = value
            dispatch(workbookActions.setDirty(true))
            dispatch(groupActions.setName(value))
            dispatch(navigationActions.setRequestList(generateRequestNavList()))
        },
        setRuns: (id: string, value: number) => {
            let entry = indexedWorkbook.requests.entities[id] as EditableWorkbookRequestGroup
            entry.runs = value
            dispatch(workbookActions.setDirty(true))
            dispatch(groupActions.setRuns(value))
        }
    }

    // Actions for updating authorization data and state
    const authorizationContextActions = {
        add: (targetID?: string | null) => {
            const id = GenerateIdentifier()
            const authorization = {
                id,
                name: '',
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

            indexedWorkbook.authorizations.entities[authorization.id] = authorization

            addTopLevelEntryToStore(indexedWorkbook.authorizations, authorization, targetID)
            activateAuthorization(id)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setAuthorizationList(generateAuthorizationNavList()))
        },
        delete: (id: string) => {
            deleteFromStorage(id, indexedWorkbook.authorizations)
            activateAuthorization(null)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setAuthorizationList(generateAuthorizationNavList()))
        },
        move: (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
            moveInStorage<EditableWorkbookAuthorization>(id, destinationID, onLowerHalf, onLeft, indexedWorkbook.authorizations)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setAuthorizationList(generateAuthorizationNavList()))
            if (activeAuthorizationId !== id) {
                activateAuthorization(id)
            }
        },
        copy: (id: string) => {
            const [_index, _list, source] = findInStorage(id, indexedWorkbook.authorizations)
            const authorization = structuredClone(source)
            authorization.id = GenerateIdentifier()
            authorization.name = `${GetTitle(source)} - Copy`
            authorization.dirty = true
            const idx = indexedWorkbook.authorizations.topLevelIDs.indexOf(source.id)
            if (idx === -1) {
                indexedWorkbook.authorizations.topLevelIDs.push(authorization.id)
            } else {
                indexedWorkbook.authorizations.topLevelIDs.splice(idx + 1, 0, authorization.id)
            }
            indexedWorkbook.authorizations.entities[authorization.id] = authorization
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setAuthorizationList(generateAuthorizationNavList()))
            activateAuthorization(authorization.id)
        },
        setName: (id: string, value: string) => {
            let entry = indexedWorkbook.authorizations.entities[id]
            entry.name = value
            dispatch(authorizationActions.setName(value))
            dispatch(navigationActions.setAuthorizationList(generateAuthorizationNavList()))
        },
        setType: (id: string, value: WorkbookAuthorizationType) => {
            let entry = indexedWorkbook.authorizations.entities[id]
            entry.type = value
            dispatch(authorizationActions.setType(value))
        },
        setUsername: (id: string, value: string) => {
            let entry = indexedWorkbook.authorizations.entities[id] as WorkbookBasicAuthorization
            entry.username = value
            dispatch(authorizationActions.setUsername(value))
        },
        setPassword: (id: string, value: string) => {
            let entry = indexedWorkbook.authorizations.entities[id] as WorkbookBasicAuthorization
            entry.username = value
            dispatch(authorizationActions.setUsername(value))
        },
        setAccessTokenUrl: (id: string, value: string) => {
            let entry = indexedWorkbook.authorizations.entities[id] as WorkbookOAuth2ClientAuthorization
            entry.accessTokenUrl = value
            dispatch(authorizationActions.setAccessTokenUrl(value))
        },
        setClientId: (id: string, value: string) => {
            let entry = indexedWorkbook.authorizations.entities[id] as WorkbookOAuth2ClientAuthorization
            entry.clientId = value
            dispatch(authorizationActions.setClientId(value))
        },
        setClientSecret: (id: string, value: string) => {
            let entry = indexedWorkbook.authorizations.entities[id] as WorkbookOAuth2ClientAuthorization
            entry.clientId = value
            dispatch(authorizationActions.setClientSecret(value))
        },
        setScope: (id: string, value: string) => {
            let entry = indexedWorkbook.authorizations.entities[id] as WorkbookOAuth2ClientAuthorization
            entry.scope = value
            dispatch(authorizationActions.setScope(value))
        },
        setHeader: (id: string, value: string) => {
            let entry = indexedWorkbook.authorizations.entities[id] as WorkbookApiKeyAuthorization
            entry.header = value
            dispatch(authorizationActions.setHeader(value))
        },
        setValue: (id: string, value: string) => {
            let entry = indexedWorkbook.authorizations.entities[id] as WorkbookApiKeyAuthorization
            entry.value = value
            dispatch(authorizationActions.setValue(value))
        },
    }

    // Actions for updating scenario data and state
    const scenarioContextActions = {
        add: (targetID?: string | null) => {
            const id = GenerateIdentifier()
            const scenario = {
                id,
                name: '',
                variables: []
            } as EditableWorkbookScenario

            indexedWorkbook.scenarios.entities[scenario.id] = scenario
            addTopLevelEntryToStore(indexedWorkbook.scenarios, scenario, targetID)
            activateScenario(id)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setScenariosList(generateScenarioNavList()))
        },
        delete: (id: string) => {
            deleteFromStorage(id, indexedWorkbook.scenarios)
            activateScenario(null)
            activateRequestOrGroup(null)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setScenariosList(generateScenarioNavList()))
        },
        move: (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
            moveInStorage<EditableWorkbookScenario>(id, destinationID, onLowerHalf, onLeft, indexedWorkbook.scenarios)
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setScenariosList(generateScenarioNavList()))
            if (activeScenarioId !== id) {
                activateScenario(id)
            }
        },
        copy: (id: string) => {
            const [_index, _list, source] = findInStorage(id, indexedWorkbook.scenarios)
            const scenario = structuredClone(source)
            scenario.id = GenerateIdentifier()
            scenario.name = `${GetTitle(source)} - Copy`
            scenario.dirty = true
            const idx = indexedWorkbook.scenarios.topLevelIDs.findIndex(id => id === source.id)
            if (idx === -1) {
                indexedWorkbook.scenarios.topLevelIDs.push(scenario.id)
            } else {
                indexedWorkbook.scenarios.topLevelIDs.splice(idx + 1, 0, scenario.id)
            }
            indexedWorkbook.scenarios.entities[scenario.id] = scenario
            dispatch(workbookActions.setDirty(true))
            dispatch(navigationActions.setScenariosList(generateScenarioNavList()))
            activateAuthorization(scenario.id)
        },
        setName: (id: string, value: string) => {
            let entry = indexedWorkbook.scenarios.entities[id]
            entry.name = value
            dispatch(scenarioActions.setName(value))
            dispatch(navigationActions.setScenariosList(generateScenarioNavList()))
        },
        setVariables: (id: string, value: EditableNameValuePair[] | undefined) => {
            let entry = indexedWorkbook.scenarios.entities[id]
            entry.variables = value
            dispatch(scenarioActions.setVariables(value))
            dispatch(navigationActions.setScenariosList(generateScenarioNavList()))
        }
    }

    const workbookContextActions = {
        clearAllActivations,
        activateRequestOrGroup,
        activateAuthorization,
        activateScenario
    }

    const executionContextActions = {
        setSelectedAuthorization: (id: string) => {
            indexedWorkbook.selectedAuthorizationID = id
            dispatch(executionActions.setSelected({
                selectedAuthorizationID: id,
                selectedScenarioID: indexedWorkbook.selectedScenarioID
            }))
            dispatch(workbookActions.setDirty(true))
        },
        setSelectedScenario: (id: string) => {
            indexedWorkbook.selectedScenarioID = id
            dispatch(executionActions.setSelected({
                selectedAuthorizationID: indexedWorkbook.selectedAuthorizationID,
                selectedScenarioID: id
            }))
            dispatch(workbookActions.setDirty(true))
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
            dispatch(executionActions.runStart({
                id,
            }))
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
                const workbookResults = ApicizeRunResultsToWorkbookExecutionResults(results, indexedWorkbook.requests.entities)
                for (let runIndex = 0; runIndex < workbookResults.length; runIndex++) {
                    execution.runList.push({ index: runIndex, text: `Run ${runIndex + 1} of ${workbookResults.length}` })
                    const runResults = workbookResults[runIndex]
                    const resultList = []
                    for (let resultIndex = 0; resultIndex < runResults.length; resultIndex++) {
                        const request = indexedWorkbook.requests.entities[runResults[resultIndex].requestId]
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
        workbook: workbookContextActions,
        execution: executionContextActions,

        newWorkbook: () => {
            dispatch(navigationActions.setLists({
                requests: [],
                authorizations: [],
                scenarios: []
            }))
            dispatch(workbookActions.initializeWorkbook({
                fullName: '',
                displayName: ''
            }))
            dispatch(executionActions.setSelected({
                selectedAuthorizationID: NO_AUTHORIZATION,
                selectedScenarioID: NO_SCENARIO,
            }))
        },
        openWorkbook: (fullName: string, displayName: string, workbookToOpen: StoredWorkbook) => {
            indexedWorkbook = workbookToStateStorage(workbookToOpen)

            dispatch(workbookActions.initializeWorkbook({
                fullName,
                displayName,
            }))

            dispatch(executionActions.setSelected({
                selectedAuthorizationID: indexedWorkbook.selectedAuthorizationID,
                selectedScenarioID: indexedWorkbook.selectedScenarioID,
            }))

            dispatch(navigationActions.setLists({
                requests: generateRequestNavList(),
                authorizations: generateAuthorizationNavList(),
                scenarios: generateScenarioNavList()
            }))
        },
        getWorkbookFromStore: () =>
            stateStorageToWorkbook(
                indexedWorkbook.requests,
                indexedWorkbook.authorizations,
                indexedWorkbook.scenarios,
                indexedWorkbook.selectedAuthorizationID,
                indexedWorkbook.selectedScenarioID
            ),
        onSaveWorkbook: (fullName: string, displayName: string) => {
            (fullName: string, displayName: string) => {
                dispatch(workbookActions.saveWorkbook({
                    fullName,
                    displayName
                }))
            }
        },
    }
}

export const WorkbookStorageContext = createContext({} as ReturnType<typeof storageActions>)

export function WorkbookStorageProvider({ children }: { children?: ReactNode }) {
    return (
        <WorkbookStorageContext.Provider value={storageActions()}>
            {children}
        </WorkbookStorageContext.Provider>
    )
}
