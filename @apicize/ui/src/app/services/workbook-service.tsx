import { ReactNode, createContext, useContext } from "react"
import { ToastContext, ToastStore, initializeState, ToastSeverity } from "@apicize/toolkit"
import { open } from '@tauri-apps/api/dialog'
import { appDataDir, basename } from '@tauri-apps/api/path'
import { useDispatch } from 'react-redux'
import { StoredWorkbook } from "@apicize/definitions"
import { readTextFile } from "@tauri-apps/api/fs"
import { register } from "@tauri-apps/api/globalShortcut"

let _dataDirectory: string | undefined = undefined
const getDataDirectory = async (): Promise<string> => {
    if (!_dataDirectory) {
        _dataDirectory = await appDataDir()
    }
    return _dataDirectory
}
export interface WorkbookServiceStore {
    open: (fileName?: string) => void
}

export const WorkbookServiceContext = createContext<WorkbookServiceStore>({
    open: () => {}
})

export const WorkbookServiceProvider = ({ children }: { children?: ReactNode }) => {
    const dispatch = useDispatch()
    const toastContext = useContext<ToastStore>(ToastContext)

    register('CommandOrControl+O', async (e) => {
        openWorkbook()
    })

    const openWorkbook = async (fileName?: string) => {
        if ((fileName?.length ?? 0) === 0) {
            const selected = await open({
                multiple: false,
                title: 'Open Apicize Workbook',
                defaultPath: await getDataDirectory(),
                directory: false,
                filters: [{
                    name: 'All Files',
                    extensions: ['json']
                }]
            })
            if (typeof selected === 'string') fileName = selected
        }

        if (!fileName) return

        try {
            const results = JSON.parse(await readTextFile(fileName)) as unknown as StoredWorkbook

            // Cursory validation
            if (!(
                typeof results.requests == 'object'
                && typeof results.authorizations == 'object'
                && typeof results.environments == 'object'
                && results.version == 1.0
            )) {
                throw new Error('File does not apear to contain a valid workbook')
            }

            // Make sure IDs are saved in each entity
            for (const [id, request] of Object.entries(results.requests.entities)) {
                request.id = id
            }
            for (const [id, auth] of Object.entries(results.authorizations.entities)) {
                auth.id = id
            }
            for (const [id, env] of Object.entries(results.environments.entities)) {
                env.id = id
            }

            dispatch(initializeState({
                displayName: await basename(fileName),
                fullName: fileName,
                requests: results.requests,
                authorizations: results.authorizations,
                environments: results.environments
            }))

            toastContext.open(`Opened ${fileName}`, ToastSeverity.Success)
        } catch (e) {
            toastContext.open(`${e}`, ToastSeverity.Error)
        }
    }

    return (
        <>
            <WorkbookServiceContext.Provider value={{open: openWorkbook}}>
                {children}
            </WorkbookServiceContext.Provider>
        </>
    )
}
