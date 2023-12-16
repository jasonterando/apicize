import React, { ReactNode, SetStateAction, createContext, useState } from "react";
import { createSelectorHook, useSelector, useStore } from "react-redux";
import { PayloadAction, configureStore, createSlice } from '@reduxjs/toolkit'
import { ToastSeverity } from "../controls/toast";
import { Alert, Snackbar } from "@mui/material";

interface ToastContent {
    message: string,
    severity: ToastSeverity
}

const initialState = {
    open: false,
    message: '',
    severity: ToastSeverity.Info
}

export interface ToastStore {
    open: (message: string, severity: ToastSeverity) => void
}

export const ToastContext = createContext<ToastStore>({
    open: (message: string, severity: ToastSeverity = ToastSeverity.Info) => {}
})

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



