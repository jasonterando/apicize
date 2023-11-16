// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { ApicizeEvents, OpenedWorkbook, Settings, StorageEntry, Workbook } from "@apicize/definitions";
import { IpcRendererEvent, contextBridge, ipcRenderer } from "electron";

const api = {
    // Register event to get settings
    getSettings: (): Promise<Settings> => 
        ipcRenderer.invoke(ApicizeEvents.GetSettings),

    // Register event to list workbooks
    listWorkbooks: (path: string): Promise<StorageEntry[] | Error> =>
        ipcRenderer.invoke(ApicizeEvents.ListWorkbooks, path),

    // Register event to open workbook
    openWorkbookFromFile: (...name: string[]): Promise<OpenedWorkbook | Error> =>
        ipcRenderer.invoke(ApicizeEvents.OpenWorkbookFromFile, ...name),

    // Register event to write workbook
    saveWorkbookToFile: (workbook: Workbook, ...name: string[]): Promise<StorageEntry | Error> =>
        ipcRenderer.invoke(ApicizeEvents.SaveWorkbookToFile, workbook, ...name),

    deleteFile: (fileName: string): Promise<Error | undefined> =>
        ipcRenderer.invoke(ApicizeEvents.DeleteFile, fileName),

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

    // Register handler for modal message box
    onMessageBox: (handler: (event: IpcRendererEvent, title: string, message: string, okButton: string, cancelButton?: string) => Promise<boolean>) => {
        ipcRenderer.on(ApicizeEvents.MessageBox, handler)
    },
}

contextBridge.exposeInMainWorld('apicize', api)

export default api
