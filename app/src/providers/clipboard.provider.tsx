import { ReactNode, useRef } from "react";
import clipboard, { readText, readImageBase64, writeImageBase64, writeText } from "tauri-plugin-clipboard-api"
import { UnlistenFn } from "@tauri-apps/api/event";
import { ClipboardContext, ClipboardStore, ToastSeverity, useFeedback } from "@apicize/toolkit";

/**
 * Implementation of clipboard operations via Tauri
 */

export function ClipboardProvider({ children }: { children?: ReactNode }) {

    const unlistenToClipboard = useRef<UnlistenFn | null>(null)
    const feedback = useFeedback()

    const store = new ClipboardStore({
        onCopyText: async (text: string) => {
            try {
                await writeText(text)
                feedback.toast('Text copied to clipboard', ToastSeverity.Success)
            } catch (e) {
                feedback.toast(`${e}`, ToastSeverity.Error)
            }
        },
        onCopyImage: async (base64: string) => {
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
        onGetImage: async () => {
            return await readImageBase64()
        },
        onGetText: async () => {
            return await readText()
        }
    })

    if (unlistenToClipboard.current) {
        unlistenToClipboard.current()
        unlistenToClipboard.current = null
    }

    clipboard.onSomethingUpdate((types) => {
        store.updateClipboardStatus(
            types?.text === true,
            types?.imageBinary === true
        )
    }).then((unlisten) => {
        unlistenToClipboard.current = unlisten
    })

    return (
        <ClipboardContext.Provider value={store}>
            {children}
        </ClipboardContext.Provider>
    )
}
