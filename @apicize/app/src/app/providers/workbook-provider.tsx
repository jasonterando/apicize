"use client"

import { ReactNode, createContext, useContext, useEffect, useRef } from "react"
import { ToastContext, ToastStore, initializeWorkbook, ToastSeverity, WorkbookState, saveWorkbook, workbookStore, setRequestRunning, setRequestResults,
    workbookToStateStorage, stateStorageToWorkbook, stateStorageToRequestEntry, useConfirmation, noAuthorization, noScenario } from "@apicize/toolkit"
import { useDispatch, useSelector } from 'react-redux'
import { Settings, StoredWorkbook } from "@apicize/lib-typescript"
import { listen, Event } from "@tauri-apps/api/event"
import { writeTextFile } from "@tauri-apps/plugin-fs"
import { ApicizeResult } from "@apicize/lib-typescript/dist/models/lib/apicize-result"
import { writeText } from "@tauri-apps/plugin-clipboard-manager"
import { join } from "path"
// import { writeImage, writeText } from "tauri-plugin-clipboard-api"

export interface WorkbookServiceStore { }
export const WorkbookContext = createContext<WorkbookServiceStore>({})


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

        const unlistenAction = listen('action', async (payload: Event<string>) => { await doRouteAction(payload) })
        const unlistenCopyTextToClipboard = listen<string | undefined>('copyText', async(event) => { 
            await doCopyTextToClipboard(event.payload) 
        })
        const unlistenCopyImageToClipboard = listen<string | undefined>('copyImage', async(event) => { 
            await doCopyImageToClipboard(event.payload) 
        })

        return () => {
            unlistenAction.then(f => f())
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

    
    const doRouteAction = async (event: Event<string>) => {
        switch(event.payload) {
            case 'new':
                await doNewWorkbook()
                break
            case 'open':
                await doOpenWorkbook()
                break
            case 'save':
                await doSaveWorkbook()
                break
            case 'saveAs':
                await doSaveWorkbookAs()
                break
            case 'run':
                await doRunRequest()
                break
            case 'cancel':
                await doCancelRequest()
                break
            case 'clearToken':
                await doClearToken()
                break
            default:
                console.warn(`Invalid action: ${event.payload}`)
        }
    }
    
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

    const doSaveWorkbook = async () => {
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
            if (text && (text.length ?? 0) > 0) {
                await writeText(text)
                toast.open('Text copied to clipboard', ToastSeverity.Success)
            }
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
            const workbookDirectory = await path.appDataDir()
            const lastWorkbookFileName = join(workbookDirectory, 'demo.json')
            if (! await fs.exists(lastWorkbookFileName)) {
                await fs.writeTextFile(lastWorkbookFileName, `{"version":1.0,"requests":[{"id":"c9c0301b-c9d7-4acd-8026-c513c9e1c206","name":"Google Landing Page","test":"describe('status', () => {\\n  it('equals 200', () => {\\n    expect(response.status).to.equal(200)\\n  })\\n})\\n","url":"https://www.google.com","method":"GET","headers":[{"name":"aaa","value":"1234"}]},{"id":"baa599ee-7a7c-4dce-9cda-b23e546c2d14","name":"Star Wars Images","children":[{"id":"d539a33a-82c4-4239-8162-05c2bcfd1eac","name":"Image #1","test":"describe('status', () => {\\n  it('equals 200', () => {\\n    expect(response.status).to.equal(200)\\n  })\\n})\\n\\ndescribe('content-type', () => {\\n  it('indicates JPEG', () => {\\n    console.log('Testing ext')\\n    expect(response.headers['content-type']).to.equal('image/jpeg')\\n  })\\n})","url":"https://lumiere-a.akamaihd.net/v1/images/{{image-1}}.jpeg","method":"GET","timeout":5000,"headers":[{"name":"x-test","value":"12345"}]},{"id":"dcc00429-3dc0-4ac9-bdc4-a5a0d8792a4b","name":"Image #2","test":"describe('status', () => {\\n   it('equals 200', () => {\\n      expect(response.status).to.equal(200)\\n   })\\n})","url":"https://lumiere-a.akamaihd.net/v1/images/{{image-2}}.jpeg","method":"GET","timeout":5000}],"runs":1},{"id":"b9dfa3f5-af50-4343-9cb8-26c547ea9369","name":"Small JSON data set","test":"describe('status', () => {\\n  it('equals 200', () => {\\n    expect(response.status).to.equal(200)\\n  })\\n})","url":"http://ip-api.com/json/54.148.84.95","method":"GET","timeout":4995},{"id":"289c5193-c66d-46ed-9ce0-488b4a787efd","name":"Huge JSON data set","url":"https://data.wa.gov/api/views/f6w7-q2d2/rows.json","method":"GET"}],"authorizations":[{"type":"Basic","id":"c3b8dd9b-a149-4a2c-a40f-a9f827b11d09","name":"Sample Basic","username":"test","password":"test"},{"type":"ApiKey","id":"cbcaa934-6fe6-47f7-b0fe-ef1db66f5baf","name":"Sample API Key","header":"x-api-key","value":"abcdef"}],"scenarios":[{"id":"c18bebab-4fbe-414b-ab1a-e052d7fc3608","name":"Sith","variables":[{"name":"image-1","value":"darth-vader-main_4560aff7"},{"name":"image-2","value":"image_55f96135"}]},{"id":"b8a39cd4-89f1-424d-a3a1-0da4294234f1","name":"Jedi","variables":[{"name":"image-1","value":"obi-wan-kenobi-main_3286c63c"},{"name":"image-2","value":"databank_plokoon_01_169_92e6679c"}]}],"settings":{"selectedScenarioId":"c18bebab-4fbe-414b-ab1a-e052d7fc3608"}}`)
            }

            settings = {
                workbookDirectory,
                lastWorkbookFileName
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
