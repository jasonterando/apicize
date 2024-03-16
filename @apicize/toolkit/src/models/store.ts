import { createSlice, PayloadAction, configureStore } from '@reduxjs/toolkit'
import {
  ApicizeRequest,
  BodyType,
  Method,
  NO_AUTHORIZATION,
  NO_SCENARIO,
  WorkbookAuthorizationType,
} from '@apicize/lib-typescript'
import { EditableWorkbookAuthorization } from './workbook/editable-workbook-authorization'
import { EditableWorkbookScenario } from './workbook/editable-workbook-scenario'
import { IndexedText, WorkbookExecution, WorkbookExecutionResult, WorkbookExecutionSummary } from './workbook/workbook-execution'
import { EditableWorkbookRequestEntry } from './workbook/editable-workbook-request-entry'
import { RequestTestContext } from '../controls/editors/request/request-test-context'
import { EditableNameValuePair } from './workbook/editable-name-value-pair'
import { WorkbookBodyData, WorkbookBodyType } from '@apicize/lib-typescript/dist/models/workbook/workbook-request'
import { NavigationListItem } from './navigation-list-item'

export const noAuthorization = {
  id: NO_AUTHORIZATION,
  name: 'Anonymous (None)',
  type: WorkbookAuthorizationType.None
}

export const noScenario = {
  id: NO_SCENARIO,
  name: '(None)'
}

interface ApicizeWorkbookState {


  // activeExecution: WorkbookExecution | null
  // selectedExecutionResult: WorkbookExecutionResult | null
  // groupExecutionResults: WorkbookExecutionSummary | null

  // Active authorization/scenario ID to use for running tests
}



// const updateSelectedExecutionResult = (
//   state: ApicizeWorkbookState,
//   runIndex: number | undefined,
//   resultIndex: number | undefined
// ) => {
//   if (state.activeExecution?.results
//     && runIndex !== undefined
//     && resultIndex !== undefined
//     && resultIndex <= (state.activeExecution.results[runIndex]?.length ?? -1)
//     ) {
//     state.activeExecution.runIndex = runIndex
//     state.activeExecution.resultIndex = resultIndex
//     const runResults = state.activeExecution.results[runIndex]
//     if (resultIndex === -1 && runResults.length > 1) {
//       state.selectedExecutionResult = undefined
//       state.groupExecutionResults = {
//         run: runIndex + 1,
//         totalRuns: runResults[0].totalRuns,
//         requests: runResults.map(r => ({
//           name: state.requests.entities[r.requestId]?.name ?? '(Unnamed)',
//           response: r.response ? { status: r.response.status, statusText: r.response.statusText } : undefined,
//           tests: r.tests?.map(t => ({
//             testName: t.testName,
//             success: t.success,
//             error: t.error,
//             logs: t.logs
//           })),
//           executedAt: r.executedAt,
//           milliseconds: r.milliseconds,
//           success: r.success,
//           errorMessage: r.errorMessage
//         }))
//       }
//     } else {
//       state.selectedExecutionResult = runResults[0]
//       state.groupExecutionResults = undefined
//     }
//     const matchingExecution = state.executions[state.activeExecution.requestID]
//     if (matchingExecution) {
//       matchingExecution.runIndex = runIndex
//       matchingExecution.resultIndex = resultIndex
//     }
//   } else {
//     state.selectedExecutionResult = undefined
//     state.groupExecutionResults = undefined
//   }
// }


const navigationSlice = createSlice({
  name: 'navigation',
  initialState: {
    requestList: [] as NavigationListItem[],
    authorizationList: [] as NavigationListItem[],
    scenarioList: [] as NavigationListItem[],
  },
  reducers: {
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
    }
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
    close: (state) => {
      state.id = null
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
    }
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
    close: (state) => {
      state.id = null
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
    close: (state) => {
      state.id = null
    },
    setName: (state, action: PayloadAction<string>) => {
      state.name = action.payload
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
    close: (state) => {
      state.id = null
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
    longTextInResponse: false,
    runIndex: undefined as number | undefined,
    runList: undefined as IndexedText[] | undefined,
    resultIndex: undefined as number | undefined,
    resultLists: undefined as IndexedText[][] | undefined,
  },
  reducers: {
    close: (state) => {
      state.id = undefined
    },
    setExecution: (state, action: PayloadAction<{
      id: string,
      resultType: ResultType,
      runIndex: number | undefined,
      runList: IndexedText[] | undefined,
      resultIndex: number | undefined,
      resultLists: IndexedText[][] | undefined,
      longTextInResponse: boolean,
    }>) => {
      state.id = action.payload.id
      state.running = false
      state.resultType = action.payload.resultType,
      state.runIndex = action.payload.runIndex
      state.runList = action.payload.runList
      state.resultIndex = action.payload.resultIndex
      state.resultLists = action.payload.resultLists
      state.longTextInResponse = action.payload.longTextInResponse
    },
    runStart: (state, action: PayloadAction<{
      id: string
    }>) => {
      state.id = action.payload.id
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
  }
})

export const workbookActions = workbookSlice.actions
export const navigationActions = navigationSlice.actions
export const requestActions = requestSlice.actions
export const groupActions = groupSlice.actions
export const authorizationActions = authorizationSlice.actions
export const scenarioActions = scenarioSlice.actions
export const executionActions = executionSlice.actions

export const workbookStore = configureStore({
  reducer: {
    workbook: workbookSlice.reducer,
    navigation: navigationSlice.reducer,
    request: requestSlice.reducer,
    group: groupSlice.reducer,
    authorization: authorizationSlice.reducer,
    scenario: scenarioSlice.reducer,
    execution: executionSlice.reducer,
  }
})

export type WorkbookState = ReturnType<typeof workbookStore.getState>
