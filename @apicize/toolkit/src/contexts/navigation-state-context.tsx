import { useState, ReactNode, createContext, useCallback, useMemo, useContext } from "react";
import { NavigationType } from "../models/store";

interface NavigationStateContextType {
    activeType: NavigationType,
    activeId: string | null,
    activeExecutionId: string | null,
    changeActive: (type: NavigationType, id: string) => void,
    clearActive: () => void,
    changeExecution: (id: string) => void,
    clearExecution: () => void,
    changeShowNavigation: (onOff: boolean) => void,
}

const NavigationStateContext = createContext<NavigationStateContextType | undefined>(undefined)

export function useNavigationState() {
    const context = useContext(NavigationStateContext);
    if (context === undefined) {
        throw new Error('useNavigationState must be used within a NavigationStateProvider');
    }
    return context;
}

export const NavigationStateProvider = ({ children }: { children: ReactNode }) => {
    const [activeType, setActiveType] = useState(NavigationType.None)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null)
    const [showNavigation, setShowNavigation] = useState(false)

    const changeActive = useCallback((type: NavigationType, id: string) => {
        setActiveType(type)
        setActiveId(id)
    }, [activeType, activeId])

    const clearActive = useCallback(() => {
        setActiveType(NavigationType.None)
        setActiveId(null)
        setActiveExecutionId(null)
    }, [activeType, activeId])

    const changeExecution = useCallback((id: string) => {
        setActiveExecutionId(id)
    }, [activeExecutionId])

    const clearExecution = useCallback(() => {
        setActiveExecutionId(null)
    }, [activeExecutionId])

    const changeShowNavigation = useCallback((onOff: boolean) => setShowNavigation(onOff), [])

    console.log(`Navigation ID: ${activeId}`)

    const value = useMemo(
        () => ({
            activeType, activeId, activeExecutionId, showNavigation,
            changeActive, clearActive, changeExecution, clearExecution, changeShowNavigation,
        }),
        [activeType, activeId, activeExecutionId, showNavigation,
            changeActive, clearActive, changeExecution, clearExecution, changeShowNavigation,]
    )

    return <NavigationStateContext.Provider value={value}>{children}</NavigationStateContext.Provider>
}
