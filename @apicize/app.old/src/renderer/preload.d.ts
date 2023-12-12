import api from '../main/preload'

declare global {
    interface Window {
        apicize: typeof api
    }

}

export { };