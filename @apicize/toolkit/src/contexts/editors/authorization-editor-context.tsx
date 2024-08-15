import { Persistence, WorkbookApiKeyAuthorization, WorkbookAuthorizationType, WorkbookBasicAuthorization, WorkbookOAuth2ClientAuthorization, WorkbookPkcs12Certificate, WorkbookPkcs8PemCertificate } from "@apicize/lib-typescript";
import { useState, ReactNode, createContext, useCallback, useMemo, useContext, useEffect, useRef } from "react";
import { useWorkspace } from "../workspace-context";
import { NavigationType, NO_SELECTION_ID } from "../../models/store";
import { EntitySelection } from "../../models/workbook/entity-selection";
import { useNavigationState } from "../navigation-state-context";

interface AuthorizationEditorContextType {
    id: string,
    name: string,
    persistence: Persistence,
    type: WorkbookAuthorizationType,
    username: string,
    password: string,
    accessTokenUrl: string,
    clientId: string,
    clientSecret: string,
    scope: string,
    selectedCertificateId: string,
    selectedProxyId: string,
    header: string,
    value: string,
    certificates: EntitySelection[],
    proxies: EntitySelection[],
    changeName: (value: string) => void,
    changePersistence: (value: Persistence) => void,
    changeType: (value: WorkbookAuthorizationType) => void,
    changeUsername: (value: string) => void,
    changePassword: (value: string) => void,
    changeAccessTokenUrl: (value: string) => void,
    changeClientId: (value: string) => void,
    changeClientSecret: (value: string) => void,
    changeScope: (value: string) => void,
    changeSelectedCertificateId: (value: string) => void,
    changeSelectedProxyId: (value: string) => void,
    changeHeader: (value: string) => void,
    changeValue: (value: string) => void,
}

const AuthorizationEditorContext = createContext<AuthorizationEditorContextType | undefined>(undefined)

export function useAuthorizationEditor() {
    const context = useContext(AuthorizationEditorContext);
    if (context === undefined) {
        throw new Error('useAuthorizationEditor must be used within a AuthorizationEditorProvider');
    }
    return context;
}

export const AuthorizationEditorProvider = ({ children }: { children: ReactNode }) => {

    const workspaceCtx = useWorkspace()
    const navState = useNavigationState()

    let auth = (navState.activeType === NavigationType.Authorization && navState.activeId && navState.activeId.length > 0)
        ? workspaceCtx.authorization.getAuthorization(navState.activeId)
        : undefined

    const [id, setId] = useState(auth?.id ?? '')
    const [name, setName] = useState(auth?.name ?? '')
    const [persistence, setPersistence] = useState(auth?.persistence ?? Persistence.Private)
    const [type, setType] = useState(auth?.type ?? WorkbookAuthorizationType.ApiKey)
    const [username, setUsername] = useState((auth as WorkbookBasicAuthorization)?.username ?? '')
    const [password, setPassword] = useState((auth as WorkbookBasicAuthorization)?.password ?? '')
    const [accessTokenUrl, setAccessTokenUrl] = useState((auth as WorkbookOAuth2ClientAuthorization)?.accessTokenUrl ?? '')
    const [clientId, setClientId] = useState((auth as WorkbookOAuth2ClientAuthorization)?.clientId ?? '')
    const [clientSecret, setClientSecret] = useState((auth as WorkbookOAuth2ClientAuthorization)?.clientSecret ?? '')
    const [scope, setScope] = useState((auth as WorkbookOAuth2ClientAuthorization)?.scope ?? '')
    const [selectedCertificateId, setSelectedCertificateId] = useState((auth as WorkbookOAuth2ClientAuthorization)?.selectedCertificate?.id ?? NO_SELECTION_ID)
    const [selectedProxyId, setSelectedProxyId] = useState((auth as WorkbookOAuth2ClientAuthorization)?.selectedProxy?.id ?? NO_SELECTION_ID)
    const [header, setHeader] = useState((auth as WorkbookApiKeyAuthorization)?.header ?? '')
    const [value, setValue] = useState((auth as WorkbookApiKeyAuthorization)?.value ?? '')
    const [certificates, setCertificates] = useState(workspaceCtx.authorization.getCertificateList())
    const [proxies, setProxies] = useState(workspaceCtx.authorization.getProxyList())

    const isFirstRender = useRef(true)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return // return early if first render
        }

        auth = (navState.activeType === NavigationType.Authorization && navState.activeId && navState.activeId.length > 0)
            ? workspaceCtx.authorization.getAuthorization(navState.activeId)
            : undefined
        setId(auth?.id ?? '')
        setName(auth?.name ?? '')
        setPersistence(auth?.persistence ?? Persistence.Private)
        setType(auth?.type ?? WorkbookAuthorizationType.ApiKey)
        setUsername((auth as WorkbookBasicAuthorization)?.username ?? '')
        setPassword((auth as WorkbookBasicAuthorization)?.password ?? '')
        setAccessTokenUrl((auth as WorkbookOAuth2ClientAuthorization)?.accessTokenUrl ?? '')
        setClientId((auth as WorkbookOAuth2ClientAuthorization)?.clientId ?? '')
        setClientSecret((auth as WorkbookOAuth2ClientAuthorization)?.clientSecret ?? '')
        setScope((auth as WorkbookOAuth2ClientAuthorization)?.scope ?? '')
        setSelectedCertificateId((auth as WorkbookOAuth2ClientAuthorization)?.selectedCertificate?.id ?? NO_SELECTION_ID)
        setSelectedProxyId((auth as WorkbookOAuth2ClientAuthorization)?.selectedProxy?.id ?? NO_SELECTION_ID)
        setHeader((auth as WorkbookApiKeyAuthorization)?.header ?? '')
        setValue((auth as WorkbookApiKeyAuthorization)?.value ?? '')
        setCertificates(workspaceCtx.authorization.getCertificateList())
        setProxies(workspaceCtx.authorization.getProxyList())
    }, [navState.activeType, navState.activeId])

    const changeName = useCallback((value: string) => {
        setName(value)
        workspaceCtx.authorization.setName(id, value)
    }, [id])

    const changePersistence = useCallback((value: Persistence) => {
        setPersistence(value)
        workspaceCtx.authorization.setPersistence(id, value)
    }, [id])

    const changeType = useCallback((value: WorkbookAuthorizationType) => {
        setType(value)
        workspaceCtx.authorization.setType(id, value)
    }, [id])

    const changeUsername = useCallback((value: string) => {
        setUsername(value)
        workspaceCtx.authorization.setUsername(id, value)
    }, [id])

    const changePassword = useCallback((value: string) => {
        setPassword(value)
        workspaceCtx.authorization.setPassword(id, value)
    }, [id])

    const changeAccessTokenUrl = useCallback((value: string) => {
        setAccessTokenUrl(value)
        workspaceCtx.authorization.setAccessTokenUrl(id, value)
    }, [id])

    const changeClientId = useCallback((value: string) => {
        setClientId(value)
        workspaceCtx.authorization.setClientId(id, value)
    }, [id])

    const changeClientSecret = useCallback((value: string) => {
        setClientSecret(value)
        workspaceCtx.authorization.setClientSecret(id, value)
    }, [id])

    const changeScope = useCallback((value: string) => {
        setScope(value)
        workspaceCtx.authorization.setScope(id, value)
    }, [id])

    const changeSelectedCertificateId = useCallback((value: string) => {
        setSelectedCertificateId(value)
        workspaceCtx.authorization.setSelectedCertificateId(id, value)
    }, [id])

    const changeSelectedProxyId = useCallback((value: string) => {
        setSelectedCertificateId(value)
        workspaceCtx.authorization.setSelectedProxyId(id, value)
    }, [id])

    const changeHeader = useCallback((value: string) => {
        setHeader(value)
        workspaceCtx.authorization.setHeader(id, value)
    }, [id])

    const changeValue = useCallback((value: string) => {
        setValue(value)
        workspaceCtx.authorization.setValue(id, value)
    }, [id])

    const ctxValue = useMemo(
        () => ({
            id, name, persistence, type, username, password, accessTokenUrl, clientId, clientSecret,
            scope, selectedCertificateId, selectedProxyId, certificates, proxies, header, value,
            changeName, changePersistence, changeType, changeUsername, changePassword, changeAccessTokenUrl, changeClientId, changeClientSecret,
            changeScope, changeSelectedCertificateId, changeSelectedProxyId, changeHeader, changeValue,
        }),
        [
            id, name, persistence, type, username, password, accessTokenUrl, clientId, clientSecret,
            scope, selectedCertificateId, selectedProxyId, certificates, proxies, header, value,
            changeName, changePersistence, changeType, changeUsername, changePassword, changeAccessTokenUrl, changeClientId, changeClientSecret,
            changeScope, changeSelectedCertificateId, changeSelectedProxyId, changeHeader, changeValue,
        ]
    )

    return <AuthorizationEditorContext.Provider value={ctxValue}>
        {auth ? children : <></>}
    </AuthorizationEditorContext.Provider>
}

