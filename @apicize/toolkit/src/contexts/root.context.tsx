import { createContext, ReactNode, useContext } from 'react'
import { RootStore } from '../stores/root.store';

const RootContext = createContext<RootStore | null>(null)

export function useWorkspace() {
    const context = useContext(RootContext);
    if (! context) {
        throw new Error('useWorkspace must be used within a RootProvider');
    }
    return context.workspace;
}

export function useWindow() {
    const context = useContext(RootContext);
    if (! context) {
        throw new Error('useWindow must be used within a RootProvider');
    }
    return context.window;
}

export function useExecution() {
    const context = useContext(RootContext)
    if (! context) {
        throw new Error('useExecution must be used within a RootProvider');
    }
    return context.execution
}

export const RootProvider = ({ children }: { children: ReactNode }) => {
    return <RootContext.Provider value={new RootStore()}> {children}</RootContext.Provider>
}
