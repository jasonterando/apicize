/**
 * List of events used for IPC notifications
 */
export enum ApicizeEvents {
    GetSettings = 'get-settings',
    UpdateLastWorkbookFileName = 'update-last-workbook-file-name',
    ListWorkbooks = 'list-workbooks',
    OpenWorkbook = 'open-workbook',
    SaveWorkbook = 'save-workbook',
    SaveWorkbookAs = 'save-workbook-as',
    OpenWorkbookFromFile = 'open-workbook-from-file',
    SaveWorkbookToFile = 'save-workbook-to-file',
    BeforeQuit = 'before-quit',
    MessageBox = 'message-box',
    DeleteFile = 'delete-file',
    RunRequests = 'run-requests',
    CancelRequests = 'cancel-requests'
}