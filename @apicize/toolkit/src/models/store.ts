import { createSlice, PayloadAction, configureStore } from '@reduxjs/toolkit'
import {
  Method,
  NO_AUTHORIZATION,
  BodyType,
  NO_SCENARIO,
  GetTitle,
  WorkbookAuthorizationType,
} from '@apicize/lib-typescript'
import { GenerateIdentifier } from '../services/random-identifier-generator'
import { EditableWorkbookRequest } from './workbook/editable-workbook-request'
import { EditableWorkbookRequestGroup } from './workbook/editable-workbook-request-group'
import { EditableWorkbookApiKeyAuthorization, EditableWorkbookAuthorization, EditableWorkbookBasicAuthorization, EditableWorkbookOAuth2ClientAuthorization } from './workbook/editable-workbook-authorization'
import { EditableWorkbookScenario } from './workbook/editable-workbook-scenario'
import { addRequestEntryToStore, castEntryAsGroup, castEntryAsRequest, deleteRequestEntryFromStore } from './workbook/helpers/editable-workbook-request-helpers'
import { StateStorage, moveInStorage } from './state-storage'
import { EditableNameValuePair } from './workbook/editable-name-value-pair'
import { ApicizeResult } from '@apicize/lib-typescript/dist/models/lib/apicize-result'
import { WorkbookBodyData } from '@apicize/lib-typescript/dist/models/workbook/workbook-request'
import { ApicizeRunResultsToWorkbookExecutionResults, IndexedText, WorkbookExecution, WorkbookExecutionResult, WorkbookExecutionSummary } from './workbook/workbook-execution'
import { EditableWorkbookRequestEntry } from './workbook/editable-workbook-request-entry'

export interface NavigationListItem {
  id: string
  name: string
  type: string
  children?: NavigationListItem[]
}

export const noAuthorization = {
  id: NO_AUTHORIZATION,
  name: 'Anonymous (None)',
  type: WorkbookAuthorizationType.None
}

export const noScenario = {
  id: NO_SCENARIO,
  name: '(None)'
}

const encodeFormData = (data: EditableNameValuePair[]) => {
  if (data.length === 0) return ''

  const result = data.map(nv =>
    `${encodeURIComponent(nv.name)}=${encodeURIComponent(nv.value)}`
  ).join('&')
  return result
}

const decodeFormData = (bodyData: string | number[] | undefined) => {
  let data: string | undefined;
  if (bodyData instanceof Array) {
    const buffer = Uint8Array.from(bodyData)
    data = (new TextDecoder()).decode(buffer)
  } else {
    data = bodyData
  }
  if (data && data.length > 0) {
    const parts = data.split('&')
    return parts.map(p => {
      const id = GenerateIdentifier()
      const nv = p.split('=')
      if (nv.length == 1) {
        return { id, name: decodeURIComponent(nv[0]), value: "" } as EditableNameValuePair
      } else {
        return { id, name: decodeURIComponent(nv[0]), value: decodeURIComponent(nv[1]) } as EditableNameValuePair
      }
    })
  } else {
    return []
  }
}

interface ApicizeWorkbookState {
  workbookFullName?: string
  workbookDisplayName?: string

  dirty: boolean
  runningCount: number
  longTextInResponse: boolean

  // Entire list of entities being managed
  requests: StateStorage<EditableWorkbookRequestEntry>
  authorizations: StateStorage<EditableWorkbookAuthorization>
  scenarios: StateStorage<EditableWorkbookScenario>

  executions: { [requestID: string]: WorkbookExecution }

  // Lists to display for navigation
  requestList: NavigationListItem[]
  authorizationList: NavigationListItem[]
  scenarioList: NavigationListItem[]

  // Active entity being edited
  activeRequestEntry: EditableWorkbookRequestEntry | undefined
  activeExecution: WorkbookExecution | undefined
  activeAuthorization: EditableWorkbookAuthorization | undefined
  activeScenario: EditableWorkbookScenario | undefined

  // Active authorization/scenario ID to use for running tests
  selectedAuthorization: EditableWorkbookAuthorization
  selectedScenario: EditableWorkbookScenario
  selectedExecutionResult: WorkbookExecutionResult | undefined
  groupExecutionResults: WorkbookExecutionSummary | undefined
}

// Tally the number of running tests
const updateRunningCount = (state: ApicizeWorkbookState) => {
  state.runningCount = Object.values(state.executions).reduce(
    (total, result) => total += result.running === true ? 1 : 0, 0)
}

// Generate request navigation list
const updateRequestNavList = (state: ApicizeWorkbookState) => {
  const mapItem = (id: string) => {
    const requestItem = state.requests.entities[id]
    const result: NavigationListItem = { id, name: GetTitle(requestItem), type: 'request' }
    const children = state.requests.childIDs ? state.requests.childIDs[id] : undefined
    if (children) {
      result.children = children.map(id => mapItem(id))
    } else {
      result.children = undefined
    }
    return result
  }
  state.requestList = state.requests.topLevelIDs.map(id => mapItem(id))
}

// Generate authorization navigation list
const updateAuthorizationNavList = (state: ApicizeWorkbookState) => {
  state.authorizationList = state.authorizations.topLevelIDs.map(id => (
    { id, name: GetTitle(state.authorizations.entities[id]), type: 'auth' }
  ))
}

// Generate scenario navigation list
const updateScenarioNavList = (state: ApicizeWorkbookState) => {
  state.scenarioList = state.scenarios.topLevelIDs.map(id => (
    { id, name: GetTitle(state.scenarios.entities[id]), type: 'scenario' }
  ))
}

// Update active state properties
const updateActive = (
  state: ApicizeWorkbookState,
  request: EditableWorkbookRequestEntry | undefined,
  authorization: EditableWorkbookAuthorization | undefined,
  scenario: EditableWorkbookScenario | undefined) => {
  state.activeRequestEntry = request
  state.activeAuthorization = authorization
  state.activeScenario = scenario
  state.activeExecution = request ? state.executions[request.id] : undefined
  updateSelectedExecutionResult(state,
    state.activeExecution?.runIndex,
    state.activeExecution?.resultIndex
  )
}

const updateSelectedExecutionResult = (
  state: ApicizeWorkbookState,
  runIndex: number | undefined,
  resultIndex: number | undefined
) => {
  if (state.activeExecution?.results
    && runIndex !== undefined
    && resultIndex !== undefined
    && resultIndex <= (state.activeExecution.results[runIndex]?.length ?? -1)
    ) {
    state.activeExecution.runIndex = runIndex
    state.activeExecution.resultIndex = resultIndex
    const runResults = state.activeExecution.results[runIndex]
    if (resultIndex === -1 && runResults.length > 1) {
      state.selectedExecutionResult = undefined
      state.groupExecutionResults = {
        run: runIndex + 1,
        totalRuns: runResults[0].totalRuns,
        requests: runResults.map(r => ({
          name: state.requests.entities[r.requestId]?.name ?? '(Unnamed)',
          response: r.response ? { status: r.response.status, statusText: r.response.statusText } : undefined,
          tests: r.tests?.map(t => ({
            testName: t.testName,
            success: t.success,
            error: t.error,
            logs: t.logs
          })),
          executedAt: r.executedAt,
          milliseconds: r.milliseconds,
          success: r.success,
          errorMessage: r.errorMessage
        }))
      }
    } else {
      state.selectedExecutionResult = runResults[0]
      state.groupExecutionResults = undefined
    }
    const matchingExecution = state.executions[state.activeExecution.requestID]
    if (matchingExecution) {
      matchingExecution.runIndex = runIndex
      matchingExecution.resultIndex = resultIndex
    }
  } else {
    state.selectedExecutionResult = undefined
    state.groupExecutionResults = undefined
  }
}

export const defaultWorkbookState: ApicizeWorkbookState = {
  dirty: false,
  runningCount: 0,
  longTextInResponse: false,
  requests: { entities: {}, topLevelIDs: [] },
  authorizations: { entities: {}, topLevelIDs: [] },
  scenarios: { entities: {}, topLevelIDs: [] },
  executions: {},
  requestList: [],
  authorizationList: [],
  scenarioList: [],
  activeRequestEntry: undefined,
  activeExecution: undefined,
  selectedExecutionResult: undefined,
  groupExecutionResults: undefined,
  activeAuthorization: undefined,
  activeScenario: undefined,
  selectedAuthorization: noAuthorization,
  selectedScenario: noScenario,
}

const apicizeSlice = createSlice({
  name: 'apicize',
  initialState: defaultWorkbookState,
  reducers: {
    // Called when workbook is opened to initialize state
    initializeWorkbook: (state, action: PayloadAction<{
      fullName: string,
      displayName: string,
      requests: StateStorage<EditableWorkbookRequestEntry>,
      authorizations: StateStorage<EditableWorkbookAuthorization>,
      scenarios: StateStorage<EditableWorkbookScenario>,
      selectedAuthorization: EditableWorkbookAuthorization | undefined,
      selectedScenario: EditableWorkbookScenario | undefined,
    }>) => {
      state.workbookFullName = action.payload.fullName
      state.workbookDisplayName = action.payload.displayName
      state.dirty = false

      state.requests = action.payload.requests
      state.authorizations = action.payload.authorizations
      state.scenarios = action.payload.scenarios

      updateRequestNavList(state)
      updateAuthorizationNavList(state)
      updateScenarioNavList(state)

      // Set active element to first request/group
      let activeRequest: EditableWorkbookRequestEntry | undefined
      if (state.requests.topLevelIDs.length > 0) {
        activeRequest = state.requests.entities[state.requests.topLevelIDs[0]]
      }
      updateActive(state, activeRequest, undefined, undefined)

      // default first auth/sencario for execution
      state.selectedAuthorization = action.payload.selectedAuthorization
        ? action.payload.selectedAuthorization : noAuthorization
      state.selectedScenario = action.payload.selectedScenario
        ? action.payload.selectedScenario : noScenario
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

    // Called when workbook has been updated
    setWorkbookDirty: (state, action: PayloadAction<boolean>) => {
      state.dirty = action.payload
    },

    addNewRequest: (
      state,
      action: PayloadAction<{ targetRequestId: string | undefined }>
    ) => {
      const request = {
        id: GenerateIdentifier(),
        name: '',
        method: Method.Get,
        url: '',
        timeout: 5000,
        test: `describe('status', () => {
   it('equals 200', () => {
      expect(response.status).to.equal(200)
   })
})`
      } as EditableWorkbookRequest

      addRequestEntryToStore(state.requests, request, false, action.payload.targetRequestId)
      updateActive(state, request, undefined, undefined)
      updateRequestNavList(state)
      state.dirty = true
    },

    updateRequest: (
      state,
      action: PayloadAction<{
        id: string
        name?: string
        url?: string
        method?: string
        timeout?: number
        headers?: EditableNameValuePair[]
        queryString?: EditableNameValuePair[]
        bodyType?: BodyType
        bodyData?: WorkbookBodyData
        test?: string | null
      }>
    ) => {
      const match = state.requests.entities[action.payload.id] as EditableWorkbookRequest
      if (match === undefined) {
        throw new Error(`Invalid request ID ${action.payload.id}`)
      }
      if (action.payload.name !== undefined) {
        match.name = action.payload.name
      }
      if (action.payload.url !== undefined) {
        match.url = action.payload.url
      }
      if (action.payload.method !== undefined) {
        match.method = (action.payload.method as Method) ?? Method.Get
      }
      if (action.payload.timeout !== undefined) {
        match.timeout = (action.payload.timeout ?? 0)
      }
      if (action.payload.queryString !== undefined) {
        match.queryStringParams = (action.payload.queryString?.length ?? 0) > 0
          ? action.payload.queryString
          : undefined
      }
      if (action.payload.headers !== undefined) {
        match.headers = (action.payload.headers?.length ?? 0) > 0
          ? action.payload.headers
          : undefined
      }
      if (action.payload.bodyType !== undefined) {

        let newBodyData = match.body?.data
        let newBodyType = action.payload.bodyType
        let oldBodyType = match.body?.type ?? BodyType.Text

        if (newBodyType !== match.body?.type) {
          switch (newBodyType) {
            case BodyType.Raw:
              newBodyData = Array.from((new TextEncoder()).encode(newBodyData?.toString() ?? ''))
              break
            case BodyType.Form:
              const formData = decodeFormData(newBodyData as string)
              formData.forEach(d => (d as EditableNameValuePair).id = GenerateIdentifier())
              newBodyData = formData
              break
            default:
              switch (oldBodyType) {
                case BodyType.Form:
                  newBodyData = encodeFormData(newBodyData as EditableNameValuePair[])
                  break
                case BodyType.Raw:
                  const data = newBodyData as number[] | undefined
                  if (data && data.length > 0) {
                    newBodyData = (new TextDecoder('utf-8')).decode(Uint8Array.from(data))
                  } else {
                    newBodyData = ''
                  }
                  break
              }
              break
          }
        }

        match.body = {
          type: newBodyType,
          data: newBodyData
        }
      }

      if (action.payload.bodyData !== undefined) {
        match.body = {
          type: match.body?.type ?? BodyType.Text,
          data: action.payload.bodyData
        }
      }

      if (action.payload.test !== undefined) {
        match.test = (action.payload.test && action.payload.test.length > 0) ? action.payload.test : undefined
      }

      match.dirty = true
      state.dirty = true
      if (state.activeRequestEntry?.id === action.payload.id) {
        state.activeRequestEntry = match
      }
      updateRequestNavList(state)
    },

    duplicateRequestEntry: (
      state,
      action: PayloadAction<EditableWorkbookRequestEntry>) => {
      const source = action.payload

      // Return the ID of the duplicated entry
      const copyEntry = (entry: EditableWorkbookRequestEntry) => {
        // For some reason, structuredClone doesn't work with requests reliably
        // const dupe = structuredClone(entry)
        const dupe = JSON.parse(JSON.stringify(entry))
        dupe.id = GenerateIdentifier()
        dupe.name = `${GetTitle(dupe)} - copy`
        dupe.dirty = true

        const request = castEntryAsRequest(dupe)
        if (request) {
          request?.headers?.forEach(h => h.id = GenerateIdentifier())
          request?.queryStringParams?.forEach(p => p.id = GenerateIdentifier())
          state.requests.entities[request.id] = request
          return request.id
        }

        const group = castEntryAsGroup(dupe)
        if (group) {
          if (state.requests.childIDs && state.requests.childIDs) {
            const sourceChildIDs = state.requests.childIDs[source.id]
            if (sourceChildIDs.length > 0) {
              const dupedChildIDs: string[] = []
              state.requests.childIDs[group.id] = dupedChildIDs

              sourceChildIDs.forEach(childID => {
                const childEntry = state.requests.entities[childID]
                const dupedChildID = copyEntry(childEntry)
                dupedChildIDs.push(dupedChildID)
              })
            }
          }
          state.requests.entities[group.id] = group
          return group.id
        }

        throw new Error('Invalid entry')
      }

      const dupedEntryID = copyEntry(action.payload)

      let append = true
      const idx = state.requests.topLevelIDs.findIndex(id => id === source.id)
      if (idx !== -1) {
        state.requests.topLevelIDs.splice(idx + 1, 0, dupedEntryID)
        append = false
      }
      if (append) {
        state.requests.topLevelIDs.push(dupedEntryID)
      }
      updateRequestNavList(state)
      updateActive(state, state.requests.entities[dupedEntryID], undefined, undefined)
      state.dirty = true
    },

    deleteRequestEntry: (state, action: PayloadAction<string>) => {
      const isActive = action.payload === state.activeRequestEntry?.id
      deleteRequestEntryFromStore(state.requests, action.payload)
      // if (isActive) {
      // todo - come up with a way to figure out what to highlight after delete
      // state.activeRequest = index === -1 ? undefined : state.requests[index]
      // } else {
      // }
      updateActive(state, undefined, undefined, undefined)
      updateRequestNavList(state)
      state.dirty = true
    },

    addNewRequestGroup: (
      state,
      action: PayloadAction<{ targetRequestId: string | undefined }>
    ) => {
      const group = {
        id: GenerateIdentifier(),
        name: '',
        children: [],
        runs: 1
      } as EditableWorkbookRequestGroup

      addRequestEntryToStore(state.requests, group, true, action.payload.targetRequestId)
      updateActive(state, group, undefined, undefined)
      updateRequestNavList(state)
      state.dirty = true
    },

    updateRequestGroup: (
      state,
      action: PayloadAction<{
        id: string,
        name?: string,
        runs?: number
      }>
    ) => {
      const group = state.requests.entities[action.payload.id] as EditableWorkbookRequestGroup
      if (!group) {
        throw new Error(`Invalid request group ID ${action.payload.id}`)
      }
      if (action.payload.name !== undefined) {
        group.name = action.payload.name
      }
      if (action.payload.runs !== undefined) {
        group.runs = action.payload.runs
      }
      updateRequestNavList(state)
      group.dirty = true
      state.dirty = true
    },

    moveRequest: (
      state,
      action: PayloadAction<{ id: string, destinationID: string | null }>
    ) => {
      moveInStorage<EditableWorkbookRequestEntry>(action.payload.id, action.payload.destinationID, state.requests)
      updateRequestNavList(state)
      updateActive(state, state.requests.entities[action.payload.id], undefined, undefined)
    },

    setActiveRequestEntry: (
      state,
      action: PayloadAction<{ id: string | undefined }>
    ) => {
      if (action.payload.id) {
        const item = state.requests.entities[action.payload.id]
        updateActive(state, item, undefined, undefined)
      } else {
        updateActive(state, undefined, undefined, undefined)
      }
    },

    addNewAuthorization: (
      state,
      action: PayloadAction<{ targetAuthId: string | undefined }>
    ) => {
      const auth = {
        id: GenerateIdentifier(),
        name: '',
        type: WorkbookAuthorizationType.Basic,
        data: {
          username: '',
          password: '',
          accessTokenUrl: '',
          clientID: '',
          clientSecret: '',
          scope: '',
          // sendCredentialsInBody: false,
          header: 'x-api-key',
          value: ''
        },
      }

      state.authorizations.entities[auth.id] = auth
      const idx = action.payload.targetAuthId
        ? state.authorizations.topLevelIDs.indexOf(action.payload.targetAuthId)
        : -1
      state.authorizations.topLevelIDs.splice(idx === -1 ? 0 : idx, 0, auth.id)
      updateAuthorizationNavList(state)
      updateActive(state, undefined, auth, undefined)
      state.dirty = true
    },

    duplicateAuthorization: (
      state,
      action: PayloadAction<EditableWorkbookAuthorization>) => {
      const source = action.payload
      const auth = structuredClone(source)
      auth.id = GenerateIdentifier()
      auth.name = `${GetTitle(source)} - Copy`
      auth.dirty = true
      let append = true
      const idx = state.authorizations.topLevelIDs.findIndex(id => id === source.id)
      if (idx !== -1) {
        state.authorizations.topLevelIDs.splice(idx + 1, 0, auth.id)
        append = false
      }
      if (append) {
        state.authorizations.topLevelIDs.push(auth.id)
      }
      state.authorizations.entities[auth.id] = auth
      updateAuthorizationNavList(state)
      updateActive(state, undefined, auth, undefined)
      state.dirty = true
    },

    deleteAuthorization: (state, action: PayloadAction<string>) => {
      const isActive = action.payload === state.activeAuthorization?.id
      if (state.selectedAuthorization.id === action.payload) {
        state.selectedAuthorization = noAuthorization
      }
      let index = state.authorizations.topLevelIDs.indexOf(action.payload)
      if (index === -1) {
        throw new Error(`Invalid authorization ID ${action.payload}`)
      }
      state.authorizations.topLevelIDs.splice(index, 1)
      delete state.authorizations.entities[action.payload]

      if (isActive) {
        if (state.authorizations.topLevelIDs.length > 0) {
          if (index >= state.authorizations.topLevelIDs.length)
            index = state.authorizations.topLevelIDs.length - 1
        } else {
          index = -1
        }
        state.activeAuthorization =
          index === -1 ? undefined : state.authorizations.entities[state.authorizations.topLevelIDs[index]]
      }
      updateAuthorizationNavList(state)
      state.dirty = true
    },

    updateAuthorization: (
      state,
      action: PayloadAction<{
        id: string
        name?: string
        type?: string
        // API Key
        header?: string
        value?: string
        // Basic
        username?: string
        password?: string
        // OAuth 2
        accessTokenUrl?: string
        clientID?: string
        clientSecret?: string
        scope?: string
        // sendCredentialsInBody?: boolean
      }>
    ) => {
      const match = state.authorizations.entities[action.payload.id]
      if (!match)
        throw new Error(`Invalid authorization ID ${action.payload.id}`)

      if (action.payload.name !== undefined) {
        match.name = action.payload.name
      }
      if (action.payload.type !== undefined) {
        match.type = (action.payload.type as WorkbookAuthorizationType) ??
          WorkbookAuthorizationType.Basic
      }
      switch (match.type) {
        case WorkbookAuthorizationType.ApiKey:
          if (action.payload.header !== undefined) {
            (match as EditableWorkbookApiKeyAuthorization).header = action.payload.header
          }
          if (action.payload.value !== undefined) {
            (match as EditableWorkbookApiKeyAuthorization).value = action.payload.value
          }
          break;
        case WorkbookAuthorizationType.Basic:
          if (action.payload.username !== undefined) {
            (match as EditableWorkbookBasicAuthorization).username = action.payload.username
          }
          if (action.payload.password !== undefined) {
            (match as EditableWorkbookBasicAuthorization).password = action.payload.password
          }
          break;
        case WorkbookAuthorizationType.OAuth2Client:
          if (action.payload.accessTokenUrl !== undefined) {
            (match as EditableWorkbookOAuth2ClientAuthorization).accessTokenUrl = action.payload.accessTokenUrl
          }
          if (action.payload.clientID !== undefined) {
            (match as EditableWorkbookOAuth2ClientAuthorization).clientId = action.payload.clientID
          }
          if (action.payload.clientSecret !== undefined) {
            (match as EditableWorkbookOAuth2ClientAuthorization).clientSecret = action.payload.clientSecret
          }
          if (action.payload.scope !== undefined) {
            (match as EditableWorkbookOAuth2ClientAuthorization).scope = action.payload.scope
          }
          // if (action.payload.sendCredentialsInBody !== undefined) {
          //   (match as EditableWorkbookOAuth2ClientAuthorization).sendCredentialsInBody = action.payload.sendCredentialsInBody
          // }
          break;
      }

      match.dirty = true
      state.dirty = true

      if (state.selectedAuthorization.id === match.id) {
        state.selectedAuthorization = match
      }

      if (state.activeAuthorization?.id === match.id) {
        state.activeAuthorization = match
      }

      updateAuthorizationNavList(state)
    },

    moveAuthorization: (
      state,
      action: PayloadAction<{ id: string, destinationID: string | null }>
    ) => {
      moveInStorage<EditableWorkbookAuthorization>(action.payload.id, action.payload.destinationID, state.authorizations)
      updateAuthorizationNavList(state)
      updateActive(state, undefined, state.authorizations.entities[action.payload.id], undefined)
    },

    setActiveAuthorization: (
      state,
      action: PayloadAction<{ id: string | undefined }>
    ) => {
      if (action.payload.id) {
        const match = state.authorizations.entities[action.payload.id]
        if (match) {
          updateActive(state, undefined, match, undefined)
          return
        }
      }
      updateActive(state, undefined, undefined, undefined)
    },

    setSelectedAuthorization: (
      state,
      action: PayloadAction<string | undefined>
    ) => {
      if (action.payload && action.payload !== NO_AUTHORIZATION) {
        const match = state.authorizations.entities[action.payload]
        if (!match) throw new Error(`Invalid authorization ID ${action.payload}`)
        state.selectedAuthorization = match
      } else {
        state.selectedAuthorization = noAuthorization
      }
    },

    addNewScenario: (
      state,
      action: PayloadAction<{ targetScenarioId: string | undefined }>
    ) => {
      const scenario = {
        id: GenerateIdentifier(),
        name: '',
        variables: []
      }
      state.scenarios.entities[scenario.id] = scenario
      const idx = action.payload.targetScenarioId
        ? state.scenarios.topLevelIDs.indexOf(action.payload.targetScenarioId)
        : -1
      state.scenarios.topLevelIDs.splice(idx === -1 ? 0 : idx, 0, scenario.id)
      updateScenarioNavList(state)
      updateActive(state, undefined, undefined, scenario)
      state.dirty = true
    },

    duplicateScenario: (
      state,
      action: PayloadAction<EditableWorkbookScenario>) => {
      const source = action.payload
      const scenario = structuredClone(source)
      scenario.id = GenerateIdentifier()
      scenario.name = `${GetTitle(source)} - Copy`
      scenario.variables?.forEach(v => v.id = GenerateIdentifier())
      scenario.dirty = true
      let append = true
      const idx = state.scenarios.topLevelIDs.findIndex(id => id === source.id)
      if (idx !== -1) {
        state.scenarios.topLevelIDs.splice(idx + 1, 0, scenario.id)
        append = false
      }
      if (append) {
        state.scenarios.topLevelIDs.push(scenario.id)
      }
      state.scenarios.entities[scenario.id] = scenario
      updateScenarioNavList(state)
      updateActive(state, undefined, undefined, scenario)
      state.dirty = true
    },

    deleteScenario: (state, action: PayloadAction<string>) => {
      const isActive = action.payload === state.activeScenario?.id
      if (state.selectedScenario.id === action.payload) {
        state.selectedScenario = noScenario
      }
      let index = state.scenarios.topLevelIDs.indexOf(action.payload)
      if (index === -1) {
        throw new Error(`Invalid scenario ID ${action.payload}`)
      }
      state.scenarios.topLevelIDs.splice(index, 1)
      delete state.scenarios.entities[action.payload]

      if (isActive) {
        if (state.scenarios.topLevelIDs.length > 0) {
          if (index >= state.scenarios.topLevelIDs.length)
            index = state.scenarios.topLevelIDs.length - 1
        } else {
          index = -1
        }
        state.activeScenario =
          index === -1 ? undefined : state.scenarios.entities[state.scenarios.topLevelIDs[index]]
      }
      updateScenarioNavList(state)
      state.dirty = true
    },

    updateScenario: (
      state,
      action: PayloadAction<{
        id: string,
        name?: string,
        variables?: EditableNameValuePair[]
      }>
    ) => {
      const match = state.scenarios.entities[action.payload.id]
      if (!match)
        throw new Error(`Invalid scenario ID ${action.payload.id}`)
      if (action.payload.name !== undefined) {
        match.name = action.payload.name
      }
      if (action.payload.variables !== undefined) {
        match.variables = action.payload.variables ?? []
      }
      match.dirty = true
      state.dirty = true

      if (state.selectedScenario.id === match.id) {
        state.selectedScenario = match
      }

      if (state.activeScenario?.id === match.id) {
        state.activeScenario = match
      }

      updateScenarioNavList(state)
    },

    setActiveScenario: (
      state,
      action: PayloadAction<{ id: string | undefined }>
    ) => {
      if (action.payload.id) {
        const match = state.scenarios.entities[action.payload.id]
        if (match) {
          updateActive(state, undefined, undefined, match)
          return
        }
      }
      updateActive(state, undefined, undefined, undefined)
    },

    moveScenario: (
      state,
      action: PayloadAction<{ id: string, destinationID: string | null }>
    ) => {
      moveInStorage<EditableWorkbookScenario>(action.payload.id, action.payload.destinationID, state.scenarios)
      updateScenarioNavList(state)
      updateActive(state, undefined, undefined, state.scenarios.entities[action.payload.id])
    },

    setSelectedScenario: (
      state,
      action: PayloadAction<string | undefined>
    ) => {
      if (action.payload && action.payload !== NO_SCENARIO) {
        const match = state.scenarios.entities[action.payload]
        if (!match) throw new Error(`Invalid scenario ID ${action.payload}`)
        state.selectedScenario = match
      } else {
        state.selectedScenario = noScenario
      }
    },

    setRequestRunning: (
      state,
      action: PayloadAction<{ id: string, onOff: boolean }>
    ) => {
      const match = state.requests.entities[action.payload.id]
      if (match) {
        const match = state.executions[action.payload.id]
        if (match) {
          match.running = action.payload.onOff
          match.results = undefined
        } else {
          state.executions[action.payload.id] = {
            requestID: action.payload.id,
            running: action.payload.onOff,
          }
        }
      }
      updateActive(state, match, undefined, undefined)
      if (state.activeExecution?.requestID === action.payload.id) {
        if (!action.payload.onOff) state.activeExecution.results = undefined
        state.activeExecution.running = action.payload.onOff
        if (action.payload.onOff) {
          state.selectedExecutionResult = undefined
          state.groupExecutionResults = undefined
        }
      }
      updateRunningCount(state)
    },

    setRequestResults: (
      state,
      action: PayloadAction<{ id: string, results: ApicizeResult[][] } | undefined>
    ) => {
      if (action.payload) {
        // Stop the executions
        const workbookResults = ApicizeRunResultsToWorkbookExecutionResults(action.payload.results, state.requests.entities)
        const match = state.executions[action.payload.id]
        if (match) {
          match.running = false
          match.runList = []
          match.resultLists = []
          for (let runIndex = 0; runIndex < workbookResults.length; runIndex++) {
            match.runList.push({ index: runIndex, text: `Run ${runIndex + 1} of ${workbookResults.length}` })
            const runResults = workbookResults[runIndex]
            const resultList = []
            for (let resultIndex = 0; resultIndex < runResults.length; resultIndex++) {
              const request = state.requests.entities[runResults[resultIndex].requestId]
              resultList.push({ index: resultIndex, text: `${request?.name ?? '(Unnamed)'}` })
            }
            match.resultLists.push(resultList)
          }
          match.results = workbookResults
          match.runIndex = workbookResults.length > 0 ? 0 : undefined
          match.resultIndex = workbookResults.length > 0 && workbookResults[0].length > 0 ? -1 : undefined

          if (state.activeExecution && state.activeExecution.requestID === action.payload.id) {
            state.activeExecution.running = false
            state.activeExecution.results = workbookResults
            state.activeExecution.runList = match.runList
            state.activeExecution.resultLists = match.resultLists
            updateSelectedExecutionResult(state, match.runIndex, match.resultIndex)
          }
        }
      }
      updateRunningCount(state)
    },

    setSelectedExecutionResult: (
      state,
      action: PayloadAction<{
        runIndex: number | undefined,
        resultIndex: number | undefined
      }>
    ) => {
      updateSelectedExecutionResult(state, action.payload.runIndex, action.payload.resultIndex)
    },
  }
})

export const {
  initializeWorkbook,
  saveWorkbook,
  setWorkbookDirty,
  addNewRequest,
  duplicateRequestEntry,
  deleteRequestEntry,
  updateRequest,
  addNewRequestGroup,
  updateRequestGroup,
  moveRequest,
  setActiveRequestEntry,
  addNewAuthorization,
  duplicateAuthorization,
  deleteAuthorization,
  updateAuthorization,
  moveAuthorization,
  setActiveAuthorization,
  setSelectedAuthorization,
  addNewScenario,
  duplicateScenario,
  deleteScenario,
  updateScenario,
  moveScenario,
  setActiveScenario,
  setSelectedScenario,
  setRequestRunning,
  setRequestResults,
  setSelectedExecutionResult
} = apicizeSlice.actions

export const workbookStore = configureStore<ApicizeWorkbookState>({
  reducer: apicizeSlice.reducer
})

export type WorkbookState = ReturnType<typeof workbookStore.getState>
