import { StorageEntry } from "@apicize/definitions"
import { FileDialog, RootState, ToastSeverity, initializeState, saveWorkbook, useToast } from "@apicize/toolkit"
import { IpcRendererEvent } from "electron"
import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Box } from '@mui/material'
import { useConfirmation } from "@apicize/toolkit/dist/services/confirmation-service"

enum FileDialogMode {
    WorkbookOpen,
    WorkbookSave
}

// Used to keep track of promise resolution for file dialog actions
let forceExit = false

export function Events() {
    const dispatch = useDispatch()
    const confirm = useConfirmation()
    // const toast = useToast()

    const dirty = useSelector((state: RootState) => state.dirty)

    const requests = useSelector((state: RootState) => state.requests)
    const authorizations = useSelector((state: RootState) => state.authorizations)
    const environments = useSelector((state: RootState) => state.environments)

    const [fileDialogMode, setFileDialogMode] = useState(FileDialogMode.WorkbookOpen)
    const [fileDialogOpen, setFileDialogOpen] = useState(false)
    const [fileDialogTitle, setFileDialogTitle] = useState('')
    const [fileDialogDirectory, setFileDialogDirectory] = useState('')
    const [fileDialogOkButton, setFileDialogOkButton] = useState('')
    const [fileDialogMustExist, setFileDialogMustExist] = useState(false)

    const [showOpenWorkbook, setShowOpenWorkbook] = useState(false)
    const [showSaveWorkbook, setShowSaveWorkbook] = useState(false)

    const workbookFullName = useSelector((state: RootState) => state.workbookFullName)
    const [triggerSaveWorkbook, setTriggerSaveWorkbook] = useState(false)
    useEffect(() => {
        if (triggerSaveWorkbook) {
            setTriggerSaveWorkbook(false);
            (async () => {
                if (workbookFullName.length > 0) {
                    await performSaveWorkbook(workbookFullName)
                } else {
                    setShowSaveWorkbook(true)
                }
            })();
        }
    }, [triggerSaveWorkbook])

    // Upon first open of the control, attempt to load the last accessed workbook
    useEffect(() => {
        (async () => {
            const settings = await window.apicize.getSettings()
            if (settings.lastWorkbookFileName && settings.lastWorkbookFileName.length > 0) {
                await performOpenWorkbook(false, settings.lastWorkbookFileName)
            }
        })()

        // Set up API callbacks (inbound from main process) in a useEffect,
        // otherwise we get "leakage"

        // Show open workbook dialog
        window.apicize.onOpenWorkbook(async () => {
            setShowOpenWorkbook(true)
        })

        window.apicize.onSaveWorkbook(() => {
            setTriggerSaveWorkbook(true)
        })
    
        window.apicize.onSaveWorkbookAs(async () => {
            setShowSaveWorkbook(true)
        })
    }, [])

    // Prevent exit if unsaved
    // window.onbeforeunload = (e) => {
    //     if (dirty && !forceExit) {
    //         (async () => {
    //             e.preventDefault()
    //             e.returnValue = true
    //             if (await onMessageBox('Workbook Not Saved', 'Do you want to exit without saving?', 'Exit', 'Do Not Exit', true)) {
    //                 forceExit = true
    //                 window.close()
    //             }
    //         })()
    //     }
    // }

    const onListFiles = async (directory: string) => {
        let results: StorageEntry[] | Error
        switch (fileDialogMode) {
            case FileDialogMode.WorkbookOpen:
            case FileDialogMode.WorkbookSave:
                results = await window.apicize.listWorkbooks(directory)
                if (results instanceof Error) {
                    // await toast({
                    //     message: `${results}`,
                    //     severity: ToastSeverity.Error
                    // })
                    return []
                } else {
                    return results
                }
            default:
                throw new Error(`Unsupported mode ${fileDialogMode} in onListFiles`)
        }
    }

    const performOpenWorkbook = async (errorIfNotExists: boolean, ...name: string[]) => {
        const results = await window.apicize.openWorkbookFromFile(...name)

        if (results instanceof Error) {
            if (errorIfNotExists) {
                throw results
            } else {
                return
            }
        }

        dispatch(initializeState({
            displayName: results.displayName,
            fullName: results.fullName,
            requests: results.requests,
            authorizations: results.authorizations,
            environments: results.environments
        }))

        // toast({
        //     message: `Opened ${results.fullName}`,
        //     severity: ToastSeverity.Success
        // })

        return results
    }

    const performSaveWorkbook = async (...name: string[]) => {
        try {
            const results = await window.apicize.saveWorkbookToFile(
                
                requests,
                authorizations,
                environments, 
                ...name)
            if (results instanceof Error) {
                throw results
            }
            dispatch(saveWorkbook({
                fullName: results.fullName,
                displayName: results.displayName,
            }))
            // toast({
            //     message: `Saved to ${results.fullName}`,
            //     severity: ToastSeverity.Success
            // })
            window.apicize.updateLastWorkbookFileName(results.fullName)
        } catch (e) {
            // toast({
            //     message: `${e}`,
            //     severity: ToastSeverity.Error
            // })
        }
    }

    const onFileDialogOk = async (...name: string[]) => {
        switch (fileDialogMode) {
            case FileDialogMode.WorkbookOpen:
                try {
                    if (name.length > 0) {
                        const results = await performOpenWorkbook(true, ...name)
                        window.apicize.updateLastWorkbookFileName(results.fullName)
                    }
                    setFileDialogOpen(false)
                } catch (e) {
                    // toast({
                    //     message: `${e}`,
                    //     severity: ToastSeverity.Error
                    // })
                }
                break
            case FileDialogMode.WorkbookSave:
                if (name.length > 0) {
                    performSaveWorkbook(...name)
                }
                setFileDialogOpen(false)
                break
            default:
                throw new Error(`Unsupported mode ${fileDialogMode} in onClose`)
        }
    }


    const onFileDialogDelete = async (entry: StorageEntry) => {
        const result = await confirm({
            title: 'Delete File',
            message: `Are you sure you want to delete ${entry.displayName}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        })
        if (result) {
            try {
                const result = await window.apicize.deleteFile(entry.fullName)
                if (result instanceof Error) throw result
                // toast({
                //     message: `Delete ${entry.fullName}`,
                //     severity: ToastSeverity.Success
                // })
                return true
            } catch (e) {
                // toast({
                //     message: `${e}`,
                //     severity: ToastSeverity.Error
                // })
                return false
            }
        }
    }

    // Set up effect ot display open workbook dialog
    useEffect(() => {
        if (!showOpenWorkbook) {
            return
        }
        setShowOpenWorkbook(false);

        (async () => {
            if (dirty) {
                const result = await confirm({
                    title: 'Workbook Not Saved',
                    message: 'Do you want to open a different workbook without saving?',
                    okButton: 'Yes',
                    cancelButton: 'No',
                    defaultToCancel: true
                })
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


    return (<Box>
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
    </Box>)
}