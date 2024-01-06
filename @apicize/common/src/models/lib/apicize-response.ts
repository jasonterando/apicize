export interface ApicizeResponse {
    status: number
    statusText: string
    headers?: {[name: string]: string }
    text?: string
    data?: string
    logs?: string
}