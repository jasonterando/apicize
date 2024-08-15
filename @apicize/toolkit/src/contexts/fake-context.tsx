import { useState, ReactNode, createContext, useCallback, useMemo, useContext, useEffect, useRef } from "react";
import { NavigationType } from "../models/store";
import { useNavigationState } from "./navigation-state-context";

interface FakeContextType {
    id: string,
    type: NavigationType,
    counter: number,
    increment: () => void,
}

const FakeContext = createContext<FakeContextType | undefined>(undefined)

export function useFake() {
    const context = useContext(FakeContext);
    if (context === undefined) {
        throw new Error('useFake must be used within a FakeProvider');
    }
    return context;
}

export const FakeProvider = ({ children }: { children: ReactNode }) => {

    const navState = useNavigationState()

    const [id] = useState(navState.activeId ?? '(None)')
    const [type] = useState(navState.activeType ?? '(None)')
    const [counter, setCounter] = useState(0)

    console.log(`Fake Provider ID: ${navState.activeId}`)

    // const value = { id: navState.activeId ?? '(None)', type: navState.activeType ?? '(None)' }
    const increment = () => {
        // useCallback(() => {
        setCounter(counter + 1)
        // }, [counter])
    }
    const value = { id, type, counter, increment }
    // const value = useMemo(() => ({ id: navState.activeId ?? "(none)", type, counter, increment }),
    //     [id, type, counter, increment])

    return <FakeContext.Provider value={value}>
        {children}
    </FakeContext.Provider>
}
