import { makeObservable, observable } from 'mobx';
import { createContext, useContext } from 'react'

export class ClipboardStore {
    @observable accessor hasText: boolean = false
    @observable accessor hasImage: boolean = false

    constructor(private readonly callbacks: {
        onCopyText: (text: string) => Promise<void>,
        onCopyImage: (base64: string) => Promise<void>
    }) {
        makeObservable(this)
    }

    async copyTextToClipboard(text: string): Promise<void> {
        await this.callbacks.onCopyText(text)
    }
    async copyImageToClipboard(base64: string): Promise<void> {
        await this.callbacks.onCopyImage(base64)
    }
}

export const ClipboardContext = createContext<ClipboardStore | null>(null)

export function useClipboard() {
    const context = useContext(ClipboardContext);
    if (! context) {
        throw new Error('useClipboard must be used within a ClipboardContext.Provider');
    }
    return context;
}

