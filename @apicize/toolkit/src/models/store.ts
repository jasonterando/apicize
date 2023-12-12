import { createSlice, PayloadAction, configureStore } from '@reduxjs/toolkit'
import {
  NameValuePair,
  RequestAuthorizationData,
  RequestAuthorizationType,
  Method,
  EditableWorkbookRequest,
  EditableWorkbookRequestGroup,
  EditableWorkbookAuthorization,
  Settings,
  NO_AUTHORIZATION,
  BodyType,
  Result,
  EditableWorkbookEnvironment,
  NO_ENVIRONMENT,
  EditableWorkbookRequestItem,
  castRequestItem,
  addRequestItem,
  deleteRequestItem,
  StateStorage,
  GetEditableTitle,
  WorkbookAuthorization,
  WorkbookEnvironment,
  moveInStorage,
  isGroup
} from '@apicize/definitions'
import { GenerateIdentifier } from '../services/random-identifier-generator'
import { MAX_TEXT_RENDER_LENGTH } from '../controls/viewers/text-viewer'

export interface NavigationListItem {
  id: string
  name: string
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
  type: RequestAuthorizationType.None
}

export const noEnvironment = {
  id: NO_ENVIRONMENT,
  name: '(None)'
}

interface ApicizeState {
  workbookFullName?: string
  workbookDisplayName?: string
  settings: Settings
  dirty: boolean
  runningCount: number
  longTextInResponse: boolean

  // Entire list of entities being managed
  requests: StateStorage<EditableWorkbookRequestItem>
  authorizations: StateStorage<EditableWorkbookAuthorization>
  environments: StateStorage<EditableWorkbookEnvironment>

  // Lists to display for navigation
  requestList: NavigationListItem[]
  authorizationList: NavigationListItem[]
  environmentList: NavigationListItem[]

  navigationMenu?: NavigationMenu

  // Active entity being edited
  activeRequest: EditableWorkbookRequest | undefined
  activeRequestGroup: EditableWorkbookRequestGroup | undefined
  activeResult: Result | undefined
  activeAuthorization: EditableWorkbookAuthorization | undefined
  activeEnvironment: EditableWorkbookEnvironment | undefined

  // Active authorization/environment ID to use for running test
  selectedAuthorization: WorkbookAuthorization
  selectedEnvironment: WorkbookEnvironment
}

// Tally the number of running tests
const updateRunningCount = (state: ApicizeState) => {
  state.runningCount = state.requests.allIDs.reduce(
    (total, id) => total += ((state.requests.entities[id] as EditableWorkbookRequest).running ? 1 : 0), 0)
}

// Generate request navigation list
const updateRequestNavList = (state: ApicizeState) => {
  const mapItem = (id: string) => {
    const requestItem = state.requests.entities[id]
    const result: NavigationListItem = { id, name: GetEditableTitle(requestItem) }
    const children = state.requests.childIDs ? state.requests.childIDs[id] : undefined
      if (children) {
        result.children = children.map(id => mapItem(id))
      } else {
        result.children = undefined
      }
    return result
  }
  state.requestList = state.requests.allIDs.map(id => mapItem(id))
}

// Generate authorization navigation list
const updateAuthorizationNavList = (state: ApicizeState) => {
  state.authorizationList = state.authorizations.allIDs.map(id => (
    { id, name: GetEditableTitle(state.authorizations.entities[id]) }
  ))
}

// Generate environment navigation list
const updateEnvrionmentNavList = (state: ApicizeState) => {
  state.environmentList = state.environments.allIDs.map(id => (
    { id, name: GetEditableTitle(state.environments.entities[id]) }
  ))
}

// Update active state properties
const updateActive = (
  state: ApicizeState,
  request: EditableWorkbookRequest | undefined,
  group: EditableWorkbookRequestGroup | undefined,
  authorization: EditableWorkbookAuthorization | undefined,
  environment: EditableWorkbookEnvironment | undefined) => {
  state.activeRequest = request
  state.activeRequestGroup = group
  state.activeAuthorization = authorization
  state.activeEnvironment = environment
  if (request) {
    state.activeResult = request.result
    state.longTextInResponse = (request.result?.response?.text?.length ?? 0) > MAX_TEXT_RENDER_LENGTH
  } else {
    state.activeResult = undefined
    state.longTextInResponse = false
  }
}

const apicizeSlice = createSlice({
  name: 'apicize',
  initialState: {
    settings: {
      workbookDirectory: ''
    },
    dirty: false,
    runningCount: 0,
    longTextInResponse: false,
    navigationMenu: undefined,
    requests: { entities: {}, allIDs: [] },
    authorizations: { entities: {}, allIDs: [] },
    environments: { entities: {}, allIDs: [] },
    requestList: [],
    authorizationList: [],
    environmentList: [],
    activeRequest: undefined,
    activeRequestGroup: undefined,
    activeResult: undefined,
    activeAuthorization: undefined,
    activeEnvironment: undefined,
    selectedAuthorization: noAuthorization,
    selectedEnvironment: noEnvironment,
  } as ApicizeState,
  reducers: {
    // Called when workbook is opened to initialize state
    initializeState: (state, action: PayloadAction<{
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
      if (state.requests.allIDs.length > 0) {
        const [request, group] = castRequestItem(state.requests.entities[state.requests.allIDs[0]])
        activeRequest = request
        activeRequestGroup = group
      }
      updateActive(state, activeRequest, activeRequestGroup, undefined, undefined)

      // default first auth/env for execution
      state.selectedAuthorization = state.authorizations.allIDs.length > 0
        ? state.authorizations.entities[state.authorizations.allIDs[0]] : noAuthorization
      state.selectedEnvironment = state.environments.allIDs.length > 0
        ? state.environments.entities[state.environments.allIDs[0]] : noEnvironment
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
        headers?: NameValuePair[]
        queryString?: NameValuePair[]
        body?: string | null
        bodyType?: BodyType | null
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
      if (action.payload.body !== undefined) {
        match.body = (action.payload.body && action.payload.body.length > 0) ? action.payload.body : undefined
      }
      if (action.payload.bodyType !== undefined) {
        match.bodyType = action.payload.bodyType ? action.payload.bodyType : undefined
      }
      if (action.payload.test !== undefined) {
        match.test = (action.payload.test && action.payload.test.length > 0) ? action.payload.test : undefined
      }
      match.dirty = true
      state.dirty = true

      if(state.activeRequest?.id === action.payload.id) {
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
        children: []
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
      action: PayloadAction<{id: string, destinationID: string | null}>
    ) => {
      moveInStorage<EditableWorkbookRequestItem>(action.payload.id, action.payload.destinationID, state.requests)
      updateRequestNavList(state)
      const g = isGroup(action.payload.id, state.requests)
      const r = state.requests.entities[action.payload.id]
      updateActive(state, g ? undefined : r as EditableWorkbookRequest, g ? e as EditableWorkbookRequestGroup : undefined, undefined, undefined) 
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
        type: RequestAuthorizationType.Basic,
        data: {
          username: '',
          password: '',
          accessTokenUrl: '',
          clientID: '',
          clientSecret: '',
          scope: '',
          sendCredentialsInBody: false,
          header: 'x-api-key',
          value: ''
        },
      }

      state.authorizations.entities[auth.id] = auth

      let append = true
      const existingID = state.activeAuthorization?.id
      if (existingID) {
        const idx = state.authorizations.allIDs.findIndex(id => id === existingID)
        if (idx !== -1) {
          state.authorizations.allIDs.splice(idx, 0, auth.id)
          append = false
        }
      }
      if (append) {
        state.authorizations.allIDs.push(auth.id)
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
      let index = state.authorizations.allIDs.indexOf(action.payload)
      if (index === -1) {
        throw new Error(`Invalid authorization ID ${action.payload}`)
      }
      state.authorizations.allIDs.splice(index, 1)
      delete state.authorizations.entities[action.payload]

      if (isActive) {
        if (state.authorizations.allIDs.length > 0) {
          if (index >= state.authorizations.allIDs.length)
            index = state.authorizations.allIDs.length - 1
        } else {
          index = -1
        }
        state.activeAuthorization =
          index === -1 ? undefined : state.authorizations.entities[state.authorizations.allIDs[index]]
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
        data?: RequestAuthorizationData
      }>
    ) => {
      const match = state.authorizations.entities[action.payload.id]
      if (!match)
        throw new Error(`Invalid authorization ID ${action.payload.id}`)

      if (action.payload.name !== undefined) {
        match.name = action.payload.name
      }
      if (action.payload.type !== undefined) {
        match.type = (action.payload.type as RequestAuthorizationType) ??
          RequestAuthorizationType.Basic
      }
      if (action.payload.data !== undefined) {
        match.data = action.payload.data
      }

      match.dirty = true
      state.dirty = true

      if(state.selectedAuthorization.id === match.id) {
        state.selectedAuthorization = match
      }

      if(state.activeAuthorization?.id === match.id) {
        state.activeAuthorization = match
      }

      updateAuthorizationNavList(state)
    },

    moveAuthorization: (
      state,
      action: PayloadAction<{id: string, destinationID: string | null}>
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
        const idx = state.environments.allIDs.findIndex(id => id === existingID)
        if (idx !== -1) {
          state.environments.allIDs.splice(idx, 0, env.id)
          append = false
        }
      }
      if (append) {
        state.environments.allIDs.push(env.id)
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
      let index = state.environments.allIDs.indexOf(action.payload)
      if (index === -1) {
        throw new Error(`Invalid environment ID ${action.payload}`)
      }
      state.environments.allIDs.splice(index, 1)
      delete state.environments.entities[action.payload]

      if (isActive) {
        if (state.environments.allIDs.length > 0) {
          if (index >= state.environments.allIDs.length)
            index = state.environments.allIDs.length - 1
        } else {
          index = -1
        }
        state.activeEnvironment =
          index === -1 ? undefined : state.environments.entities[state.environments.allIDs[index]]
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

      if(state.selectedEnvironment.id === match.id) {
        state.selectedEnvironment = match
      }

      if(state.activeEnvironment?.id === match.id) {
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
      action: PayloadAction<{id: string, destinationID: string | null}>
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
        const request = match as EditableWorkbookRequest
        request.result = undefined
        request.running = action.payload.onOff
        if (state.activeRequest?.id === match.id) {
          if (!action.payload.onOff) state.activeRequest.result = undefined
          state.activeRequest.running = action.payload.onOff
        }
        updateRunningCount(state)
      }
    },

    setRequestResults: (
      state,
      action: PayloadAction<Result[] | undefined>
    ) => {
      if (action.payload) {
        for (const result of action.payload) {
          const match = state.requests.entities[result.requestID]
          if (match) {
            const request = match as EditableWorkbookRequest
            request.running = false
            request.result = result
            if (state.activeRequest?.id === match.id) {
              state.activeRequest.result = result
              state.activeRequest.running = false
              state.activeResult = result
            }
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
  initializeState,
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

export const store = configureStore<ApicizeState>({
  reducer: apicizeSlice.reducer
})

export type RootState = ReturnType<typeof store.getState>
