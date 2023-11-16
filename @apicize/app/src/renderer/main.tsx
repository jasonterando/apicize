import { Navigation, TestContext, MainEditor, FileDialog, AlertDialog, Toast, RootState, ToastSeverity, openWorkbook, requestToast, setWorkbookDirty } from "@apicize/toolkit";
import { EditableWorkbookToWorkbook, StorageEntry } from "@apicize/definitions";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Grid from '@mui/material/Grid'
import { Box, Stack } from '@mui/material'
import { IpcRendererEvent } from "electron";

enum FileDialogMode {
    WorkbookOpen,
    WorkbookSave
}

let forceExit = false

// Used to keep track of promise resolution for file dialog actions
let activeResolve: (ok: boolean) => void

export function Main() {
    const dispatch = useDispatch()

    const dirty = useSelector((state: RootState) => state.dirty)

    const tests = useSelector((state: RootState) => state.tests)
    const authorizations = useSelector((state: RootState) => state.authorizations)

    const [fileDialogMode, setFileDialogMode] = useState(FileDialogMode.WorkbookOpen)
    const [fileDialogOpen, setFileDialogOpen] = useState(false)
    const [fileDialogTitle, setFileDialogTitle] = useState('')
    const [fileDialogDirectory, setFileDialogDirectory] = useState('')
    const [fileDialogOkButton, setFileDialogOkButton] = useState('')
    const [fileDialogMustExist, setFileDialogMustExist] = useState(false)

    const [alertDialogOpen, setAlertDialogOpen] = useState(false)
    const [alertDialogTitle, setAlertDialogTitle] = useState('')
    const [alertDialogMessage, setAlertDialogMessage] = useState('')
    const [alertDialogOkButton, setAlertDialogOkButton] = useState('')
    const [alertDialogCancelButton, setAlertDialogCancelButton] = useState('')
    const [alertDialogDeafultToCancel, setAlertDialogDeafultToCancel] = useState(false)

    const [showOpenWorkbook, setShowOpenWorkbook] = useState(false)
    const [showSaveWorkbook, setShowSaveWorkbook] = useState(false)

    // Prevent exit if unsaved
    window.onbeforeunload = (e) => {
        if (dirty && !forceExit) {
            (async () => {
                e.preventDefault()
                e.returnValue = true
                if (await onMessageBox('Workbook Not Saved', 'Do you want to exit without saving?', 'Yes', 'No', true)) {
                    forceExit = true
                    window.close()
                }
            })()
        }
    }

    const onListFiles = async (directory: string) => {
        let results: StorageEntry[] | Error
        switch (fileDialogMode) {
            case FileDialogMode.WorkbookOpen:
            case FileDialogMode.WorkbookSave:
                results = await window.apicize.listWorkbooks(directory)
                if (results instanceof Error) {
                    dispatch(requestToast({
                        message: `${results}`,
                        severity: ToastSeverity.Error
                    }))
                    return []
                } else {
                    return results
                }
            default:
                throw new Error(`Unsupported mode ${fileDialogMode} in onListFiles`)
        }
    }

    const onFileDialogOk = async (...name: string[]) => {
        switch (fileDialogMode) {
            case FileDialogMode.WorkbookOpen:
                try {
                    if (name.length > 0) {
                        const results = await window.apicize.openWorkbookFromFile(...name)

                        if (results instanceof Error) {
                            throw results
                        }
                        dispatch(openWorkbook({
                            displayName: results.displayName,
                            fullName: results.fullName,
                            tests: results.workbook.tests,
                            authorizations: results.workbook.authorizations
                        }))
                        dispatch(requestToast({
                            message: `Opened ${results.fullName}`,
                            severity: ToastSeverity.Success
                        }))
                    }
                    setFileDialogOpen(false)
                } catch (e) {
                    dispatch(requestToast({
                        message: `${e}`,
                        severity: ToastSeverity.Error
                    }))
                }
                break
            case FileDialogMode.WorkbookSave:
                try {
                    if (name.length > 0) {
                        const workbook = EditableWorkbookToWorkbook(tests, authorizations)
                        const results = await window.apicize.saveWorkbookToFile(workbook, ...name)
                        if (results instanceof Error) {
                            throw results
                        }
                        setWorkbookDirty(false)
                        dispatch(requestToast({
                            message: `Saved to ${results.fullName}`,
                            severity: ToastSeverity.Success
                        }))
                    }
                    setFileDialogOpen(false)
                } catch (e) {
                    dispatch(requestToast({
                        message: `${e}`,
                        severity: ToastSeverity.Error
                    }))
                }
                break
            default:
                throw new Error(`Unsupported mode ${fileDialogMode} in onClose`)
        }
    }

    const onFileDialogDelete = async (entry: StorageEntry) => {
        const result = await onMessageBox('Delete File?', `Are you sure you want to delete ${entry.displayName}?`, 'Yes', 'No', true)
        if (result) {
            try {
                const result = await window.apicize.deleteFile(entry.fullName)
                if (result instanceof Error) throw result
                dispatch(requestToast({
                    message: `Delete ${entry.fullName}`,
                    severity: ToastSeverity.Success
                }))
                return true
            } catch (e) {
                dispatch(requestToast({
                    message: `${e}`,
                    severity: ToastSeverity.Error
                }))
                return false
            }
        }
    }

    const onMessageBox = (title: string, message: string, okButton: string, cancelButton: string, defaultToCancel?: boolean) =>
        new Promise<boolean>((resolve) => {
            activeResolve = resolve
            setAlertDialogTitle(title)
            setAlertDialogMessage(message)
            setAlertDialogOkButton(okButton)
            setAlertDialogCancelButton(cancelButton)
            setAlertDialogDeafultToCancel(defaultToCancel === true)
            setAlertDialogOpen(true)
        })


    // Set up effect ot display open workbook dialog
    useEffect(() => {
        if (!showOpenWorkbook) {
            return
        }
        setShowOpenWorkbook(false);

        (async () => {
            if (dirty) {
                const result = await onMessageBox('Workbook Not Saved', 'Do you want to open a different workbook without saving?', 'Yes', 'No', true)
                if (!result) {
                    return
                }
            }

            const settings = await window.apicize.getSettings()
            setFileDialogTitle('Open Workbook')
            setFileDialogDirectory(settings.workbookDirectory)
            setFileDialogMustExist(true)
            setFileDialogOkButton('Open')
            setFileDialogMode(FileDialogMode.WorkbookOpen)
            setFileDialogOpen(true)
        })()
    }, [showOpenWorkbook])

    // Set up effect ot display save workbook dialog
    useEffect(() => {
        if (!showSaveWorkbook) return
        setShowSaveWorkbook(false);

        (async () => {
            const settings = await window.apicize.getSettings()
            setFileDialogTitle('Save Workbook')
            setFileDialogDirectory(settings.workbookDirectory)
            setFileDialogMustExist(false)
            setFileDialogOkButton('Save')
            setFileDialogMode(FileDialogMode.WorkbookSave)
            setFileDialogOpen(true)
        })();
    }, [showSaveWorkbook])

    // Set up API callbacks (inbound from main process) in a useEffect,
    // otherwise we get "leakage"
    useEffect(() => {
        // Show open workbook dialog
        window.apicize.onOpenWorkbook(async () => {
            setShowOpenWorkbook(true)
        })

        // Show save workbook dialog
        window.apicize.onSaveWorkbook(async () => {
            setShowSaveWorkbook(true)
        })

        // Set up message button handler
        window.apicize.onMessageBox((_: IpcRendererEvent, title: string, message: string, okButton: string, cancelButton: string, defaultToCancel?: boolean) =>
            onMessageBox(title, message, okButton, cancelButton, defaultToCancel))
    }, [])


    return (
        <Box>
            <Grid container sx={{ height: "100vh" }}>
                <Grid item className='selection-pane'>
                    <Navigation />
                </Grid>
                <Grid item xs>
                    <Stack className='test-main'>
                        <TestContext />
                        <MainEditor />
                    </Stack>
                </Grid>
            </Grid>
            <FileDialog
                open={fileDialogOpen}
                title={fileDialogTitle}
                directory={fileDialogDirectory}
                okButton={fileDialogOkButton}
                mustExist={fileDialogMustExist}
                onListFiles={onListFiles}
                onOk={onFileDialogOk}
                onDelete={onFileDialogDelete}
                onClose={() => setFileDialogOpen(false)}
            />
            <AlertDialog
                open={alertDialogOpen}
                title={alertDialogTitle}
                message={alertDialogMessage}
                okButton={alertDialogOkButton}
                cancelButton={alertDialogCancelButton}
                defaultToCancel={alertDialogDeafultToCancel}
                onClose={(ok: boolean) => {
                    setAlertDialogOpen(false)
                    activeResolve(ok)
                }}
            />
            <Toast />
        </Box>
    )
}
