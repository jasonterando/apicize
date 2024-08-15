import { Persistence, WorkbookBodyData, WorkbookBodyType, WorkbookGroupExecution, WorkbookMethod } from "@apicize/lib-typescript";
import { useState, ReactNode, createContext, useCallback, useMemo, useContext, useEffect, useRef } from "react";
import { useNavigationState } from "../navigation-state-context";
import { useWorkspace } from "../workspace-context";
import { DEFAULT_SELECTION_ID, NavigationType } from "../../models/store";
import { EditableNameValuePair } from "../../models/workbook/editable-name-value-pair";
import { EntitySelection } from "../../models/workbook/entity-selection";
import { castEntryAsGroup, castEntryAsRequest } from "../../models/workbook/editable-workbook-request-entry";
import { WorkbookExecution } from "../../models/workbook/workbook-execution";

interface RequestEditorContextType {
    id: string,
    name: string,
    isGroup: boolean,
    url: string,
    method: WorkbookMethod,
    timeout: number,
    runs: number,
    execution: WorkbookGroupExecution,
    queryStringParams: EditableNameValuePair[],
    headers: EditableNameValuePair[],
    bodyType: WorkbookBodyType,
    bodyData: WorkbookBodyData,
    test: string,
    selectedScenarioId: string,
    selectedAuthorizationId: string,
    selectedCertificateId: string,
    selectedProxyId: string,
    scenarios: EntitySelection[],
    authorizations: EntitySelection[],
    certificates: EntitySelection[],
    proxies: EntitySelection[],
    changeName: (value: string) => void,
    changeUrl: (value: string) => void,
    changeMethod: (value: WorkbookMethod) => void,
    changeTimeout: (value: number) => void,
    changeRuns: (value: number) => void,
    changeExecution: (value: WorkbookGroupExecution) => void,
    changeQueryStringParams: (value: EditableNameValuePair[]) => void,
    changeHeaders: (value: EditableNameValuePair[]) => void,
    changeBodyType: (value: WorkbookBodyType) => void,
    changeBodyData: (value: WorkbookBodyData) => void,
    changeTest: (value: string) => void,
    changeSelectedScenarioId: (value: string) => void,
    changeSelectedAuthorizationId: (value: string) => void,
    changeSelectedCertificateId: (value: string) => void,
    changeSelectedProxyId: (value: string) => void,
}

const RequestEditorContext = createContext<RequestEditorContextType | undefined>(undefined)

export function useRequestEditor() {
    const context = useContext(RequestEditorContext);
    if (context === undefined) {
        throw new Error('useRequestEditor must be used within a RequestditorProvider');
    }
    return context;
}

export const RequestEditorProvider = ({ children }: { children: ReactNode }) => {

    const workspaceCtx = useWorkspace()
    const navState = useNavigationState()

    let entry = ([NavigationType.Request, NavigationType.Group].includes(navState.activeType) && navState.activeId && navState.activeId.length > 0)
        ? workspaceCtx.request.getRequest(navState.activeId)
        : null

    let request = castEntryAsRequest(entry)
    let group = castEntryAsGroup(entry)
    let entryIsRequest = !!request

    const [id, setId] = useState(entry?.id ?? '')
    const [name, setName] = useState(entry?.name ?? '')
    const [isGroup, setIsGroup] = useState(!entryIsRequest)
    const [url, setUrl] = useState(request?.url ?? '')
    const [method, setMethod] = useState(request?.method ?? WorkbookMethod.Get)
    const [timeout, setTimeout] = useState(request?.timeout ?? 30000)
    const [runs, setRuns] = useState(entry?.runs ?? 1)
    const [execution, setExecution] = useState(group?.execution ?? WorkbookGroupExecution.Sequential)
    const [queryStringParams, setQueryStringParams] = useState(request?.queryStringParams ?? [])
    const [headers, setHeaders] = useState(request?.headers ?? [])
    const [bodyType, setBodyType] = useState(request?.body?.type ?? WorkbookBodyType.None)
    const [bodyData, setBodyData] = useState(request?.body?.data ?? '')
    const [test, setTest] = useState(request?.test ?? '')
    const [selectedScenarioId, setSelectedScenarioId] = useState(entry?.selectedScenario?.id ?? DEFAULT_SELECTION_ID)
    const [selectedAuthorizationId, setSelectedAuthorizationId] = useState(entry?.selectedAuthorization?.id ?? DEFAULT_SELECTION_ID)
    const [selectedCertificateId, setSelectedCertificateId] = useState(entry?.selectedCertificate?.id ?? DEFAULT_SELECTION_ID)
    const [selectedProxyId, setSelectedProxyId] = useState(entry?.selectedProxy?.id ?? DEFAULT_SELECTION_ID)

    const parameterLists = workspaceCtx.getRequestParameterLists(entry?.id ?? '')
    const [scenarios, setScenarios] = useState(parameterLists.scenarios)
    const [authorizations, setAuthorizations] = useState(parameterLists.authorizations)
    const [certificates, setCertificates] = useState(parameterLists.certificates)
    const [proxies, setProxies] = useState(parameterLists.proxies)

    const isFirstRender = useRef(true)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return // return early if first render
        }
        entry = ([NavigationType.Request, NavigationType.Group].includes(navState.activeType) && navState.activeId && navState.activeId.length > 0)
            ? workspaceCtx.request.getRequest(navState.activeId)
            : null
        request = castEntryAsRequest(entry)
        group = castEntryAsGroup(entry)
        entryIsRequest = !!request

        setId(entry?.id ?? '')
        setName(entry?.name ?? '')
        setUrl(request?.url ?? '')
        setIsGroup(!entryIsRequest)

        setMethod(request?.method ?? WorkbookMethod.Get)
        setTimeout(request?.timeout ?? 30000)
        setRuns(entry?.runs ?? 1)
        setExecution(group?.execution ?? WorkbookGroupExecution.Sequential)
        setQueryStringParams(request?.queryStringParams ?? [])
        setHeaders(request?.headers ?? [])
        setBodyType(request?.body?.type ?? WorkbookBodyType.None)
        setBodyData(request?.body?.data ?? '')
        setTest(request?.test ?? '')
        setSelectedScenarioId(entry?.selectedScenario?.id ?? DEFAULT_SELECTION_ID)
        setSelectedAuthorizationId(entry?.selectedAuthorization?.id ?? DEFAULT_SELECTION_ID)
        setSelectedCertificateId(entry?.selectedCertificate?.id ?? DEFAULT_SELECTION_ID)
        setSelectedProxyId(entry?.selectedProxy?.id ?? DEFAULT_SELECTION_ID)

        const parameterLists = workspaceCtx.getRequestParameterLists(entry?.id ?? '')
        setScenarios(parameterLists.scenarios)
        setAuthorizations(parameterLists.authorizations)
        setCertificates(parameterLists.certificates)
        setProxies(parameterLists.proxies)
    }, [navState.activeType, navState.activeId])

    const changeName = useCallback((value: string) => {
        setName(value)
        workspaceCtx.request?.setName(id, value)
    }, [id])

    const changeUrl = useCallback((value: string) => {
        setUrl(value)
        workspaceCtx.request?.setUrl(id, value)
    }, [id])

    const changeMethod = useCallback((value: WorkbookMethod) => {
        setMethod(value)
        workspaceCtx.request?.setUrl(id, value)
    }, [id])

    const changeTimeout = useCallback((value: number) => {
        setTimeout(value)
        workspaceCtx.request?.setTimeout(id, value)
    }, [id])

    const changeRuns = useCallback((value: number) => {
        setRuns(value)
        workspaceCtx.request?.setRuns(id, value)
    }, [id])

    const changeExecution = useCallback((value: WorkbookGroupExecution) => {
        setExecution(value)
        workspaceCtx.group?.setExecution(id, value)
    }, [id])

    const changeQueryStringParams = useCallback((value: EditableNameValuePair[]) => {
        setQueryStringParams(value)
        workspaceCtx.request?.setQueryStringParams(id, value)
    }, [id])

    const changeHeaders = useCallback((value: EditableNameValuePair[]) => {
        setHeaders(value)
        workspaceCtx.request?.setHeaders(id, value)
    }, [id])

    const changeBodyType = useCallback((value: WorkbookBodyType) => {
        setBodyType(value)
        workspaceCtx.request?.setBodyType(id, value)
    }, [id])

    const changeBodyData = useCallback((value: WorkbookBodyData) => {
        setBodyData(value)
        workspaceCtx.request?.setBodyData(id, value)
    }, [id])

    const changeTest = useCallback((value: string) => {
        setTest(value)
        workspaceCtx.request?.setTest(id, value)
    }, [id])

    const changeSelectedScenarioId = useCallback((value: string) => {
        setSelectedScenarioId(value)
        workspaceCtx.request?.setSelectedScenarioId(id, value)
    }, [id])

    const changeSelectedAuthorizationId = useCallback((value: string) => {
        setSelectedAuthorizationId(value)
        workspaceCtx.request?.setSelectedAuthorizationId(id, value)
    }, [id])

    const changeSelectedCertificateId = useCallback((value: string) => {
        setSelectedCertificateId(value)
        workspaceCtx.request?.setSelectedCertificateId(id, value)
    }, [id])

    const changeSelectedProxyId = useCallback((value: string) => {
        setSelectedProxyId(value)
        workspaceCtx.request?.setSelectedProxyId(id, value)
    }, [id])

    const value = useMemo(
        () => ({
            id, name, isGroup, url, method, timeout, runs, execution, queryStringParams, headers, bodyType, bodyData, test, 
            selectedScenarioId, selectedAuthorizationId, selectedCertificateId, selectedProxyId,
            scenarios, authorizations, certificates, proxies,
            changeName, changeUrl, changeMethod, changeTimeout, changeRuns, changeExecution, 
            changeQueryStringParams, changeHeaders, changeBodyType, changeBodyData, changeTest,
            changeSelectedScenarioId, changeSelectedAuthorizationId, changeSelectedCertificateId, changeSelectedProxyId,
        }),
        [
            id, name, isGroup, url, method, timeout, runs, execution, queryStringParams, headers, bodyType, bodyData, test,
            selectedScenarioId, selectedAuthorizationId, selectedCertificateId, selectedProxyId,
            scenarios, authorizations, certificates, proxies,
            changeName, changeUrl, changeMethod, changeTimeout, changeRuns, changeExecution, 
            changeQueryStringParams, changeHeaders, changeBodyType, changeBodyData, changeTest,
            changeSelectedScenarioId, changeSelectedAuthorizationId, changeSelectedCertificateId, changeSelectedProxyId,
        ]
    )

    return <RequestEditorContext.Provider value={value}>
        { entry ? children : <></> }
    </RequestEditorContext.Provider>
}
