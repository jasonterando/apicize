import { Persisted, Persistence } from "@apicize/lib-typescript";
import { useState, ReactNode, createContext, useCallback, useMemo, useContext, useEffect, useRef } from "react";
import { useNavigationState } from "../navigation-state-context";
import { useNavigationContent } from "../navigation-content-context";
import { useWorkspace } from "../workspace-context";
import { NavigationType } from "../../models/store";

interface ProxyEditorContextType {
    id: string,
    name: string,
    persistence: Persistence,
    url: string,
    changeName: (value: string) => void,
    changePersistence: (value: Persistence) => void,
    changeUrl: (value: string) => void,
}

const ProxyEditorContext = createContext<ProxyEditorContextType | undefined>(undefined)

export function useProxyEditor() {
    const context = useContext(ProxyEditorContext);
    if (context === undefined) {
        throw new Error('useProxyEditor must be used within a ProxyEditorProvider');
    }
    return context;
}

export const ProxyEditorProvider = ({ children }: { children: ReactNode }) => {

    const workspaceCtx = useWorkspace()
    const navState = useNavigationState()

    let proxy = (navState.activeType === NavigationType.Proxy && navState.activeId && navState.activeId.length > 0) 
        ? workspaceCtx.proxy?.getProxy(navState.activeId)
        : undefined
        
    const [id, setId] = useState(proxy?.id ?? '')
    const [name, setName] = useState(proxy?.name ?? '')
    const [persistence, setPersistence] = useState(proxy?.persistence ?? Persistence.Private)
    const [url, setUrl] = useState(proxy?.url ?? '')

    const isFirstRender = useRef(true)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return // return early if first render
        }
        proxy = (navState.activeType === NavigationType.Proxy && navState.activeId && navState.activeId.length > 0)
            ? workspaceCtx.proxy.getProxy(navState.activeId)
            : undefined
        setId(proxy?.id ?? '')
        setName(proxy?.name ?? '')
        setPersistence(proxy?.persistence ?? Persistence.Private)
        setUrl(proxy?.url ?? '')
    }, [navState.activeType, navState.activeId])

    const changeName = useCallback((name: string) => {
        setName(name)
        workspaceCtx.proxy?.setName(id, name)
    }, [id])

    const changePersistence = useCallback((persistence: Persistence) => {
        setPersistence(persistence)
        workspaceCtx.proxy?.setPersistence(id, persistence)
    }, [id])

    const changeUrl = useCallback((url: string) => {
        setUrl(url)
        workspaceCtx.proxy?.setUrl(id, url)
    }, [id])

    const value = useMemo(
        () => ({
            id, name, persistence, url, changeName, changePersistence, changeUrl,
        }),
        [id, name, persistence, url, changeName, changePersistence, changeUrl,]
    )    

    return <ProxyEditorContext.Provider value={value}>
        {id.length > 0 ? children : <></>}
    </ProxyEditorContext.Provider>
}

