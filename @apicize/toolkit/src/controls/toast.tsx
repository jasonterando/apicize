import { useSelector } from 'react-redux'
import { RootState } from "../models/store";
import { useEffect, useState } from 'react';
import { ToastSeverity } from '../models/toast-request';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import React from 'react';
import { Snackbar } from '@mui/material';

export function Toast() {
    const [open, setOpen] = useState<boolean>(false)
    const [message, setMessage] = useState<string>('')
    const [severity, setSeverity] = useState<ToastSeverity>(ToastSeverity.Info)

    const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
        props,
        ref,
    ) {
        return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
    });

    const toastRequest = useSelector((state: RootState) => state.toast)
    useEffect(() => {
        if (!toastRequest) return
        setMessage(toastRequest.message)
        setSeverity(toastRequest.severity)
        setOpen(true)
    }, [toastRequest])

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    return (
        <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
            <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
                {message}
            </Alert>
        </Snackbar>
    )
}