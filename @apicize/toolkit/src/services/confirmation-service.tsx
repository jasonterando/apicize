import React from "react";
import { ConfirmationDialog, ConfirmationOptions } from "../dialogs/confirm-dialog";

const ConfirmationServiceContext = React.createContext<(options: ConfirmationOptions) =>
    Promise<boolean>>(Promise.reject)

export const useConfirmation = () => React.useContext(ConfirmationServiceContext);

export const ConfirmationServiceProvider = ({children}: any) => {

    const [confirmationState, setConfirmationState] = React.useState<ConfirmationOptions | null>(null)
    const [open, setOpen] = React.useState<boolean>(false);
    const awaitingPromiseRef = React.useRef<{ 
        resolve: (ok: boolean) => void; 
        reject: () => void; 
    }>();

    const openConfirmation = (options: ConfirmationOptions) => {
        setConfirmationState(options)
        setOpen(true)
        return new Promise<boolean>((resolve, reject) => {
            awaitingPromiseRef.current = { resolve, reject }
        })
    }

    const handleClose = () => {
        if (/*confirmationState.catchOnCancel && */awaitingPromiseRef.current) {
            awaitingPromiseRef.current.resolve(false)
        }
        setOpen(false)
    }

    const handleSubmit = () => {
        if (awaitingPromiseRef.current) {
            awaitingPromiseRef.current.resolve(true)
        }
        setOpen(false)
    }

    const handleClosed = () => {
        setConfirmationState(null)
        setOpen(false)
    }

    return (
        <>
            <ConfirmationServiceContext.Provider 
                value={openConfirmation} 
                children={children} />
            <ConfirmationDialog 
                open={open}
                onSubmit={handleSubmit}
                onClose={handleClose}
                onClosed={handleClosed}
                {...confirmationState} 
            />
        </>
    )
}
