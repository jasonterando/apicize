import { createSlice, PayloadAction, configureStore, createAsyncThunk } from '@reduxjs/toolkit'
import {
  NameValuePair,
  Method,
  NO_AUTHORIZATION,
  BodyType,
  WorkbookExecution,
  NO_ENVIRONMENT,
  GetTitle,
  WorkbookAuthorizationType,
} from '@apicize/common'
import { GenerateIdentifier } from '../services/random-identifier-generator'
import { MAX_TEXT_RENDER_LENGTH } from '../controls/viewers/text-viewer'
import { EditableWorkbookRequest } from './workbook/editable-workbook-request'
import { EditableWorkbookRequestGroup } from './workbook/editable-workbook-request-group'
import { EditableWorkbookApiKeyAuthorization, EditableWorkbookAuthorization, EditableWorkbookBasicAuthorization, EditableWorkbookOAuth2ClientAuthorization } from './workbook/editable-workbook-authorization'
import { EditableWorkbookRequestItem } from './workbook/editable-workbook-request-item'
import { EditableWorkbookEnvironment } from './workbook/editable-workbook-environment'
import { addRequestItem, castRequestItem, deleteRequestItem } from './workbook/helpers/editable-workbook-request-helpers'
import { StateStorage, isGroup, moveInStorage } from './state-storage'
import { EditableNameValuePair } from './workbook/editable-name-value-pair'
import { ApicizeResult } from '@apicize/common/dist/models/lib/apicize-result'
import { WorkbookBodyData } from '@apicize/common/dist/models/workbook/workbook-request'

export interface NavigationListItem {
  id: string
  name: string
  type: string
  children?: NavigationListItem[]
}

interface NavigationMenu {
  id: string
  mouseX: number
  mouseY: number
}

export const noAuthorization = {
  id: NO_AUTHORIZATION,
  name: 'Anonymous (None)',
  type: WorkbookAuthorizationType.None
}

export const noEnvironment = {
  id: NO_ENVIRONMENT,
  name: '(None)'
}

const encodeFormData = (data: EditableNameValuePair[]) => {
  if (data.length === 0) return ''

  const result = data.map(nv =>
    `${encodeURIComponent(nv.name)}=${encodeURIComponent(nv.value)}`
  ).join('&')
  // console.log(`Encoding ${JSON.stringify(data)} to ${result}`)
  return result
}

const decodeFormData = (bodyData: string | ArrayBuffer | undefined) => {
  let data: string | undefined;
  if (bodyData instanceof ArrayBuffer) {
    data = (new TextDecoder()).decode(bodyData)
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
  requests: StateStorage<EditableWorkbookRequestItem>
  authorizations: StateStorage<EditableWorkbookAuthorization>
  environments: StateStorage<EditableWorkbookEnvironment>

  executions: { [requestID: string]: WorkbookExecution }

  // Lists to display for navigation
  requestList: NavigationListItem[]
  authorizationList: NavigationListItem[]
  environmentList: NavigationListItem[]

  navigationMenu?: NavigationMenu

  // Active entity being edited
  activeRequest: EditableWorkbookRequest | undefined
  activeRequestGroup: EditableWorkbookRequestGroup | undefined
  activeExecution: WorkbookExecution | undefined
  activeAuthorization: EditableWorkbookAuthorization | undefined
  activeEnvironment: EditableWorkbookEnvironment | undefined

  // Active authorization/environment ID to use for running test
  selectedAuthorization: EditableWorkbookAuthorization
  selectedEnvironment: EditableWorkbookEnvironment
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

// Generate environment navigation list
const updateEnvrionmentNavList = (state: ApicizeWorkbookState) => {
  state.environmentList = state.environments.topLevelIDs.map(id => (
    { id, name: GetTitle(state.environments.entities[id]), type: 'env' }
  ))
}

// Update active state properties
const updateActive = (
  state: ApicizeWorkbookState,
  request: EditableWorkbookRequest | undefined,
  group: EditableWorkbookRequestGroup | undefined,
  authorization: EditableWorkbookAuthorization | undefined,
  environment: EditableWorkbookEnvironment | undefined) => {
  state.activeRequest = request
  state.activeRequestGroup = group
  state.activeAuthorization = authorization
  state.activeEnvironment = environment
  state.activeExecution = request ? state.executions[request.id] : undefined
  state.longTextInResponse = (state.activeExecution?.result?.response?.body?.text?.length ?? 0) > MAX_TEXT_RENDER_LENGTH
}

export const defaultWorkbookState: ApicizeWorkbookState = {
  dirty: false,
  runningCount: 0,
  longTextInResponse: false,
  navigationMenu: undefined,
  requests: { entities: {}, topLevelIDs: [] },
  authorizations: { entities: {}, topLevelIDs: [] },
  environments: { entities: {}, topLevelIDs: [] },
  executions: {},
  requestList: [],
  authorizationList: [],
  environmentList: [],
  activeRequest: undefined,
  activeRequestGroup: undefined,
  activeExecution: undefined,
  activeAuthorization: undefined,
  activeEnvironment: undefined,
  selectedAuthorization: noAuthorization,
  selectedEnvironment: noEnvironment,
}

const apicizeSlice = createSlice({
  name: 'apicize',
  initialState: defaultWorkbookState,
  reducers: {
    // Called when workbook is opened to initialize state
    initializeWorkbook: (state, action: PayloadAction<{
      fullName: string,
      displayName: string,
      requests: StateStorage<EditableWorkbookRequestItem>,
      authorizations: StateStorage<EditableWorkbookAuthorization>,
      environments: StateStorage<EditableWorkbookEnvironment>
    }>) => {
      state.workbookFullName = action.payload.fullName
      state.workbookDisplayName = action.payload.displayName
      state.dirty = false

      state.requests = action.payload.requests
      state.authorizations = action.payload.authorizations
      state.environments = action.payload.environments

      updateRequestNavList(state)
      updateAuthorizationNavList(state)
      updateEnvrionmentNavList(state)

      // Set active element to first request/group
      let activeRequest: EditableWorkbookRequest | undefined
      let activeRequestGroup: EditableWorkbookRequestGroup | undefined
      if (state.requests.topLevelIDs.length > 0) {
        const [request, group] = castRequestItem(state.requests.entities[state.requests.topLevelIDs[0]])
        activeRequest = request
        activeRequestGroup = group
      }
      updateActive(state, activeRequest, activeRequestGroup, undefined, undefined)

      // default first auth/env for execution
      state.selectedAuthorization = state.authorizations.topLevelIDs.length > 0
        ? state.authorizations.entities[state.authorizations.topLevelIDs[0]] : noAuthorization
      state.selectedEnvironment = state.environments.topLevelIDs.length > 0
        ? state.environments.entities[state.environments.topLevelIDs[0]] : noEnvironment
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

    addNewRequest: (state) => {
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

      addRequestItem(state.requests, request, false, state.activeRequest?.id)
      updateActive(state, request, undefined, undefined, undefined)
      updateRequestNavList(state)
      updateActive(state, request, undefined, undefined, undefined)
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
            case BodyType.Base64:
              newBodyData = new ArrayBuffer(0)
              break
            case BodyType.Form:
              if ([BodyType.Text, BodyType.JSON, BodyType.XML].indexOf(oldBodyType) !== -1) {
                const formData = decodeFormData(newBodyData as string)
                formData.forEach(d => (d as EditableNameValuePair).id = GenerateIdentifier())
                newBodyData = formData
              } else {
                newBodyData = []
              }
              break
            default:
              switch (oldBodyType) {
                case BodyType.Form:
                  newBodyData = encodeFormData(newBodyData as EditableNameValuePair[])
                  break
                case BodyType.Base64:
                  newBodyData = ''
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

      if (state.activeRequest?.id === action.payload.id) {
        state.activeRequest = match
      }

      updateRequestNavList(state)
    },

    deleteRequest: (state, action: PayloadAction<string>) => {
      const isActive = action.payload === state.activeRequest?.id
      deleteRequestItem(state.requests, action.payload)
      // if (isActive) {
      // todo - come up with a way to figure out what to highlight after delete
      // state.activeRequest = index === -1 ? undefined : state.requests[index]
      // } else {
      // }
      updateActive(state, undefined, undefined, undefined, undefined)
      updateRequestNavList(state)
      state.dirty = true
    },

    addNewRequestGroup: (state) => {
      const group = {
        id: GenerateIdentifier(),
        name: '',
        requests: []
      } as EditableWorkbookRequestGroup

      addRequestItem(state.requests, group, true, state.activeRequest?.id)
      updateActive(state, undefined, group, undefined, undefined)
      updateRequestNavList(state)
      updateActive(state, undefined, group, undefined, undefined)
      state.dirty = true
    },

    updateRequestGroup: (
      state,
      action: PayloadAction<{
        id: string,
        name?: string
      }>
    ) => {
      const group = state.requests.entities[action.payload.id] as EditableWorkbookRequestGroup
      if (!group) {
        throw new Error(`Invalid request group ID ${action.payload.id}`)
      }
      if (action.payload.name !== undefined) {
        group.name = action.payload.name

      }
      updateRequestNavList(state)
      group.dirty = true
      state.dirty = true
    },

    moveRequest: (
      state,
      action: PayloadAction<{ id: string, destinationID: string | null }>
    ) => {
      moveInStorage<EditableWorkbookRequestItem>(action.payload.id, action.payload.destinationID, state.requests)
      updateRequestNavList(state)
      const g = isGroup(action.payload.id, state.requests)
      const r = state.requests.entities[action.payload.id]
      updateActive(state, g ? undefined : r as EditableWorkbookRequest, g ? r as EditableWorkbookRequestGroup : undefined, undefined, undefined)
    },

    setActiveRequest: (
      state,
      action: PayloadAction<{ id: string | undefined }>
    ) => {
      if (action.payload.id) {
        const item = state.requests.entities[action.payload.id]
        if (isGroup(action.payload.id, state.requests)) {
          updateActive(state, undefined, item as EditableWorkbookRequestGroup, undefined, undefined)
        } else {
          updateActive(state, item as EditableWorkbookRequest, undefined, undefined, undefined)
        }
      } else {
        updateActive(state, undefined, undefined, undefined, undefined)
      }
    },

    addNewAuthorization: (state) => {
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

      let append = true
      const existingID = state.activeAuthorization?.id
      if (existingID) {
        const idx = state.authorizations.topLevelIDs.findIndex(id => id === existingID)
        if (idx !== -1) {
          state.authorizations.topLevelIDs.splice(idx, 0, auth.id)
          append = false
        }
      }
      if (append) {
        state.authorizations.topLevelIDs.push(auth.id)
      }
      updateAuthorizationNavList(state)
      updateActive(state, undefined, undefined, auth, undefined)
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
      updateActive(state, undefined, undefined, state.authorizations.entities[action.payload.id], undefined)
    },

    setActiveAuthorization: (
      state,
      action: PayloadAction<{ id: string | undefined }>
    ) => {
      if (action.payload.id) {
        const match = state.authorizations.entities[action.payload.id]
        if (match) {
          updateActive(state, undefined, undefined, match, undefined)
          return
        }
      }
      updateActive(state, undefined, undefined, undefined, undefined)
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

    addNewEnvironment: (state) => {
      const env = {
        id: GenerateIdentifier(),
        name: '',
        variables: []
      }
      let append = true
      const existingID = state.activeEnvironment?.id
      if (existingID) {
        const idx = state.environments.topLevelIDs.findIndex(id => id === existingID)
        if (idx !== -1) {
          state.environments.topLevelIDs.splice(idx, 0, env.id)
          append = false
        }
      }
      if (append) {
        state.environments.topLevelIDs.push(env.id)
      }
      state.environments.entities[env.id] = env
      updateEnvrionmentNavList(state)
      updateActive(state, undefined, undefined, undefined, env)
      state.dirty = true
    },

    deleteEnvironment: (state, action: PayloadAction<string>) => {
      const isActive = action.payload === state.activeEnvironment?.id
      if (state.selectedEnvironment.id === action.payload) {
        state.selectedEnvironment = noEnvironment
      }
      let index = state.environments.topLevelIDs.indexOf(action.payload)
      if (index === -1) {
        throw new Error(`Invalid environment ID ${action.payload}`)
      }
      state.environments.topLevelIDs.splice(index, 1)
      delete state.environments.entities[action.payload]

      if (isActive) {
        if (state.environments.topLevelIDs.length > 0) {
          if (index >= state.environments.topLevelIDs.length)
            index = state.environments.topLevelIDs.length - 1
        } else {
          index = -1
        }
        state.activeEnvironment =
          index === -1 ? undefined : state.environments.entities[state.environments.topLevelIDs[index]]
      }
      updateEnvrionmentNavList(state)
      state.dirty = true
    },

    updateEnvironment: (
      state,
      action: PayloadAction<{
        id: string,
        name?: string,
        variables?: NameValuePair[]
      }>
    ) => {
      const match = state.environments.entities[action.payload.id]
      if (!match)
        throw new Error(`Invalid environment ID ${action.payload.id}`)
      if (action.payload.name !== undefined) {
        match.name = action.payload.name
      }
      if (action.payload.variables !== undefined) {
        match.variables = action.payload.variables ?? []
      }
      match.dirty = true
      state.dirty = true

      if (state.selectedEnvironment.id === match.id) {
        state.selectedEnvironment = match
      }

      if (state.activeEnvironment?.id === match.id) {
        state.activeEnvironment = match
      }

      updateEnvrionmentNavList(state)
    },

    setActiveEnvironment: (
      state,
      action: PayloadAction<{ id: string | undefined }>
    ) => {
      if (action.payload.id) {
        const match = state.environments.entities[action.payload.id]
        if (match) {
          updateActive(state, undefined, undefined, undefined, match)
          return
        }
      }
      updateActive(state, undefined, undefined, undefined, undefined)
    },

    moveEnvironment: (
      state,
      action: PayloadAction<{ id: string, destinationID: string | null }>
    ) => {
      moveInStorage<EditableWorkbookEnvironment>(action.payload.id, action.payload.destinationID, state.environments)
      updateEnvrionmentNavList(state)
      updateActive(state, undefined, undefined, undefined, state.environments.entities[action.payload.id])
    },

    setSelectedEnvironment: (
      state,
      action: PayloadAction<string | undefined>
    ) => {
      if (action.payload && action.payload !== NO_ENVIRONMENT) {
        const match = state.environments.entities[action.payload]
        if (!match) throw new Error(`Invalid environment ID ${action.payload}`)
        state.selectedEnvironment = match
      } else {
        state.selectedEnvironment = noEnvironment
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
          match.result = undefined
        } else {
          state.executions[action.payload.id] = {
            requestID: action.payload.id,
            running: action.payload.onOff
          }
        }
      }
      updateActive(state, state.activeRequest, undefined, undefined, undefined)
      if (state.activeExecution?.requestID === action.payload.id) {
        if (!action.payload.onOff) state.activeExecution.result = undefined
        state.activeExecution.running = action.payload.onOff
      }
      updateRunningCount(state)
    },

    setRequestResults: (
      state,
      action: PayloadAction<{ [id: string]: ApicizeResult } | undefined>
    ) => {
      if (action.payload) {
        for (const [id, result] of Object.entries(action.payload)) {
          const match = state.executions[id]
          if (match) {
            match.running = false
            match.result = result
          }
          if (state.activeExecution && state.activeExecution.requestID === id) {
            state.activeExecution.result = result
            state.activeExecution.running = false
          }
        }
      }
      updateRunningCount(state)
    },

    setNavigationMenu: (
      state,
      action: PayloadAction<NavigationMenu | undefined>
    ) => {
      state.navigationMenu = action.payload
    },
  }
})

export const {
  initializeWorkbook,
  saveWorkbook,
  setWorkbookDirty,
  addNewRequest,
  deleteRequest,
  updateRequest,
  addNewRequestGroup,
  updateRequestGroup,
  moveRequest,
  setActiveRequest,
  addNewAuthorization,
  deleteAuthorization,
  updateAuthorization,
  moveAuthorization,
  setActiveAuthorization,
  setSelectedAuthorization,
  addNewEnvironment,
  deleteEnvironment,
  updateEnvironment,
  moveEnvironment,
  setActiveEnvironment,
  setSelectedEnvironment,
  setRequestRunning,
  setRequestResults,
  setNavigationMenu
} = apicizeSlice.actions

export const workbookStore = configureStore<ApicizeWorkbookState>({
  reducer: apicizeSlice.reducer
})

export type WorkbookState = ReturnType<typeof workbookStore.getState>
