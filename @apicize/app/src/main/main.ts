import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron'
import { AuthorizationProviderFactory, FetchDispatcher, LocalStorageProvider, SettingsProvider, Runner, TestEvaluationService } from '@apicize/engine'
import MenuBuilder from './menu'
import { ApicizeEvents, EditableWorkbookAuthorization, EditableWorkbookEnvironment, EditableWorkbookRequestItem, Result, StateStorage, WorkbookAuthorization, WorkbookEnvironment, WorkbookRequest } from '@apicize/definitions'
import { promises as fs } from 'node:fs'
import installExtension, { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } from 'electron-devtools-installer';

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

let mainWindow: BrowserWindow | undefined

const runner = new Runner(
  new FetchDispatcher(
    new AuthorizationProviderFactory(),
  ),
  new TestEvaluationService()
)

// const devMode =
//     process.env.NODE_ENV === 'development' ||
//     process.env.DEBUG_PROD === 'true'

const initHandlersAndWindow = async (): Promise<void> => {
  
  // if (devMode) {
  //   await installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS])
  //     .then((name) => console.log(`Added Extension:  ${name}`))
  //     .catch((err) => console.log('An error occurred: ', err));
  // }

  const settingsProvider = new SettingsProvider()
  const localStorage = new LocalStorageProvider()

  // Register event for retriving settings
  ipcMain.handle(ApicizeEvents.GetSettings, () => settingsProvider.settings)

  // Register event to track what the last opened or saved file name was
  ipcMain.handle(ApicizeEvents.UpdateLastWorkbookFileName, (_: IpcMainInvokeEvent, fileName: string): Promise<void> => {
    // const isFileActive = fileName.length > 0
    if (fileName.length > 0) settingsProvider.lastWorkbookFileName = fileName
    return Promise.resolve()
  })

  // Register event for list workbooks
  ipcMain.handle(ApicizeEvents.ListWorkbooks, async (_: IpcMainInvokeEvent, directory: string) => {
    return await localStorage.listWorkbooks(directory)
  })

  // Register to open workbooks
  ipcMain.handle(ApicizeEvents.OpenWorkbookFromFile, async (_: IpcMainInvokeEvent, ...name: string[]) => {
    const result = await localStorage.openWorkbook(...name)
    if (!(result instanceof Error)) {
      mainWindow.setTitle(`Apicize - ${result.displayName}`)
    }
    return result
  })

  // Register to write workbooks
  ipcMain.handle(ApicizeEvents.SaveWorkbookToFile, async (
    _: IpcMainInvokeEvent, 
    requests: StateStorage<EditableWorkbookRequestItem>,
    authorizations: StateStorage<EditableWorkbookAuthorization>,
    environments: StateStorage<EditableWorkbookEnvironment>,
    ...name: string[]) => {
    const result = await localStorage.saveWorkbook(requests, authorizations, environments, ...name)
    if (!(result instanceof Error)) {
      mainWindow.setTitle(`Apicize - ${result.displayName}`)
    }
    return result
  })

  // Register to delete files
  ipcMain.handle(ApicizeEvents.DeleteFile, async (_: IpcMainInvokeEvent, fileName: string): Promise<Error | unknown> => {
    try {
      await fs.unlink(fileName)
    } catch (e) {
      return new Error(`Unable to delete - ${e}`)
    }
  })

  // Register to run list of requets
  ipcMain.handle(ApicizeEvents.RunRequests, async (_: IpcMainInvokeEvent, requests: WorkbookRequest[], authorization: WorkbookAuthorization, environment: WorkbookEnvironment):
    Promise<Result[]> => {
    return await runner.run(requests, authorization, environment)
  })

  // Register to cancel list of requets
  ipcMain.handle(ApicizeEvents.CancelRequests, async (_: IpcMainInvokeEvent, requests: WorkbookRequest[]):
    Promise<unknown> => {
    runner.cancel(requests.map(r => r.id))
    return Promise.resolve()
  })

  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1024,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false
    },
  })

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)

  mainWindow.maximize()

  const menuBuilder = new MenuBuilder(mainWindow)
  menuBuilder.buildMenu()

  // Open the DevTools.
  mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', initHandlersAndWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    initHandlersAndWindow()
  }
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
