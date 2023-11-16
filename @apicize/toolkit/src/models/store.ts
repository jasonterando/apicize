import { createSlice, PayloadAction, configureStore } from '@reduxjs/toolkit'
import {
  RequestNameValuePair,
  RequestAuthorizationData,
  RequestAuthorizationType,
  Method,
  EditableWorkbookTest,
  EditableWorkbookAuthorization,
  Settings,
  NO_AUTHORIZATION,
  BodyType,
} from '@apicize/definitions'
import { GenerateIdentifier } from '../services/random-identifier-generator'
import { ToastRequest } from './toast-request'

interface ApicizeState {
  workbookFullName?: string
  workbookDisplayName?: string
  tests: EditableWorkbookTest[]
  authorizations: EditableWorkbookAuthorization[]
  activeTest: EditableWorkbookTest | undefined
  activeAuthorization: EditableWorkbookAuthorization | undefined
  selectedAuthorization: EditableWorkbookAuthorization
  settings: Settings
  toast?: ToastRequest
  dirty: boolean
}

const noAuthorization = {
  id: NO_AUTHORIZATION,
  name: 'Anonymous (None)',
  type: RequestAuthorizationType.None
}


const apicizeSlice = createSlice({
  name: 'apicize',
  initialState: {
    dirty: false,
    activeTest: undefined,
    authorizations: [noAuthorization],
    tests: [],
    activeAuthorization: undefined,
    selectedAuthorization: noAuthorization,
    settings: {
      workbookDirectory: ''
    }
  } as ApicizeState,
    reducers: {
      openWorkbook: (state, action: PayloadAction<{
        fullName?: string,
        displayName?: string,
        tests: EditableWorkbookTest[],
        authorizations: EditableWorkbookAuthorization[]
      }>) => {
        state.tests = action.payload.tests
        state.authorizations = action.payload.authorizations
        state.activeTest = action.payload.tests.length > 0 ? action.payload.tests[0] : undefined
        state.activeAuthorization = action.payload.authorizations.length > 0 ? action.payload.authorizations[0] : undefined
        state.selectedAuthorization = state.activeAuthorization ?? noAuthorization
        state.dirty = false
      },
      setWorkbookDirty: (state, action: PayloadAction<boolean>) => {
        state.dirty = true
      },
      addNewTest: (state) => {
        const test = { id: GenerateIdentifier(), name: '', method: Method.Get, url: '' } as EditableWorkbookTest
        state.tests.push(test)
        state.activeTest = test
        state.dirty = true
      },
      deleteTest: (state, action: PayloadAction<{ id: string }>) => {
        const isActive = action.payload.id === state.activeTest?.id
        let index = state.tests.findIndex((t) => t.id === action.payload.id)
        if (index === -1) throw new Error(`Invalid test ID ${action.payload.id}`)
        state.tests.splice(index, 1)
        if (isActive) {
          if (state.tests.length > 0) {
            if (index >= state.tests.length) index = state.tests.length
          } else {
            index = -1
          }
          state.activeTest = index === -1 ? undefined : state.tests[index]
        }
        state.dirty = true
      },
      updateTest: (
        state,
        action: PayloadAction<{
          name?: string
          url?: string
          method?: string
          headers?: RequestNameValuePair[]
          queryString?: RequestNameValuePair[]
          body?: string | null
          bodyType?: BodyType | null
        }>
      ) => {
        if (!state.activeTest) throw new Error('No active test to update')
        const match = state.tests.find((t) => t.id === state.activeTest?.id)
        if (!match) throw new Error(`Invalid test ID ${state.activeTest?.id}`)
        if (action.payload.name !== undefined) {
          state.activeTest.name = action.payload.name
          match.name = action.payload.name
        }
        if (action.payload.url !== undefined) {
          state.activeTest.url = action.payload.url
          match.url = action.payload.url
        }
        if (action.payload.method !== undefined) {
          const methodToSet = (action.payload.method as Method) ?? Method.Get
          state.activeTest.method = methodToSet
          match.method = methodToSet
        }
        if (action.payload.queryString !== undefined) {
          const queryStringToSet =
            (action.payload.queryString?.length ?? 0) > 0
              ? action.payload.queryString
              : undefined
          state.activeTest.queryStringParams = queryStringToSet
          match.queryStringParams = queryStringToSet
        }
        if (action.payload.headers !== undefined) {
          const headersToSet =
            (action.payload.headers?.length ?? 0) > 0
              ? action.payload.headers
              : undefined
          state.activeTest.headers = headersToSet
          match.headers = headersToSet
        }
        if (action.payload.body !== undefined) {
          const bodyToSet = (action.payload.body && action.payload.body.length > 0) ? action.payload.body : undefined
          state.activeTest.body = bodyToSet
          match.body = bodyToSet
        }
        if (action.payload.bodyType !== undefined) {
          const bodyTypeToSet = action.payload.bodyType ? action.payload.bodyType : undefined
          state.activeTest.bodyType = bodyTypeToSet
          match.bodyType = bodyTypeToSet
        }
        state.activeTest.dirty = true
        match.dirty = true
        state.dirty = true
      },
      setActiveTest: (
        state,
        action: PayloadAction<{ id: string | undefined }>
      ) => {
        if (action.payload.id) {
          const match = state.tests.find((t) => t.id === action.payload.id)
          if (!match) throw new Error(`Invalid test ID ${action.payload.id}`)
          state.activeTest = match
        } else {
          state.activeTest = undefined
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
        state.authorizations.push(auth)
        state.activeAuthorization = auth
        state.dirty = true
      },
      deleteAuthorization: (state, action: PayloadAction<{ id: string }>) => {
        const isActive = action.payload.id === state.activeAuthorization?.id
        if (state.selectedAuthorization.id === action.payload.id) {
          state.selectedAuthorization = noAuthorization
        }
        let index = state.authorizations.findIndex(
          (t) => t.id === action.payload.id
        )
        if (index === -1)
          throw new Error(`Invalid authorization ID ${action.payload.id}`)
        state.authorizations.splice(index, 1)

        if (isActive) {
          if (state.authorizations.length > 0) {
            if (index >= state.authorizations.length)
              index = state.authorizations.length
          } else {
            index = -1
          }
          state.activeAuthorization =
            index === -1 ? undefined : state.authorizations[index]
        }
        state.dirty = true
      },
      updateAuthorization: (
        state,
        action: PayloadAction<{
          name?: string
          type?: string
          data?: RequestAuthorizationData
        }>
      ) => {
        if (!state.activeAuthorization)
          throw new Error('No active authorization to update')
        const match = state.authorizations.find(
          (t) => t.id === state.activeAuthorization?.id
        )
        if (!match)
          throw new Error(`Invalid test ID ${state.activeAuthorization?.id}`)
        if (action.payload.name !== undefined) {
          state.activeAuthorization.name = action.payload.name
          match.name = action.payload.name
        }
        if (action.payload.type !== undefined) {
          const typeToSet =
            (action.payload.type as RequestAuthorizationType) ??
            RequestAuthorizationType.Basic
          state.activeAuthorization.type = typeToSet
          match.type = typeToSet
        }
        if (action.payload.data !== undefined) {
          state.activeAuthorization.data = action.payload.data
          match.data = action.payload.data
        }
        state.activeAuthorization.dirty = true
        match.dirty = true
        state.dirty = true
      },
      setActiveAuthorization: (
        state,
        action: PayloadAction<{ id: string | undefined }>
      ) => {
        if (action.payload.id) {
          const match = state.authorizations.find(
            (t) => t.id === action.payload.id
          )
          if (match) {
            state.activeAuthorization = match
            return
          }
        }
        state.activeAuthorization = undefined
      },
      setSelectedAuthorization: (
        state,
        action: PayloadAction<{ id: string | undefined }>
      ) => {
        if (action.payload.id) {
          const match = state.authorizations.find(
            (t) => t.id === action.payload.id
          )
          if (match) {
            state.selectedAuthorization = match
            return
          }
        }
        state.selectedAuthorization = noAuthorization
      },
      requestToast: (
        state,
        action: PayloadAction<ToastRequest>
      ) => {
        state.toast = action.payload
      }
    }
  })

export const {
  openWorkbook,
  setWorkbookDirty,
  addNewTest,
  deleteTest,
  updateTest,
  setActiveTest,
  addNewAuthorization,
  deleteAuthorization,
  updateAuthorization,
  setActiveAuthorization,
  setSelectedAuthorization,
  requestToast
} = apicizeSlice.actions

// type TestActionTypes = { type: typeof }

// enum TestActionTypes {
//   echo = 'ECHO'
// }

export const store = configureStore<ApicizeState>({
  reducer: apicizeSlice.reducer
})

export type RootState = ReturnType<typeof store.getState>


// // Infer the `RootState` and `AppDispatch` types from the store itself
// export type RootState = ReturnType<typeof store.getState>
// // Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
// export type AppDispatch = typeof store.dispatch
