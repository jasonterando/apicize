import { createContext, useContext } from "react";

export type FeedbackStore = {
    toast: (message: string, severity: ToastSeverity) => void,
    confirm: (options: ConfirmationOptions) => Promise<boolean>
}

export const FeedbackContext = createContext<FeedbackStore | null>(null)

export function useFeedback() {
    const context = useContext(FeedbackContext);
    if (! context) {
        throw new Error('useFeedback must be used within a FeedbackContext.Provider');
    }
    return context;
}

export enum ToastSeverity {
    Error = 'error',
    Warning = 'warning',
    Info = 'info',
    Success = 'success'
}

export interface ConfirmationOptions {
    // catchOnCancel?: boolean,
    title?: string,
    message?: string,
    okButton?: string,
    defaultToCancel?: boolean,
    cancelButton?: string
}