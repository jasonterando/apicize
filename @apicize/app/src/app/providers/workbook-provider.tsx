"use client"

import { ReactNode, useContext, useEffect, useRef } from "react"
import {
    ToastContext, ToastStore, ToastSeverity, WorkbookState, 
    useConfirmation, WorkbookStorageContext
} from "@apicize/toolkit"
import { useSelector } from 'react-redux'
import { Settings, StoredWorkbook } from "@apicize/lib-typescript"
import { listen, Event } from "@tauri-apps/api/event"
import { join, resourceDir } from "@tauri-apps/api/path"
import { copyFile, exists, readFile, writeTextFile } from "@tauri-apps/plugin-fs"
import { ApicizeResult } from "@apicize/lib-typescript/dist/models/lib/apicize-result"
import { writeText } from "@tauri-apps/plugin-clipboard-manager"
// import { writeImage, writeText } from "tauri-plugin-clipboard-api"

export interface WorkbookServiceStore { }

export const WorkbookProvider = (props: {
    children?: ReactNode
}) => {

    const context = useContext(WorkbookStorageContext)
    const confirm = useConfirmation()
    const toast = useContext<ToastStore>(ToastContext)

    const dirty = useSelector((state: WorkbookState) => state.workbook.dirty)

    const workbookFullName = useSelector((state: WorkbookState) => state.workbook.workbookFullName)
    const workbookDisplayName = useSelector((state: WorkbookState) => state.workbook.workbookDisplayName)

    const requestId = useSelector((state: WorkbookState) => state.request.id)
    const authorizationId = useSelector((state: WorkbookState) => state.authorization.id)

    const selectedAuthorizationID = useSelector((state: WorkbookState) => state.execution.selectedAuthorizationID)
    const selectedScenarioID = useSelector((state: WorkbookState) => state.execution.selectedScenarioID)


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

    let _fs: typeof import('@tauri-apps/plugin-fs') | undefined
    const getTauriFS = async () => {
        if (_fs) return _fs
        _fs = await import('@tauri-apps/plugin-fs')
        return _fs
    }

    useEffect(() => {
        if (!_loaded.current) {
            _loaded.current = true;
            (async () => {
                try {
                    let settings = await loadSettings()
                    if ((settings?.lastWorkbookFileName?.length ?? 0) > 0) {
                        await doOpenWorkbook(settings.lastWorkbookFileName)
                    }
                } catch (e) {
                    toast.open(`${e}`, ToastSeverity.Error)
                }
            })()
        }

        const unlistenAction = listen('action', async (payload: Event<string>) => { await doRouteAction(payload) })
        const unlistenCopyTextToClipboard = listen<string | undefined>('copyText', async (event) => {
            await doCopyTextToClipboard(event.payload)
        })
        const unlistenCopyImageToClipboard = listen<string | undefined>('copyImage', async (event) => {
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
        if (!_window.current) {
            _window.current = await import('@tauri-apps/api/window')
        }
        return _window.current
    }

    // Called by provider when opened workbook is opened or saved
    useEffect(() => {
        (async () => {
            const window = await getTauriWindow()
            window.getCurrent().setTitle(((workbookDisplayName?.length ?? 0) > 0)
                ? `Apicize - ${workbookDisplayName}`
                : 'Apicize (New Workbook)')
        })()
    }, [workbookDisplayName])


    const doRouteAction = async (event: Event<string>) => {
        switch (event.payload) {
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
            case 'bodyFromFile':
                await doSetBodyFromFile()
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

        context.newWorkbook()
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
                    name: 'Apicize Files',
                    extensions: ['apicize']
                }]
            })) as any
            if (selected) fileName = selected['path']
        }


        if (!fileName) return

        const core = await getTauriApiCore()
        try {
            const data: StoredWorkbook = await core.invoke('open_workbook', { path: fileName })
            const displayName = await path.basename(fileName)
            context.openWorkbook(fileName, displayName, data)
            updateSettings({ lastWorkbookFileName: fileName })
            toast.open(`Opened ${fileName}`, ToastSeverity.Success)
        } catch (e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
    }

    const doSaveWorkbook = async () => {
        try {
            if (!(workbookFullName && workbookFullName.length > 0)) {
                return
            }
            const core = await getTauriApiCore()
            const path = await getTauriPath()

            const workbook = context.getWorkbookFromStore()
            await core.invoke('save_workbook', { workbook, path: workbookFullName })

            await updateSettings({ lastWorkbookFileName: workbookFullName })
            toast.open(`Saved ${workbookFullName}`, ToastSeverity.Success)
            context.onSaveWorkbook(
                workbookFullName,
                await path.basename(workbookFullName, '.apicize')
            )
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
                    name: 'Apicize Files',
                    extensions: ['apicize']
                }]
            })

            if ((typeof fileName !== 'string') || ((fileName?.length ?? 0) === 0)) {
                return
            }

            const workbook = context.getWorkbookFromStore()

            await core.invoke('save_workbook', { workbook, path: fileName })
            await updateSettings({ lastWorkbookFileName: fileName })
            toast.open(`Saved ${fileName}`, ToastSeverity.Success)
            context.onSaveWorkbook(
                fileName,
                await path.basename(fileName, '.apicize')
            )
        } catch (e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
    }

    const doRunRequest = async () => {
        // toast.open(`Executing id ${entry.name}`, ToastSeverity.Info)
        const runInfo = context.request.getRunInformation()
        if (! runInfo) return

        try {
            const core = await getTauriApiCore()
            context.execution.runStart(runInfo.request.id)
            let results = await core.invoke<ApicizeResult[][]>
                ('run_request', runInfo)
            context.execution.runComplete(runInfo.request.id, results)
        } catch (e) {
            let msg1 = `${e}`
            toast.open(msg1, msg1 == 'Cancelled' ? ToastSeverity.Warning : ToastSeverity.Error)
            context.execution.runCancel(runInfo.request.id)
        }
    }

    const doCancelRequest = async () => {
        if (!requestId) return
        try {
            const core = await getTauriApiCore()
            await core.invoke('cancel_request', {
                id: requestId
            })
        } catch (e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
    }

    const doClearToken = async () => {
        try {
            if (authorizationId) {
                const core = await getTauriApiCore()
                const result = await core.invoke('clear_cached_authorization', {
                    authorization_id: authorizationId
                })
                if (result) {
                    toast.open('Token cleared for this authorization', ToastSeverity.Success)
                } else {
                    toast.open('No token for this authorization to clear', ToastSeverity.Info)
                }
            }
        } catch (e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
    }

    const doCopyImageToClipboard = async (_base64?: string) => {
        toast.open('Copy image to clipboard not yet supported', ToastSeverity.Warning)
        // try {
        //     if(base64 && (base64.length > 0)) {
        //         await writeImage(base64)
        //         toast.open('Image copied to clipboard', ToastSeverity.Success)
        //     }
        // } catch(e) {
        //     toast.open(`${e}`, ToastSeverity.Error)
        // }
    }

    const doCopyTextToClipboard = async (text?: string) => {
        try {
            if (text && (text.length ?? 0) > 0) {
                await writeText(text)
                toast.open('Text copied to clipboard', ToastSeverity.Success)
            }
        } catch (e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
    }

    const loadSettings = async () => {
        if (_settings.current) return _settings.current

        let path = await getTauriPath()
        let fs = await getTauriFS()

        let settings: Settings | undefined
        const configDirectory = await path.appConfigDir()
        const settingsFileName = await path.join(configDirectory, 'settings.json')
        let newInstallation = false

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
                console.error(`Unable to read settings ${settingsFileName} - ${e}`)
            }
        } else {
            if (! await fs.exists(configDirectory)) {
                await fs.mkdir(configDirectory, { recursive: true })
            }
        }
        if (!settings) {
            settings = {
                workbookDirectory: await path.join(await path.documentDir(), 'apicize')
            }
            newInstallation = true
        }

        // Make sure workbook directory exists
        if (! await fs.exists(settings.workbookDirectory)) {
            await fs.mkdir(settings.workbookDirectory, { recursive: true })
        }

        if (newInstallation) {
            // const lastWorkbookFileName = await path.join(settings.workbookDirectory, 'demo.apicize')
            // if (! await fs.exists(lastWorkbookFileName)) {
                // const demoFile = await join(await resourceDir(), 'demo.apicize')
                // if (await exists(demoFile)) {
                //     const destDemoFile = await join(settings.workbookDirectory, 'demo.apicize')
                //     try {
                //         await copyFile(demoFile, destDemoFile);
                //         settings.lastWorkbookFileName = destDemoFile
                //     } catch(e) {
                //         console.error(`Unable to copy ${demoFile} to ${destDemoFile}`)
                //     }
                // }
            // }
            // settings.lastWorkbookFileName = lastWorkbookFileName
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

    const doSetBodyFromFile = async () => {

        if (!requestId) return

        const dialog = await getTauriDialog()
        const settings = await loadSettings()
        const selected = (await dialog.open({
            multiple: false,
            title: 'Set Body From File',
            defaultPath: settings?.workbookDirectory,
            directory: false
        })) as any
        if (!selected) return
        const fileName = selected['path']
        try {
            const data = await readFile(fileName)
            context.request.setBodyData(requestId, Array.from(data))
            toast.open(`Data set from ${fileName}`, ToastSeverity.Success)
        } catch (e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
    }

    return (
        <>
            {props.children}
        </>
    )
}
