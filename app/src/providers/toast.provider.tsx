import { ToastSeverity, ToastContext } from "@apicize/toolkit"
import { Snackbar, Alert } from "@mui/material"
import { ReactNode, useState } from "react"

export function ToastProvider({ children }: { children?: ReactNode }) {
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState(ToastSeverity.Info)

    const closeToast = () => setOpen(false)

    return (
        <ToastContext.Provider value={(message: string, severity: ToastSeverity = ToastSeverity.Info) => {
            setMessage(message)
            setSeverity(severity)
            setOpen(true)
        }
        }>
            {children}
            <Snackbar open={open} autoHideDuration={6000} onClose={() => closeToast()}>
                <Alert onClose={() => closeToast()} severity={severity} sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
        </ToastContext.Provider>
    )
}