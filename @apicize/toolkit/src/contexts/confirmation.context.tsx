import React, { useContext } from "react";

export interface ConfirmationOptions {
    // catchOnCancel?: boolean,
    title?: string,
    message?: string,
    okButton?: string,
    defaultToCancel?: boolean,
    cancelButton?: string
}

export type ConfirmationStore = (options: ConfirmationOptions) => Promise<boolean>

export const ConfirmationContext = React.createContext<ConfirmationStore | null>(null)

export function useConfirmation() {
    const context = useContext(ConfirmationContext);
    if (! context) {
        throw new Error('useConfirmation must be used within a ConfirmationContext.Provider');
    }
    return context;
}


