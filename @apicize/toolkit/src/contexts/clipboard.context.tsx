import { action, makeObservable, observable } from 'mobx';
import { createContext, useContext } from 'react'

export class ClipboardStore {
    @observable accessor hasText: boolean = false
    @observable accessor hasImage: boolean = false

    constructor(private readonly callbacks: {
        onCopyText: (text: string) => Promise<void>,
        onCopyImage: (base64: string) => Promise<void>,
        onGetText: () => Promise<string>,
        onGetImage: () => Promise<string>,
    }) {
        makeObservable(this)
    }

    copyTextToClipboard(text: string): Promise<void> {
        return this.callbacks.onCopyText(text)
    }
    
    copyImageToClipboard(base64: string): Promise<void> {
        return this.callbacks.onCopyImage(base64)
    }

    getClipboardText() {
        return this.callbacks.onGetText()
    }

    getClipboardImage() {
        return this.callbacks.onGetImage()
    }

    @action
    updateClipboardStatus(hasText: boolean, hasImage: boolean) {
        this.hasText = hasText
        this.hasImage = hasImage
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

export enum ClipboardContentType {
    Text,
    Image,
  }
  