import { GetTitle } from "@apicize/common"
import { WorkbookState, ToastStore, ToastContext, ToastSeverity } from "@apicize/toolkit"
import { emit, listen } from "@tauri-apps/api/event"
import { register } from "@tauri-apps/api/globalShortcut"
import { fetch } from "@tauri-apps/api/http"
import { ReactNode, useContext, useEffect, createContext } from "react"
import { Store } from "redux"

export interface RunStore {}

export const RunContext = createContext<RunStore>({})

register('CommandOrControl+Enter', async (e) => {
    emit('run')
})

export const RunProvider = (props: { store: Store<WorkbookState>, children?: ReactNode }) => {
    const toast = useContext<ToastStore>(ToastContext)

    // useEffect(() => {
    //     invoke<string>('perform_test', { 
    //         request: {
    //             query: {
    //                 foo: "bar"
    //             }
    //         }
    //     })
    //       .then(result => {
    //         console.log('test result', result)
    //         toast.open(result, ToastSeverity.Info)
    //       })
    //       .catch(console.error)
    //   })

    useEffect(() => {
        const unlistenRun = listen('run', async () => { await runActiveWorkbook() })
        return () => {
            unlistenRun.then(f => f())
        }
    })


    const runActiveWorkbook = async () => {
        const state = props.store.getState()
        const request = state.activeRequest
        if (! request) return
        try {
            const result = fetch(request.url)

            toast.open(`Completed run of ${GetTitle(request)}`, ToastSeverity.Success)
        } catch (e) {
            toast.open(`Unable to run of ${GetTitle(request)}, ${e}`, ToastSeverity.Error)
        }
    }

    return (
        <>
            <RunContext.Provider value={{ }}>
                {props.children}
            </RunContext.Provider>
        </>
    )
}
