import { ConfirmationDialog } from "../controls/confirmation-dialog"
import { ConfirmationOptions, FeedbackContext, ToastSeverity } from "@apicize/toolkit"
import { Snackbar, Alert } from "@mui/material"
import React from "react"
import { ReactNode, useState } from "react"

export function FeedbackProvider({ children }: { children?: ReactNode }) {
    const [toastOpen, setToastOpen] = useState(false)
    const [toastMessage, setToastMessage] = useState('')
    const [toastSeverity, setToastSeverity] = useState(ToastSeverity.Info)

    const closeToast = () => setToastOpen(false)

    const toast = (message: string, severity: ToastSeverity = ToastSeverity.Info) => {
        setToastMessage(message)
        setToastSeverity(severity)
        setToastOpen(true)
    }

    const [confirmationState, setConfirmationState] = React.useState<ConfirmationOptions | null>(null)
    const [confirmOpen, setConfirmOpen] = React.useState<boolean>(false);
    const awaitingPromiseRef = React.useRef<{
        resolve: (ok: boolean) => void;
        reject: () => void;
    }>();

    const confirm = (options: ConfirmationOptions) => {
        setConfirmationState(options)
        setConfirmOpen(true)
        return new Promise<boolean>((resolve, reject) => {
            awaitingPromiseRef.current = { resolve, reject }
        })
    }

    const handleClose = () => {
        if (/*confirmationState.catchOnCancel && */awaitingPromiseRef.current) {
            awaitingPromiseRef.current.resolve(false)
        }
        setConfirmOpen(false)
    }

    const handleSubmit = () => {
        if (awaitingPromiseRef.current) {
            awaitingPromiseRef.current.resolve(true)
        }
        setConfirmOpen(false)
    }

    const handleClosed = () => {
        setConfirmationState(null)
        setConfirmOpen(false)
    }
    
    return (
        <FeedbackContext.Provider value={{ toast, confirm }}>
            {children}
            <Snackbar open={toastOpen} autoHideDuration={6000} onClose={() => closeToast()}>
                <Alert onClose={() => closeToast()} severity={toastSeverity} sx={{ width: '100%' }}>
                    {toastMessage}
                </Alert>
            </Snackbar>
            <ConfirmationDialog
                open={confirmOpen}
                onSubmit={handleSubmit}
                onClose={handleClose}
                onClosed={handleClosed}
                {...confirmationState}
            />
        </FeedbackContext.Provider>
    )
}