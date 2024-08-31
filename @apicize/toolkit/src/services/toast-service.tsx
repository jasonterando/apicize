import { ReactNode, createContext, useContext, useState } from "react";
import { ToastSeverity } from "../controls/toast";
import { Alert, Snackbar } from "@mui/material";

export interface ToastStore {
    open: (message: string, severity: ToastSeverity) => void
}

export const ToastContext = createContext<ToastStore>({
    open: (_message: string, _severity: ToastSeverity = ToastSeverity.Info) => {}
})

export function useToast() {
    const context = useContext(ToastContext);
    if (! context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children?: ReactNode }) {
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState(ToastSeverity.Info)

    const closeToast = () => setOpen(false)

    return (
        <ToastContext.Provider value={{
            open: (message: string, severity: ToastSeverity = ToastSeverity.Info) => {
                setMessage(message)
                setSeverity(severity)
                setOpen(true)
            }
        }}>
            {children}
            <Snackbar open={open} autoHideDuration={6000} onClose={() => closeToast()}>
                <Alert onClose={() => closeToast()} severity={severity} sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
        </ToastContext.Provider>
    )
}

