import { createContext, useContext } from "react";

export enum ToastSeverity {
    Error = 'error',
    Warning = 'warning',
    Info = 'info',
    Success = 'success'
}

export type ToastStore = (message: string, severity: ToastSeverity) => void

export const ToastContext = createContext<ToastStore | null>(null)

export function useToast() {
    const context = useContext(ToastContext);
    if (! context) {
        throw new Error('useToast must be used within a ToastContext.Provider');
    }
    return context;
}


