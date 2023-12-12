import React, { ReactNode } from "react";
import { Toast, ToastOptions } from "../controls/toast";

const ToastServiceContext = React.createContext<(request: ToastOptions) =>
    Promise<void>>(Promise.reject)

export const useToast = () => React.useContext(ToastServiceContext);

export const ToastServiceProvider = ({children}: any) => {

    const [toastOptions, setToastOptions] = React.useState<ToastOptions | null>(null)
    const [open, setOpen] = React.useState<boolean>(false);
    const awaitingPromiseRef = React.useRef<{ 
        resolve: () => void; 
        reject: () => void; 
    }>();

    const showToast = (options: ToastOptions) => {
        setToastOptions(options)
        setOpen(true)
        return new Promise<void>((resolve, reject) => {
            awaitingPromiseRef.current = { resolve, reject }
        })
    }

    const handleClose = () => {
        setOpen(false)
    }

    if(! toastOptions) return (
        <ToastServiceContext.Provider 
        value={showToast} 
        children={children} />
    )

    return (
        <>
            <ToastServiceContext.Provider 
                value={showToast} 
                children={children} />
            <Toast
                open={open}
                onClose={handleClose}
                {...toastOptions}
            />
        </>
    )
}
