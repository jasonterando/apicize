import { ReactNode, useRef } from "react";
import clipboard, { writeImageBase64, writeText } from "tauri-plugin-clipboard-api"
import { UnlistenFn } from "@tauri-apps/api/event";
import { observable, action, makeObservable } from "mobx";
import { ClipboardContext, ClipboardStore, ToastSeverity, useToast } from "@apicize/toolkit";

/**
 * Implementation of clipboard interface via Tauri
 */
// export class ClipboardTauriStore {
//     private static unlisten: UnlistenFn | null = null

//     @observable accessor hasText: boolean = false
//     @observable accessor hasImage: boolean = false

//     constructor() {
//         makeObservable(this)

//     }

//     async copyTextToClipboard(text: string) {
//         // const toast = useToast()
//         try {
//             await writeText(text)
//             // toast.open('Text copied to clipboard', ToastSeverity.Success)
//         } catch (e) {
//             // toast.open(`${e}`, ToastSeverity.Error)
//         }

//     }

//     async copyImageToClipboard(base64: string) {
//         // const toast = useToast()
//         try {
//             const m = base64.length % 4
//             if (m) {
//                 base64 += '==='.substring(0, 4 - m)
//             }
//             await writeImageBase64(base64)
//             // toast.open('Image copied to clipboard', ToastSeverity.Success)
//         } catch (e) {
//             // toast.open(`${e}`, ToastSeverity.Error)
//         }
//     }
// }


export function ClipboardProvider({ children }: { children?: ReactNode }) {

    const unlistenToClipboard = useRef<UnlistenFn | null>(null)
    const toast = useToast()



    const store = new ClipboardStore({
        onCopyText: async (text: string) => {
            try {
                await writeText(text)
                toast('Text copied to clipboard', ToastSeverity.Success)
            } catch (e) {
                toast(`${e}`, ToastSeverity.Error)
            }
        },
        onCopyImage: async (base64: string) => {
            try {
                const m = base64.length % 4
                if (m) {
                    base64 += '==='.substring(0, 4 - m)
                }
                await writeImageBase64(base64)
                toast('Image copied to clipboard', ToastSeverity.Success)
            } catch (e) {
                toast(`${e}`, ToastSeverity.Error)
            }
        }
    })

    if (unlistenToClipboard.current) {
        unlistenToClipboard.current()
        unlistenToClipboard.current = null
    }

    clipboard.startListening().then(async () => {
        unlistenToClipboard.current = await clipboard.onSomethingUpdate((types) => {
            action(() => {
                store.hasText = types?.text === true
                store.hasImage = types?.imageBinary === true
            })
        })
    })

    return (
        <ClipboardContext.Provider value={store}>
            {children}
        </ClipboardContext.Provider>
    )
}
