import { useState, ReactNode, createContext, useCallback, useMemo, useContext } from "react";
import { NavigationType } from "../models/store";
import { NavigationListItem } from "../models/navigation-list-item";
import { useNavigationState } from "./navigation-state-context";

interface NavigationContentContextType {
    activeType: NavigationType,
    activeId: string | null,
    requestList: NavigationListItem[],
    scenarioList: NavigationListItem[],
    authorizationList: NavigationListItem[],
    certificateList: NavigationListItem[],
    proxyList: NavigationListItem[],
    changeRequestList: (list: NavigationListItem[]) => void,
    changeScenarioList: (list: NavigationListItem[]) => void,
    changeAuthorizationList: (list: NavigationListItem[]) => void,
    changeCertificateList: (list: NavigationListItem[]) => void,
    changeProxyList: (list: NavigationListItem[]) => void,
    changeLists: (requests: NavigationListItem[], scenarios: NavigationListItem[],
        authorizations: NavigationListItem[], certificates: NavigationListItem[], proxies: NavigationListItem[]) => void,
}

const NavigationContentContext = createContext<NavigationContentContextType | undefined>(undefined)

export function useNavigationContent() {
    const context = useContext(NavigationContentContext);
    if (context === undefined) {
        throw new Error('useNavigationContent must be used within a NavigationContentProvider');
    }
    return context;
}

export const NavigationContentProvider = ({ children }: { children: ReactNode }) => {
    const navStateCtx = useNavigationState()

    const activeType = navStateCtx.activeType
    const activeId = navStateCtx.activeId
    const [requestList, setRequestList] = useState<NavigationListItem[]>([])
    const [scenarioList, setScenarioList] = useState<NavigationListItem[]>([])
    const [authorizationList, setAuthorizationList] = useState<NavigationListItem[]>([])
    const [certificateList, setCertificateList] = useState<NavigationListItem[]>([])
    const [proxyList, setProxyList] = useState<NavigationListItem[]>([])

    const changeRequestList = useCallback((list: NavigationListItem[]) => {
        setRequestList(list)
    }, [])

    const changeScenarioList = useCallback((list: NavigationListItem[]) => {
        setScenarioList(list)
    }, [])

    const changeAuthorizationList = useCallback((list: NavigationListItem[]) => {
        setAuthorizationList(list)
    }, [])

    const changeCertificateList = useCallback((list: NavigationListItem[]) => {
        setCertificateList(list)
    }, [])

    const changeProxyList = useCallback((list: NavigationListItem[]) => {
        setProxyList(list)
    }, [])

    const changeLists = useCallback((
        requests: NavigationListItem[], scenarios: NavigationListItem[],
        authorizations: NavigationListItem[], certificates: NavigationListItem[], proxies: NavigationListItem[]) => {
        setRequestList(requests)
        setScenarioList(scenarios)
        setAuthorizationList(authorizations)
        setCertificateList(certificates)
        setProxyList(proxies)
    }, [])

    const value = useMemo(
        () => ({
            activeType, activeId, requestList, scenarioList, authorizationList, certificateList, proxyList,
            changeRequestList, changeScenarioList, changeAuthorizationList, changeCertificateList, changeProxyList, changeLists,
        }),
        [activeType, activeId, requestList, scenarioList, authorizationList, certificateList, proxyList,
            changeRequestList, changeScenarioList, changeAuthorizationList, changeCertificateList, changeProxyList, changeLists,
        ]
    )

    return <NavigationContentContext.Provider value={value}>{children}</NavigationContentContext.Provider>
}
