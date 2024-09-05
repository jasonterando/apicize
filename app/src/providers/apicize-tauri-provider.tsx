"use client"

import { ReactNode, useContext, useEffect, useRef, useState } from "react"
import {
    ToastContext, ToastStore, ToastSeverity,
    useConfirmation,
    base64Encode,
    ContentDestination,
    useWorkspace,
    useExecution,
    useWindow,
    EditableEntityType,
    useToast,
    ClipboardContentType,
    useClipboard,
} from "@apicize/toolkit"
import { ApicizeExecutionResults, StoredGlobalSettings, Workspace } from "@apicize/lib-typescript"
import { join, resourceDir } from "@tauri-apps/api/path"
import { Window } from "@tauri-apps/api/window"
import * as app from '@tauri-apps/api/app'
import * as core from '@tauri-apps/api/core'
import * as path from '@tauri-apps/api/path'
import { listen, Event, UnlistenFn } from "@tauri-apps/api/event"
import { exists, readFile, readTextFile } from "@tauri-apps/plugin-fs"
import * as dialog from '@tauri-apps/plugin-dialog'
import clipboard, { writeImageBase64, writeText } from "tauri-plugin-clipboard-api"
import { autorun, reaction } from "mobx"
import { RunInformation } from "@apicize/toolkit/dist/models/workbook/run-information"

const EXT = 'apicize';

let _window: Window | undefined = undefined
const getWindow = async () => {
    if (!_window) {
        _window = (await import('@tauri-apps/api/window')).Window.getCurrent()
    }
    return _window
}

/**
 * This provider is the "glue" between React and Tauri
 * @param props 
 * @returns element including children (if any)
 */
export const ApicizeTauriProvider = (props: { children?: ReactNode }) => {
    const workspaceCtx = useWorkspace()
    const executionCtx = useExecution()
    const clipboardCtx = useClipboard()
    const confirm = useConfirmation()
    const toast = useToast()

    const windowCtx = useWindow()

    const _forceClose = useRef(false)

    const [sshPath, setSshPath] = useState('')
    const [bodyDataPath, setBodyDataPath] = useState('')

    let _settings = useRef<StoredGlobalSettings | undefined>()
    let _loaded = useRef(false)

    useEffect(() => {
        if (!_loaded.current) {
            _loaded.current = true;

            (async () => {
                const [name, version, isReleaseMode] = await Promise.all([
                    app.getName(),
                    app.getVersion(),
                    core.invoke<boolean>('is_release_mode')
                ])

                if (isReleaseMode) {
                    document.addEventListener('contextmenu', event => event.preventDefault())
                }

                windowCtx.changeApp(name, version)
                try {
                    let settings = await loadSettings()
                    if ((settings?.lastWorkbookFileName?.length ?? 0) > 0) {
                        await doOpenWorkbook(settings.lastWorkbookFileName, false)
                    }
                } catch (e) {
                    toast.open(`${e}`, ToastSeverity.Error)
                }

                // Set up close event hook, warn user if "dirty"
                const currentWindow = await getWindow()
                currentWindow.onCloseRequested((e) => {
                    if (windowCtx.dirty && (!_forceClose.current)) {
                        e.preventDefault();
                        (async () => {
                            if (await confirm({
                                title: 'Close Apicize?',
                                message: 'You have unsaved changes, are you sure you want to close Apicize?',
                                okButton: 'Yes',
                                cancelButton: 'No',
                                defaultToCancel: true
                            })) {
                                _forceClose.current = true
                                windowCtx.changeDirty(false)
                                currentWindow.close()
                            }
                        })()
                    }
                })
            })()
        }

        const unlistenRun = listen('run', async (event: Event<RunInformation>) => { await doRunRequest(event.payload) })
        const unlistenOpenFile = listen('openFile', async (event: Event<{ destination: ContentDestination, id: string }>) => { await doOpenFile(event.payload.destination, event.payload.id) })
        const unlistenAction = listen('action', async (event: Event<string>) => { await doRouteAction(event.payload) })

        const unlistenCopyTextToClipboard = listen<string | undefined>('copyText', async (event) => {
            await doCopyTextToClipboard(event.payload)
        })
        const unlistenCopyImageToClipboard = listen<string | undefined>('copyImage', async (event) => {
            await doCopyImageToClipboard(event.payload)
        })

        const unlistenPastFromClipboard = listen<{ destination: ContentDestination, id: string }>('pasteFromClipboard', async (event) => {
            await doPasteTextFromClipboard(event.payload.destination, event.payload.id)
        })

        let unlistenClipboardUpdate: Promise<UnlistenFn> | null = null
        clipboard.startListening().then(async () => {
            unlistenClipboardUpdate = clipboard.onSomethingUpdate((types) => {
                const ctypes: ClipboardContentType[] = []
                if (types.text) ctypes.push(ClipboardContentType.Text)
                if (types.imageBinary) ctypes.push(ClipboardContentType.Image)
                clipboardCtx.changeTypes(types.text === true, types.imageBinary === true)
            })
        })

        return () => {
            if (unlistenClipboardUpdate) unlistenClipboardUpdate.then(f => f())
            unlistenRun.then(f => f())
            unlistenOpenFile.then(f => f())
            unlistenAction.then(f => f())
            unlistenCopyTextToClipboard.then(f => f())
            unlistenCopyImageToClipboard.then(f => f())
            unlistenPastFromClipboard.then(f => f())
        }
    })

    reaction(
        () => ({ dirty: windowCtx.dirty, displayName: windowCtx.workbookDisplayName }),
        async ({ dirty, displayName }) => {
            const showDirty = dirty ? ' *' : ''
            const currentWindow = await getWindow()
            currentWindow.setTitle(((displayName?.length ?? 0) > 0)
                ? `Apicize - ${displayName}${showDirty}`
                : `Apicize (New Workbook)${showDirty}`)
        }
    )

    const doRouteAction = async (action: string) => {
        switch (action) {
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
            case 'cancel':
                await doCancelRequest()
                break
            case 'clearToken':
                await doClearToken()
                break
            default:
                console.warn(`Invalid action: ${action}`)
        }
    }

    // Return SSH path if available, otherwise, fall back to settins
    const getSshPath = async () => {
        if (sshPath.length > 0) {
            if (await exists(sshPath)) {
                return sshPath
            }
        }
        const settings = await loadSettings()
        const home = await path.homeDir()
        const openSshPath = await path.join(home, '.ssh')
        if (await exists(openSshPath)) {
            return openSshPath
        } else {
            return settings.workbookDirectory
        }
    }

    const getBodyDataPath = async () => {
        if (bodyDataPath.length > 0) {
            if (await exists(bodyDataPath)) {
                return bodyDataPath
            }
        }

        const fileName = windowCtx.workbookFullName
        if (fileName && fileName.length > 0) {
            const base = await path.basename(fileName)
            let i = fileName.indexOf(base)
            if (i != -1) {
                return fileName.substring(0, i)
            }
        }
        const settings = await loadSettings()
        return settings.workbookDirectory
    }

    const doOpenFile = async (destination: ContentDestination, id: string) => {
        let defaultPath: string
        let title: string
        let extensions: string[]
        let extensionName: string

        switch (destination) {
            case ContentDestination.PEM:
                defaultPath = await getSshPath()
                title = 'Open Public Key (.pem)'
                extensions = ['pem']
                extensionName = 'Privacy Enhanced Mail Format (.pem)'
                break
            case ContentDestination.Key:
                defaultPath = await getSshPath()
                title = 'Open Private Key (.key)'
                extensions = ['key']
                extensionName = 'Private Key Files (*.key)'
                break
            case ContentDestination.PFX:
                defaultPath = await getSshPath()
                title = 'Open PFX Key (.pfx, .p12)'
                extensions = ['pfx', 'p12']
                extensionName = 'Personal Information Exchange Format (*.pfx, *.pfx)'
                break
            case ContentDestination.BodyBinary:
                defaultPath = await getBodyDataPath()
                title = 'Open Posted Body Content'
                extensions = []
                extensionName = ''
                break
            default:
                toast.open('Invalid destination type', ToastSeverity.Error)
                return
        }

        const selected = (await dialog.open({
            multiple: false,
            title,
            defaultPath,
            directory: false,
            filters: extensions.length > 0
                ? [{
                    name: extensionName,
                    extensions
                }, {
                    name: 'All Files',
                    extensions: ['*']
                }]
                : [
                    {
                        name: 'All Files',
                        extensions: ['*']
                    }
                ]
        })) as any

        if (!selected) return

        const fileName = selected['path'] as string
        try {
            const baseName = await path.basename(fileName)
            let pathName = ''
            let i = fileName.indexOf(baseName)
            if (i !== -1) {
                pathName = (await path.dirname(fileName)).substring(0, i)
            }

            const data = base64Encode(await readFile(fileName))
            switch (destination) {
                case ContentDestination.PEM:
                    workspaceCtx.setCertificatePem(data)
                    if (pathName.length > 0) setSshPath(pathName)
                    break
                case ContentDestination.Key:
                    workspaceCtx.setCertificateKey(data)
                    if (pathName.length > 0) setSshPath(pathName)
                    break
                case ContentDestination.PFX:
                    workspaceCtx.setCertificatePfx(data)
                    if (pathName.length > 0) setSshPath(pathName)
                    break
                case ContentDestination.BodyBinary:
                    workspaceCtx.setRequestBodyData(data)
                    if (pathName.length > 0) setBodyDataPath(pathName)
                    break
            }
            toast.open(`Data read from from ${fileName}`, ToastSeverity.Success)

        } catch (e) {
            toast.open(`Unable to open ${fileName}, ${e}`, ToastSeverity.Error)
        }
    }

    const doPasteTextFromClipboard = async (destination: ContentDestination, id: string) => {
        const getClipboardText = async () => {
            try {
                if (await clipboard.hasText()) {
                    return await clipboard.readText()
                } else {
                    return null
                }
            } catch (e) {
                toast.open(`${e}`, ToastSeverity.Error)
                return null
            }
        }
        const getClipboardImage = async () => {
            try {
                return await core.invoke<string>('get_clipboard_image_base64')
                // return await clipboard.readImageBase64()
            } catch (e) {
                toast.open(`Unable to copy image from clipboard: ${e}`, ToastSeverity.Error)
                return null
            }
        }

        let text: string | null
        let data: string | null
        switch (destination) {
            case ContentDestination.PEM:
                text = await getClipboardText()
                if (text) workspaceCtx.setCertificatePem(base64Encode((new TextEncoder).encode(text)))
                break
            case ContentDestination.Key:
                text = await getClipboardText()
                if (text) workspaceCtx.setCertificateKey(base64Encode((new TextEncoder).encode(text)))
                break
            case ContentDestination.BodyBinary:
                data = await getClipboardImage()
                if (data) {
                    workspaceCtx.setRequestBodyData(data)
                } else {
                    text = await getClipboardText()
                    if (text) {
                        workspaceCtx.setRequestBodyData(base64Encode((new TextEncoder()).encode(text)))
                    }
                }
                break
        }
    }

    // Triggers the start of a new workbook
    const doNewWorkbook = async () => {
        if (windowCtx.dirty) {
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

        const settings = await loadSettings()
        workspaceCtx.newWorkspace()
        _forceClose.current = false
        toast.open('Created New Workbook', ToastSeverity.Success)
    }

    // Triggers opening a workbook
    const doOpenWorkbook = async (fileName?: string, doUpdateSettings = true) => {
        const settings = await loadSettings()

        if (windowCtx.dirty) {
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
            fileName = (await dialog.open({
                multiple: false,
                title: 'Open Apicize Workbook',
                defaultPath: settings?.workbookDirectory,
                directory: false,
                filters: [{
                    name: 'Apicize Files',
                    extensions: [EXT]
                }]
            })) as any
        }

        if (!fileName) return

        try {
            const data: Workspace = await core.invoke('open_workspace', { path: fileName })
            const displayName = await getDisplayName(fileName)
            windowCtx.changeWorkbook(fileName, displayName)
            workspaceCtx.loadWorkspace(data)
            if (doUpdateSettings) {
                await updateSettings({ lastWorkbookFileName: fileName })
            }
            _forceClose.current = false
            toast.open(`Opened ${fileName}`, ToastSeverity.Success)
        } catch (e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
    }

    const doSaveWorkbook = async () => {
        try {
            if (!(windowCtx.workbookFullName && windowCtx.workbookFullName.length > 0)) {
                return
            }

            if (workspaceCtx.anyInvalid()) {
                if (! await confirm({
                    title: 'Save Workbook',
                    message: 'Your workspace has one or more errors, are you sure you want to save?',
                    okButton: 'Yes',
                    cancelButton: 'No',
                    defaultToCancel: true
                })) {
                    return
                }
            }
            const workspace = workspaceCtx.getWorkspace()

            await core.invoke('save_workspace', { workspace, path: windowCtx.workbookFullName })

            await updateSettings({ lastWorkbookFileName: windowCtx.workbookFullName })
            toast.open(`Saved ${windowCtx.workbookFullName}`, ToastSeverity.Success)
            windowCtx.changeWorkbook(
                windowCtx.workbookFullName,
                await getDisplayName(windowCtx.workbookFullName)
            )
        } catch (e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
    }

    const doSaveWorkbookAs = async () => {
        try {
            if (workspaceCtx.anyInvalid()) {
                if (! await confirm({
                    title: 'Save Workbook',
                    message: 'Your workspace has one or more errors, are you sure you want to save?',
                    okButton: 'Yes',
                    cancelButton: 'No',
                    defaultToCancel: true
                })) {
                    return
                }
            }

            const settings = await loadSettings()

            let fileName = await dialog.save({
                title: 'Save Apicize Workbook',
                defaultPath: ((windowCtx.workbookFullName?.length ?? 0) > 0)
                    ? windowCtx.workbookFullName : settings.workbookDirectory,
                filters: [{
                    name: 'Apicize Files',
                    extensions: [EXT]
                }]
            })

            if ((typeof fileName !== 'string') || ((fileName?.length ?? 0) === 0)) {
                return
            }

            if (!fileName.endsWith(`.${EXT}`)) {
                fileName += `.${EXT}`
            }

            const workspace = workspaceCtx.getWorkspace()
            await core.invoke('save_workspace', { workspace, path: fileName })

            await updateSettings({ lastWorkbookFileName: fileName })
            toast.open(`Saved ${fileName}`, ToastSeverity.Success)
            windowCtx.changeWorkbook(
                fileName,
                await getDisplayName(fileName)
            )
        } catch (e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
    }

    const getDisplayName = async (fileName: string) => {
        let base = await path.basename(fileName);
        const i = base.lastIndexOf('.');
        if (i !== -1) {
            base = base.substring(0, i);
        }
        return base;
    }

    const doRunRequest = async (runInfo: RunInformation) => {
        try {
            executionCtx.runStart(runInfo.requestId)
            let results = await core.invoke<ApicizeExecutionResults>
                ('run_request', { workspace: runInfo.workspace, requestId: runInfo.requestId })
            console.log('Run results', results)
            executionCtx.runComplete(runInfo.requestId, results)
        } catch (e) {
            let msg1 = `${e}`
            toast.open(msg1, msg1 == 'Cancelled' ? ToastSeverity.Warning : ToastSeverity.Error)
            executionCtx.runCancel(runInfo.requestId)
        }
    }

    const doCancelRequest = async () => {
        const requestId = workspaceCtx.active?.entityType === EditableEntityType.Request ? workspaceCtx.active?.id : ''
        if (requestId?.length === 0) return
        try {
            await core.invoke('cancel_request', {
                id: requestId
            })
        } catch (e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
    }

    const doClearToken = async () => {
        try {
            const authorizationId = workspaceCtx.active?.entityType === EditableEntityType.Authorization ? workspaceCtx.active?.id : ''
            if ((authorizationId?.length ?? 0) > 0) {
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

    const doCopyImageToClipboard = async (base64?: string) => {
        try {
            if (base64 && (base64.length > 0)) {
                const m = base64.length % 4
                if (m) {
                    base64 += '==='.substring(0, 4 - m)
                }
                await writeImageBase64(base64)
                toast.open('Image copied to clipboard', ToastSeverity.Success)
            }
        } catch (e) {
            toast.open(`${e}`, ToastSeverity.Error)
        }
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

        let settings: StoredGlobalSettings
        try {
            settings = await core.invoke<StoredGlobalSettings>('open_settings')
        } catch (e) {
            // If unable to load settings, try and put into place some sensible defaults
            settings = {
                workbookDirectory: await path.join(await path.documentDir(), 'apicize'),
            }
            toast.open(`Unable to access settings: ${e}`, ToastSeverity.Error)
        }

        _settings.current = settings
        return _settings.current

    }

    const updateSettings = async (updates: {
        workbookDirectory?: string,
        lastWorkbookFileName?: string
    }) => {
        _settings.current = await loadSettings()

        // Build a new set of settings, including  in proxy / certificate information
        const newSettings = workspaceCtx.getSettings(
            updates.workbookDirectory === undefined ? _settings.current.workbookDirectory : updates.workbookDirectory,
            updates.lastWorkbookFileName === undefined ? _settings.current.lastWorkbookFileName : updates.lastWorkbookFileName
        )

        try {
            await core.invoke<StoredGlobalSettings>('save_settings', { settings: newSettings })
        } catch (e) {
            toast.open(`Unable to save settings: ${e}`, ToastSeverity.Error)
        }
    }

    return (
        <>
            {props.children}
        </>
    )
}
