import { createSlice, PayloadAction, configureStore } from '@reduxjs/toolkit'
import {
  BodyType,
  Method,
  NO_AUTHORIZATION,
  NO_SCENARIO,
  WorkbookAuthorizationType,
} from '@apicize/lib-typescript'
import { IndexedText } from './workbook/workbook-execution'
import { EditableNameValuePair } from './workbook/editable-name-value-pair'
import { WorkbookBodyData, WorkbookBodyType } from '@apicize/lib-typescript/dist/models/workbook/workbook-request'
import { NavigationListItem } from './navigation-list-item'
import { PersistenceOption } from '@apicize/lib-typescript/dist/models/workbook/workbook-authorization'

export const noAuthorization = {
  id: NO_AUTHORIZATION,
  name: 'Anonymous (None)',
  type: WorkbookAuthorizationType.None
}

export const noScenario = {
  id: NO_SCENARIO,
  name: '(None)'
}

export enum NavigationType {
  None,
  Request,
  Group,
  Authorization,
  Scenario,
}

const navigationSlice = createSlice({
  name: 'navigation',
  initialState: {
    activeType: NavigationType.None,
    activeID: null as string | null,
    activeExecutionID: null as string | null,
    requestList: [] as NavigationListItem[],
    authorizationList: [] as NavigationListItem[],
    scenarioList: [] as NavigationListItem[],
    showNavigation: false,
    appName: '',
    appVersion: ''
  },
  reducers: {
    openEditor: (state, action: PayloadAction<{
      type: NavigationType,
      id: string
    }>) => {
      // state.showHelp = false
      state.activeType = action.payload.type
      state.activeID = action.payload.id
    },
    closeEditor: (state) => {
      state.activeType = NavigationType.None
      state.activeID = null
      state.activeExecutionID = null
    },
    openExecution: (state, action: PayloadAction<string>) => {
      state.activeExecutionID = action.payload
    },
    closeExecution: (state) => {
      state.activeExecutionID = null
    },
    setLists: (state, action: PayloadAction<{
      requests: NavigationListItem[],
      authorizations: NavigationListItem[],
      scenarios: NavigationListItem[]
    }>) => {
      state.requestList = action.payload.requests
      state.authorizationList = action.payload.authorizations
      state.scenarioList = action.payload.scenarios
    },
    setRequestList: (state, action: PayloadAction<NavigationListItem[]>) => {
      state.requestList = action.payload
    },
    setAuthorizationList: (state, action: PayloadAction<NavigationListItem[]>) => {
      state.authorizationList = action.payload
    },
    setScenariosList: (state, action: PayloadAction<NavigationListItem[]>) => {
      state.scenarioList = action.payload
    },
    setShowNavigation: (state, action: PayloadAction<boolean>) => {
      state.showNavigation = action.payload
    },
    setApplicationInfo: (state, action: PayloadAction<{
      name: string, version: string
    }>) => {
      state.appName = action.payload.name
      state.appVersion = action.payload.version
    },
  }
})

const helpSlice = createSlice({
  name: 'help',
  initialState: {
    showHelp: false,
    helpTopic: null as string | null,
    nextHelpTopic: '',
    helpAnchor: '',
    helpText: '',
    helpTopicHistory: [] as string[]
  },
  reducers: {
    showHelp: (state, action: PayloadAction<{ topic: string, anchor?: string, text: string, history: string[] }>) => {
      const histLen = state.helpTopicHistory.length
      state.helpTopic = action.payload.topic
      state.helpAnchor = action.payload.anchor ?? ''
      state.helpText = action.payload.text
      state.helpTopicHistory = action.payload.history
      state.showHelp = true
    },
    hideHelp: (state) => {
      state.showHelp = false
    },
    setNextHelpTopic: (state, action: PayloadAction<string>) => {
      state.nextHelpTopic = action.payload
    },
  }
})

const requestSlice = createSlice({
  name: 'request',
  initialState: {
    id: '' as string | null,
    name: '',
    url: '',
    method: Method.Get,
    timeout: 30000,
    queryStringParams: undefined as EditableNameValuePair[] | undefined,
    headers: undefined as EditableNameValuePair[] | undefined,
    bodyType: undefined as WorkbookBodyType | undefined,
    bodyData: undefined as WorkbookBodyData | undefined,
    test: undefined as string | undefined,
  },
  reducers: {
    initialize: (state, action: PayloadAction<{
      id: string,
      name: string,
      url: string,
      method: Method,
      timeout: number,
      queryStringParams: EditableNameValuePair[] | undefined,
      headers: EditableNameValuePair[] | undefined,
      bodyType: WorkbookBodyType | undefined,
      bodyData: WorkbookBodyData | undefined,
      test: string | undefined,
    }>) => {
      state.id = action.payload.id
      state.name = action.payload.name,
        state.url = action.payload.url,
        state.method = action.payload.method,
        state.timeout = action.payload.timeout
      state.queryStringParams = action.payload.queryStringParams
      state.headers = action.payload.headers
      state.bodyType = action.payload.bodyType,
        state.bodyData = action.payload.bodyData,
        state.test = action.payload.test
    },
    setName: (state, action: PayloadAction<string>) => {
      state.name = action.payload
    },
    setURL: (state, action: PayloadAction<string>) => {
      state.url = action.payload
    },
    setMethod: (state, action: PayloadAction<Method>) => {
      state.method = action.payload
    },
    setRequestTimeout: (state, action: PayloadAction<number>) => {
      state.timeout = action.payload
    },
    setQueryStringParams: (state, action: PayloadAction<EditableNameValuePair[] | undefined>) => {
      state.queryStringParams = action.payload
    },
    setHeaders: (state, action: PayloadAction<EditableNameValuePair[] | undefined>) => {
      state.headers = action.payload
    },
    setBody: (state, action: PayloadAction<{ type: BodyType, data: WorkbookBodyData }>) => {
      state.bodyType = action.payload.type
      state.bodyData = action.payload.data
    },
    setTest: (state, action: PayloadAction<string | undefined>) => {
      state.test = action.payload
    },
  }
})

const groupSlice = createSlice({
  name: 'group',
  initialState: {
    id: '' as string | null,
    name: '',
    runs: 1,
  },
  reducers: {
    initialize: (state, action: PayloadAction<{
      id: string,
      name: string,
      runs: number,
    }>) => {
      state.id = action.payload.id
      state.name = action.payload.name
      state.runs = action.payload.runs
    },
    setName: (state, action: PayloadAction<string>) => {
      state.name = action.payload
    },
    setRuns: (state, action: PayloadAction<number>) => {
      state.runs = action.payload
    }
  }
})

const authorizationSlice = createSlice({
  name: 'authorization',
  initialState: {
    id: '' as string | null,
    name: '',
    persistence: PersistenceOption.Workbook,
    type: WorkbookAuthorizationType.None,
    username: undefined as string | undefined,
    password: undefined as string | undefined,
    accessTokenUrl: undefined as string | undefined,
    clientId: undefined as string | undefined,
    clientSecret: undefined as string | undefined,
    scope: undefined as string | undefined,
    header: undefined as string | undefined,
    value: undefined as string | undefined
  },
  reducers: {
    initialize: (state, action: PayloadAction<{
      id: string,
      name: string,
      persistence: PersistenceOption,
      type: WorkbookAuthorizationType,
      username: string | undefined,
      password: string | undefined,
      accessTokenUrl: string | undefined,
      clientId: string | undefined,
      clientSecret: string | undefined,
      scope: string | undefined,
      header: string | undefined,
      value: string | undefined
    }>) => {
      state.id = action.payload.id
      state.name = action.payload.name
      state.persistence = action.payload.persistence,
        state.type = action.payload.type
      state.username = action.payload.username
      state.password = action.payload.password
      state.accessTokenUrl = action.payload.accessTokenUrl
      state.clientId = action.payload.clientId
      state.clientSecret = action.payload.clientSecret
      state.scope = action.payload.scope
      state.header = action.payload.header
      state.value = action.payload.value
    },
    setName: (state, action: PayloadAction<string>) => {
      state.name = action.payload
    },
    setPersistence: (state, action: PayloadAction<PersistenceOption>) => {
      state.persistence = action.payload
    },
    setType: (state, action: PayloadAction<WorkbookAuthorizationType>) => {
      state.type = action.payload
    },
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload
    },
    setPassword: (state, action: PayloadAction<string>) => {
      state.password = action.payload
    },
    setAccessTokenUrl: (state, action: PayloadAction<string>) => {
      state.accessTokenUrl = action.payload
    },
    setClientId: (state, action: PayloadAction<string>) => {
      state.clientId = action.payload
    },
    setClientSecret: (state, action: PayloadAction<string>) => {
      state.clientSecret = action.payload
    },
    setScope: (state, action: PayloadAction<string>) => {
      state.scope = action.payload
    },
    setHeader: (state, action: PayloadAction<string>) => {
      state.header = action.payload
    },
    setValue: (state, action: PayloadAction<string>) => {
      state.value = action.payload
    },
  }
})

const scenarioSlice = createSlice({
  name: 'scenario',
  initialState: {
    id: '' as string | null,
    name: '',
    variables: undefined as EditableNameValuePair[] | undefined
  },
  reducers: {
    initialize: (state, action: PayloadAction<{
      id: string,
      name: string,
      variables: EditableNameValuePair[] | undefined
    }>) => {
      state.id = action.payload.id
      state.name = action.payload.name
      state.variables = action.payload.variables
    },
    setName: (state, action: PayloadAction<string>) => {
      state.name = action.payload
    },
    setVariables: (state, action: PayloadAction<EditableNameValuePair[] | undefined>) => {
      state.variables = action.payload
    },
  }
})

const workbookSlice = createSlice({
  name: 'workbook',
  initialState: {
    workbookFullName: undefined as string | undefined,
    workbookDisplayName: undefined as string | undefined,
    dirty: false,

  },
  reducers: {

    setDirty: (state, action: PayloadAction<boolean>) => {
      state.dirty = action.payload
    },

    // Called when opening a workbook to initialize state
    initializeWorkbook: (state, action: PayloadAction<{
      fullName: string,
      displayName: string,
    }>) => {
      state.workbookFullName = action.payload.fullName
      state.workbookDisplayName = action.payload.displayName
      state.dirty = false
    },

    // Called when workbook is saved
    saveWorkbook: (state, action: PayloadAction<{
      fullName: string,
      displayName: string
    }>) => {
      state.workbookFullName = action.payload.fullName
      state.workbookDisplayName = action.payload.displayName
      state.dirty = false
    },

  }
})

export enum ResultType { Single, Group, Failed, None }

const executionSlice = createSlice({
  name: 'execution',
  initialState: {
    id: undefined as string | undefined,
    selectedAuthorizationID: NO_AUTHORIZATION,
    selectedScenarioID: NO_SCENARIO,
    running: false,
    resultType: ResultType.None,
    failedTestCount: undefined as number | undefined,
    longTextInResponse: false,
    runIndex: undefined as number | undefined,
    runList: undefined as IndexedText[] | undefined,
    resultIndex: undefined as number | undefined,
    resultLists: undefined as IndexedText[][] | undefined,
    currentResultSuccess: null as boolean | null,
    panel: ''
  },
  reducers: {
    setExecution: (state, action: PayloadAction<{
      id: string,
      resultType: ResultType,
      failedTestCount: number | undefined,
      runIndex: number | undefined,
      runList: IndexedText[] | undefined,
      resultIndex: number | undefined,
      resultLists: IndexedText[][] | undefined,
      longTextInResponse: boolean
    }>) => {
      state.id = action.payload.id
      state.running = false
      state.resultType = action.payload.resultType,
        state.failedTestCount = action.payload.failedTestCount,
        state.runIndex = action.payload.runIndex
      state.runList = action.payload.runList
      state.resultIndex = action.payload.resultIndex
      state.resultLists = action.payload.resultLists
      state.longTextInResponse = action.payload.longTextInResponse
      if (state.panel === 'Info' && action.payload.resultType !== ResultType.Single && action.payload.resultType !== ResultType.Group) {
        state.panel = 'Info'
      }
    },
    runStart: (state, action: PayloadAction<string>) => {
      state.id = action.payload
      state.running = true
      state.resultType = ResultType.None
    },
    runCancel: (state, action: PayloadAction<{
      id: string
    }>) => {
      state.id = action.payload.id
      state.running = false
      state.resultType = ResultType.None
    },
    setResult: (state, action: PayloadAction<{
      resultIndex: number | undefined,
      resultLists: IndexedText[][] | undefined,
    }>) => {
      state.resultIndex = action.payload.resultIndex
      state.resultLists = action.payload.resultLists
    },
    setSelected: (state, action: PayloadAction<{
      selectedAuthorizationID: string,
      selectedScenarioID: string
    }>) => {
      state.selectedAuthorizationID = action.payload.selectedAuthorizationID
      state.selectedScenarioID = action.payload.selectedScenarioID
    },
    setPanel: (state, action: PayloadAction<string>) => {
      state.panel = action.payload
    }
  }
})

export const workbookActions = workbookSlice.actions
export const navigationActions = navigationSlice.actions
export const helpActions = helpSlice.actions
export const requestActions = requestSlice.actions
export const groupActions = groupSlice.actions
export const authorizationActions = authorizationSlice.actions
export const scenarioActions = scenarioSlice.actions
export const executionActions = executionSlice.actions

export const workbookStore = configureStore({
  reducer: {
    workbook: workbookSlice.reducer,
    navigation: navigationSlice.reducer,
    help: helpSlice.reducer,
    request: requestSlice.reducer,
    group: groupSlice.reducer,
    authorization: authorizationSlice.reducer,
    scenario: scenarioSlice.reducer,
    execution: executionSlice.reducer,
  }
})

export type WorkbookState = ReturnType<typeof workbookStore.getState>
