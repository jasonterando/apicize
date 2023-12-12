// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { ApicizeEvents, OpenedWorkbook, Settings, StorageEntry, Result, WorkbookAuthorization, WorkbookRequest, WorkbookEnvironment, EditableWorkbookAuthorization, StateStorage, EditableWorkbookEnvironment, EditableWorkbookRequestItem } from "@apicize/definitions";
import { IpcRendererEvent, contextBridge, ipcRenderer } from "electron";

const api = {
    // Register event to get settings
    getSettings: (): Promise<Settings> =>
        ipcRenderer.invoke(ApicizeEvents.GetSettings),

    updateLastWorkbookFileName: (fileName: string): Promise<void> =>
        ipcRenderer.invoke(ApicizeEvents.UpdateLastWorkbookFileName, fileName),

    // Register event to list workbooks
    listWorkbooks: (path: string): Promise<StorageEntry[] | Error> =>
        ipcRenderer.invoke(ApicizeEvents.ListWorkbooks, path),

    // Register event to open workbook
    openWorkbookFromFile: (...name: string[]): Promise<OpenedWorkbook | Error> =>
        ipcRenderer.invoke(ApicizeEvents.OpenWorkbookFromFile, ...name),

    // Register event to write workbook
    saveWorkbookToFile: (
        requests: StateStorage<EditableWorkbookRequestItem>,
        authorizations: StateStorage<EditableWorkbookAuthorization>,
        environments: StateStorage<EditableWorkbookEnvironment>,
        ...name: string[]): Promise<StorageEntry | Error> =>
        ipcRenderer.invoke(ApicizeEvents.SaveWorkbookToFile, requests, authorizations, environments, ...name),

    deleteFile: (fileName: string): Promise<Error | undefined> =>
        ipcRenderer.invoke(ApicizeEvents.DeleteFile, fileName),

    // Register event to run list of requests
    runRequests: (requests: WorkbookRequest[], authorization: WorkbookAuthorization, environment: WorkbookEnvironment): Promise<Result[]> =>
        ipcRenderer.invoke(ApicizeEvents.RunRequests, requests, authorization, environment),

    // Register event to cancel list of requests
    cancelRequests: (ids: string[]): Promise<unknown> =>
        ipcRenderer.invoke(ApicizeEvents.CancelRequests, ids),

    // Register handler application quit handler
    onBeforeQuit: (handler: () => Promise<boolean>) => {
        ipcRenderer.on(ApicizeEvents.BeforeQuit, handler)
    },

    // Register handler for prompting the user to open workbook
    onOpenWorkbook: (handler: () => void) => {
        ipcRenderer.on(ApicizeEvents.OpenWorkbook, handler)
    },

    // Register handler for prompting the user to save workbook
    onSaveWorkbook: (handler: () => void) => {
        ipcRenderer.on(ApicizeEvents.SaveWorkbook, handler)
    },

    onSaveWorkbookAs: (handler: () => void) => {
        ipcRenderer.on(ApicizeEvents.SaveWorkbookAs, handler)
    },

    // Register handler for modal message box
    onMessageBox: (handler: (event: IpcRendererEvent, title: string, message: string, okButton: string, cancelButton?: string) => Promise<boolean>) => {
        ipcRenderer.on(ApicizeEvents.MessageBox, handler)
    },
}

contextBridge.exposeInMainWorld('apicize', api)

export default api
