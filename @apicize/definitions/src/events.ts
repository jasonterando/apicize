/**
 * List of events used for IPC notifications
 */
export enum ApicizeEvents {
    GetSettings = 'get-settings',
    ListWorkbooks = 'list-workbooks',
    OpenWorkbook = 'open-workbook',
    SaveWorkbook = 'save-workbook',
    OpenWorkbookFromFile = 'open-workbook-from-file',
    SaveWorkbookToFile = 'save-workbook-to-file',
    BeforeQuit = 'before-quit',
    MessageBox = 'message-box',
    DeleteFile = 'delete-file',
    RunTests = 'run-tests'
}