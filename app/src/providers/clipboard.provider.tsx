import { ReactNode, useEffect, useRef } from "react";
import { IMAGE_CHANGED, TEXT_CHANGED, hasImage, hasText, readText, readImageBase64, writeImageBase64, writeText, startListening, onClipboardUpdate } from "tauri-plugin-clipboard-api"
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { ClipboardContext, ClipboardStore, ToastSeverity, useFeedback } from "@apicize/toolkit";

/**
 * Implementation of clipboard operations via Tauri
 */
export function ClipboardProvider({
    children
}: {
    children?: ReactNode
}) {

    const unlistenToClipboard = useRef<UnlistenFn | null>(null)
    // const unlistenToClipboardText = useRef<UnlistenFn | null>(null)
    // const unlistenToClipboardImage = useRef<UnlistenFn | null>(null)

    const feedback = useFeedback()

    const store = new ClipboardStore({
        onWriteText: async (text: string) => {
            try {
                await writeText(text)
                feedback.toast('Text copied to clipboard', ToastSeverity.Success)
            } catch (e) {
                feedback.toast(`${e}`, ToastSeverity.Error)
            }
        },
        onWriteImage: async (base64: string) => {
            try {
                const m = base64.length % 4
                if (m) {
                    base64 += '==='.substring(0, 4 - m)
                }
                await writeImageBase64(base64)
                feedback.toast('Image copied to clipboard', ToastSeverity.Success)
            } catch (e) {
                feedback.toast(`${e}`, ToastSeverity.Error)
            }
        },
        onGetText: () => {
            return readText()
        },
        onGetImage: () => {
            return readImageBase64()
        },
    })

    // if (unlistenToClipboard.current) {
    //     unlistenToClipboard.current()
    //     unlistenToClipboard.current = null
    // }

    // if (unlistenToClipboardText.current) {
    //     unlistenToClipboardText.current()
    //     unlistenToClipboardText.current = null
    // }

    // if (unlistenToClipboardImage.current) {
    //     unlistenToClipboardImage.current()
    //     unlistenToClipboardImage.current = null
    // }

    useEffect(() => {
        const updateClipboardState = async () => {
            const text = await hasText()
            const image = await hasImage()
            console.log(`onClipboardUpdate text: ${text}, image: ${image}`)
            store.updateClipboardTextStatus(text)
            store.updateClipboardImageStatus(false)
            if (image) {
                const tryReadImage = (attempt: number) => {
                    console.log(`tryReadImage attempt #${attempt}`)
                    readImageBase64()
                        .then(() => store.updateClipboardTextStatus(true))
                        .catch(() => {
                            if (attempt < 30) setTimeout(() => tryReadImage(attempt + 1), 100)
                        })
                }
                tryReadImage(0)
            }
        }
    
        onClipboardUpdate(updateClipboardState)
        updateClipboardState()
    
    }, [store])

    return (
        <ClipboardContext.Provider value={store}>
            {children}
        </ClipboardContext.Provider>
    )
}
