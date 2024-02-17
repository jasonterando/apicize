"use client"

import { ReactNode, createContext, useContext, useEffect, useRef } from "react"
import { ToastContext, ToastStore, initializeWorkbook, ToastSeverity, WorkbookState, saveWorkbook, workbookStore, setRequestRunning, setRequestResults, workbookToStateStorage, stateStorageToWorkbook, stateStorageToRequestEntry } from "@apicize/toolkit"
import { useDispatch, useSelector } from 'react-redux'
import { useConfirmation } from "@apicize/toolkit/dist/services/confirmation-service"
import { Settings, StoredWorkbook, ApicizeRequest, ApicizeResponse, ApicizeTestResult, NO_AUTHORIZATION, WorkbookRequest, WorkbookRequestGroup } from "@apicize/common"
import { register } from "@tauri-apps/plugin-global-shortcut"
import { emit, listen } from "@tauri-apps/api/event"
import { writeTextFile } from "@tauri-apps/plugin-fs"
import { ApicizeResult, ApicizeResults } from "@apicize/common/dist/models/lib/apicize-result"
import { noAuthorization, noScenario } from "@apicize/toolkit/dist/models/store"
// import { writeImage, writeText } from "tauri-plugin-clipboard-api"

export interface WorkbookServiceStore { }
export const WorkbookContext = createContext<WorkbookServiceStore>({})

// export type TriggerEvent = (name: string, data?: any) => void

export const registerKeyboardShortcuts = () => {
    register('CommandOrControl+N', async (e) => {
        emit('new')
    })

    register('CommandOrControl+O', async (e) => {
        emit('open')
    })

    register('CommandOrControl+S', async (e) => {
        emit('save')
    })

    register('CommandOrControl+Shift+S', async (e) => {
        emit('saveAs')
    })

    register('CommandOrControl+R', async (e) => {
        emit('run')
    })
}

export const WorkbookProvider = (props: {
    children?: ReactNode
}) => {

    let dispatch = useDispatch()
    const confirm = useConfirmation()
    const toast = useContext<ToastStore>(ToastContext)

    const dirty = useSelector((state: WorkbookState) => state.dirty)

    const workbookFullName = useSelector((state: WorkbookState) => state.workbookFullName)
    const workbookDisplayName = useSelector((state: WorkbookState) => state.workbookDisplayName)
    
    const activeRequest = useSelector((state: WorkbookState) => state.activeRequestEntry)
    const activeAuthorization = useSelector((state: WorkbookState) => state.activeAuthorization)
    const selectedAuthorization = useSelector((state: WorkbookState) => state.selectedAuthorization)
    const selectedScenario = useSelector((state: WorkbookState) => state.selectedScenario)

    let _settingsFileName = useRef('')
    let _settings = useRef<Settings | undefined>()
    let _loaded = useRef(false)

    let _core: typeof import('@tauri-apps/api/core') | undefined
    const getTauriApiCore = async () => {
        if (_core) return _core
        _core = await import('@tauri-apps/api/core')
        return _core
    }

    let _path: typeof import('@tauri-apps/api/path') | undefined
    const getTauriPath = async () => {
        if (_path) return _path
        _path = await import('@tauri-apps/api/path')
        return _path
    }

    let _dialog: typeof import('@tauri-apps/plugin-dialog') | undefined
    const getTauriDialog = async () => {
        if (_dialog) return _dialog
        _dialog = await import('@tauri-apps/plugin-dialog')
        return _dialog
    }

    useEffect(() => {
        if (! _loaded.current) {
            _loaded.current = true;
            (async () => {
                try {
                    let settings = await loadSettings()
                    if ((settings?.lastWorkbookFileName?.length ?? 0) > 0) {
                        await doOpenWorkbook(settings.lastWorkbookFileName)
                    }
                } catch(e) {
                    toast.open(`${e}`, ToastSeverity.Error)
                }
            })()
        }

        const unlistenNew = listen('new', async () => { await doNewWorkbook() })
        const unlistenOpen = listen('open', async () => { await doOpenWorkbook() })
        const unlistenSave = listen('save', async () => { await doWorkbookSave() })
        const unlistenSaveAs = listen('saveAs', async () => { await doSaveWorkbookAs() })
        const unlistenRun = listen('run', async () => { await doRunRequest() })
        const unlistenCancel = listen('cancel', async () => { await doCancelRequest() })
        const unlistenClearToken = listen('clearToken', async () => { await doClearToken() })
        const unlistenCopyTextToClipboard = listen<string | undefined>('copyText', async(event) => { 
            await doCopyTextToClipboard(event.payload) 
        })
        const unlistenCopyImageToClipboard = listen<string | undefined>('copyImage', async(event) => { 
            await doCopyImageToClipboard(event.payload) 
        })

        return () => {
            unlistenNew.then(f => f())
            unlistenOpen.then(f => f())
            unlistenSave.then(f => f())
            unlistenSaveAs.then(f => f())
            unlistenRun.then(f => f())
            unlistenCancel.then(f => f())
            unlistenClearToken.then(f => f())
            unlistenCopyTextToClipboard.then(f => f())
            unlistenCopyImageToClipboard.then(f => f())
        }
    })

    // Keep track of the current window
    var _window = useRef<typeof import('@tauri-apps/api/window') | undefined>()
    const getTauriWindow = async () => {
        if (! _window.current) {
            _window.current = await import('@tauri-apps/api/window')
        }
        return _window.current
    }
    
    // Called by provider when opened workbook is opened or saved
    useEffect(() => {
        (async () => {
            const window = await getTauriWindow()
            window.getCurrent().setTitle(((workbookDisplayName?.length ?? 0) > 0 )
                ? `Apicize - ${workbookDisplayName}`
                : 'Apicize (New Workbook)')
        })()
    }, [workbookDisplayName])

    // Triggers the start of a new workbook
    const doNewWorkbook = async () => {
        if (dirty) {
            if (! await confirm({
                title: 'New Workbook',
                message: 'Are you sure you want to create a new workbook without saving changes?',
                okButton: 'Yes',
                cancelButton: 'No',
                defaultToCancel: true
            })) {
                return
            }
        }

        dispatch(initializeWorkbook({
            displayName: '',
            fullName: '',
            requests: { entities: {}, topLevelIDs: [] },
            authorizations: { entities: {}, topLevelIDs: [] },
            scenarios: { entities: {}, topLevelIDs: [] },
            selectedAuthorization: undefined,
            selectedScenario: undefined,
        }))

        toast.open('Created New Workbook', ToastSeverity.Success)
    }

    // Triggers opening a workbook
    const doOpenWorkbook = async (fileName?: string) => {
        const path = await getTauriPath()
        const dialog = await getTauriDialog()

        const settings = await loadSettings()

        if (dirty) {
            if (! await confirm({
                title: 'Open Workbook',
                message: 'Are you sure you want to open a workbook without saving changes?',
                okButton: 'Yes',
                cancelButton: 'No',
                defaultToCancel: true
            })) {
                return
            }
        }

        if ((fileName?.length ?? 0) === 0) {
            const selected = (await dialog.open({
                multiple: false,
                title: 'Open Apicize Workbook',
                defaultPath: settings?.workbookDirectory,
                directory: false,
                filters: [{
                    name: 'All Files',
                    extensions: ['json']
                }]
            })) as any
            if (selected) fileName = selected['path']
        }


        if (!fileName) return

        const core = await getTauriApiCore()
        try {
            const data: StoredWorkbook = await core.invoke('open_workbook', { path: fileName })
            const results = workbookToStateStorage(data)
            dispatch(initializeWorkbook({
                displayName: await path.basename(fileName),
                fullName: fileName,
                requests: results.requests,
                authorizations: results.authorizations,
                scenarios: results.scenarios,
                selectedAuthorization: results.selectedAuthorization,
                selectedScenario: results.selectedScenario
            }))

            updateSettings({ lastWorkbookFileName: fileName })
            toast.open(`Opened ${fileName}`, ToastSeverity.Success)
        } catch (e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
    }

    const doWorkbookSave = async () => {
        try {
            if (! (workbookFullName && workbookFullName.length > 0)) {
                return
            }
            const core = await getTauriApiCore()
            const path = await getTauriPath()

            const state = workbookStore.getState()
            const workbook = stateStorageToWorkbook(
                state.requests,
                state.authorizations,
                state.scenarios,
                state.selectedAuthorization,
                state.selectedScenario,
            )

            await core.invoke('save_workbook', { workbook, path: workbookFullName })

            await updateSettings({ lastWorkbookFileName: workbookFullName })
            toast.open(`Saved ${workbookFullName}`, ToastSeverity.Success)
            dispatch(saveWorkbook({
                fullName: workbookFullName,
                displayName: await path.basename(workbookFullName, '.json')
            }))
        } catch (e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
    }

    const doSaveWorkbookAs = async () => {
        try {
            const core = await getTauriApiCore()
            const dialog = await getTauriDialog()
            const path = await getTauriPath()
            const settings = await loadSettings()

            const fileName = await dialog.save({
                title: 'Save Apicize Workbook',
                defaultPath: workbookFullName ?? settings.workbookDirectory,
                filters: [{
                    name: 'All Files',
                    extensions: ['json']
                }]
            })

            if ((typeof fileName !== 'string') || ((fileName?.length ?? 0) === 0)) {
                return
            }

            // Not sure how "kosher" calling getState is here, but it seems to work...
            const state = workbookStore.getState()
            const workbook = stateStorageToWorkbook(
                state.requests,
                state.authorizations,
                state.scenarios,
                state.selectedAuthorization,
                state.selectedScenario,
            )

            await core.invoke('save_workbook', { workbook, path: fileName })
            await updateSettings({ lastWorkbookFileName: fileName })
            toast.open(`Saved ${fileName}`, ToastSeverity.Success)
            dispatch(saveWorkbook({
                fullName: fileName,
                displayName: await path.basename(fileName, '.json')
            }))
        } catch (e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
    }

    const doRunRequest = async () => {
        if (! activeRequest) {
            return
        }
        let id = activeRequest.id
        // toast.open(`Executing id ${entry.name}`, ToastSeverity.Info)

        const state = workbookStore.getState()
        const request = stateStorageToRequestEntry(activeRequest.id, state.requests)

        try {
            const core = await getTauriApiCore()
            dispatch(setRequestRunning({
                id,
                onOff: true
            }))
            let results = await core.invoke<ApicizeResult[][]>
                ('run_request', { 
                    request,
                    authorization: selectedAuthorization == noAuthorization ? undefined : selectedAuthorization,
                    scenario: selectedScenario == noScenario ? undefined : selectedScenario })
            
            dispatch(setRequestResults({id, results}))
        } catch (e) {
            toast.open(`${e}`, ToastSeverity.Error)
            dispatch(setRequestRunning({
                id,
                onOff: false
            }))
        }
    }

    const doCancelRequest = async () => {
        if (! activeRequest) return
        const id = activeRequest.id
        try {
            const core = await getTauriApiCore()
            await core.invoke('cancel_request', {
                request: activeRequest
            })
        } catch (e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
    }

    const doClearToken = async () => {
        if(! activeAuthorization) return
        try {
            const core = await getTauriApiCore()
            await core.invoke('clear_cached_authorization', {
                authorization: activeAuthorization
            })
            toast.open('Tokens cleared', ToastSeverity.Success)
        } catch (e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
    }

    const doCopyImageToClipboard = async (base64?: string) => {
        try {
            throw new Error('Not supported yet!')
            // if(base64 && (base64.length > 0)) {
            //     await writeImage(base64)
            //     toast.open('Image copied to clipboard', ToastSeverity.Success)
            // }
        } catch(e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
    }

    const doCopyTextToClipboard = async (text?: string) => {
        try {
            throw new Error('Not supported yet!')
            // if (text && (text.length ?? 0) > 0) {
            //     await writeText(text)
            //     toast.open('Text copied to clipboard', ToastSeverity.Success)
            // }
        } catch(e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
    }

    const loadSettings = async () => {
        if (_settings.current) return _settings.current

        let path = await import('@tauri-apps/api/path')
        let fs = await import('@tauri-apps/plugin-fs')

        let settings: Settings | undefined
        const configDirectory = await path.appConfigDir()
        const settingsFileName = await path.join(configDirectory, 'settings.json')

        if (await fs.exists(settingsFileName)) {
            try {
                const settingsData = await fs.readTextFile(settingsFileName)
                let parsedSettings = JSON.parse(settingsData) as Settings
                if ((parsedSettings?.workbookDirectory?.length ?? 0) === 0) {
                    throw new Error('Workbook directory setting not defined')
                }
                if (! await fs.exists(parsedSettings.workbookDirectory)) {
                    throw new Error(`Invalid workbook directory ${parsedSettings.workbookDirectory} stored in settings`)
                }
                // Ensure the last workbook file name actually exists
                if (parsedSettings.lastWorkbookFileName && (! await fs.exists(parsedSettings.lastWorkbookFileName))) {
                    parsedSettings.lastWorkbookFileName = undefined
                }
                // TODO - read last workbook here?
                settings = parsedSettings
            } catch (e) {
                console.error(`Unable to read ${settingsFileName} - ${e}`)
            }
        }

        if (!settings) {
            settings = {
                workbookDirectory: await path.appDataDir()
            }
        }

        _settings.current = settings
        _settingsFileName.current = settingsFileName
        return _settings.current
    }

    const updateSettings = async (updates: {
        workbookDirectory?: string,
        lastWorkbookFileName?: string
    }) => {
        _settings.current = await loadSettings()
        if (updates.workbookDirectory !== undefined) {
            _settings.current.workbookDirectory = updates.workbookDirectory
        }
        if (updates.lastWorkbookFileName !== undefined) {
            _settings.current.lastWorkbookFileName = updates.lastWorkbookFileName
        }

        await writeTextFile(_settingsFileName.current, JSON.stringify(_settings.current))
    }

    return (
        <>
            {props.children}
        </>
    )
}
