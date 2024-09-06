import MuiAlert, { AlertProps } from '@mui/material/Alert';
import React from 'react';
import { Snackbar } from '@mui/material';

export interface ToastOptions {
    severity: ToastSeverity
    message: string
}

interface ToastProps extends ToastOptions {
    open: boolean
    onClose: () => void
}

export const Toast: React.FC<ToastProps> = ({
    open,
    onClose,
    severity,
    message,
}) => {
    const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
        props,
        ref,
    ) {
        return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
    });

    return (
        <Snackbar open={open} autoHideDuration={6000} onClose={onClose}>
            <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
                {message}
            </Alert>
        </Snackbar>
    )
}