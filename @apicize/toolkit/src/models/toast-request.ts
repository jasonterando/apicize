export enum ToastSeverity {
    Error = 'error',
    Warning = 'warning',
    Info = 'info',
    Success = 'success'
}

export interface ToastRequest {
    severity: ToastSeverity
    message: string
}