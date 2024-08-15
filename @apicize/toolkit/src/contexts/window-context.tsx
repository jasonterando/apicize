import { useState, ReactNode, createContext, useCallback, useMemo, useContext } from "react";

interface WindowContextType {
    appName: string,
    appVersion: string,
    workbookFullName: string,
    workbookDisplayName: string,
    dirty: boolean,
    changeApp: (name: string, version: string) => void,
    changeWorkbook: (fullName: string, displayName: string) => void,
    changeDirty: (onOff: boolean) => void
}

const WindowContext = createContext<WindowContextType | undefined>(undefined)

export function useWindow() {
    const context = useContext(WindowContext);
    if (context === undefined) {
        throw new Error('useWindow must be used within a WindowProvider');
    }
    return context;
}

export const WindowProvider = ({ children }: { children: ReactNode }) => {
    const [appName, setAppName] = useState('')
    const [appVersion, setAppVersion] = useState('')
    const [workbookFullName, setWorkbookFullName] = useState('')
    const [workbookDisplayName, setWorkbookDisplayName] = useState('')
    const [dirty, setDirty] = useState(false)

    const changeApp = useCallback((name: string, version: string) => {
        setAppName(name)
        setAppVersion(version)
    }, [])

    const changeWorkbook = useCallback((fullName: string, displayName: string) => {
        setWorkbookFullName(fullName)
        setWorkbookDisplayName(displayName)
    }, [])

    const changeDirty = useCallback((onOff: boolean) => {
        setDirty(onOff)
    }, [])

    const value = useMemo(
        () => ({
            appName, appVersion, workbookFullName, workbookDisplayName, dirty, 
                changeApp, changeWorkbook, changeDirty,
        }),
        [appName, appVersion, workbookFullName, workbookDisplayName, dirty, 
            changeApp, changeWorkbook, changeDirty,]
    )

    return <WindowContext.Provider value={value}>{children}</WindowContext.Provider>
}

