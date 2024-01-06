// import { Settings } from '@apicize/common'
// import { createSlice, PayloadAction, configureStore, createAsyncThunk } from '@reduxjs/toolkit'

import { Settings } from "@apicize/common"
import { configureStore, createAsyncThunk, createSlice } from "@reduxjs/toolkit"

// interface ApicizeAppState {
//     workbookFullName?: string
//     workbookDisplayName?: string
//     settings: Settings
//     settingsFileName: string
// }

export type InitializeStoreFunction = () => Promise<{
    settings: Settings,
    settingsFileName: string
}>

// see https://blog.logrocket.com/using-redux-toolkits-createasyncthunk/
export const initialize = createAsyncThunk(
    'initialize',
    async (callback: InitializeStoreFunction) => {
        return await callback()
    }
)

export interface ApicizeAppState {
    settings: Settings
    settingsFileName: string
}

const apicizeAppSlice = createSlice({
    name: 'apicize-app',
    initialState: {
        settings: {
            workbookDirectory: ''
        },
        settingsFileName: ''
    } as ApicizeAppState,
    reducers: {
    }
})

// export const {
//     initializeWorkbook,
//     saveWorkbook,
//     setWorkbookDirty,
//     addNewRequest,
//     deleteRequest,
//     updateRequest,
//     addNewRequestGroup,
//     updateRequestGroup,
//     moveRequest,
//     setActiveRequest,
//     addNewAuthorization,
//     deleteAuthorization,
//     updateAuthorization,
//     moveAuthorization,
//     setActiveAuthorization,
//     setSelectedAuthorization,
//     addNewEnvironment,
//     deleteEnvironment,
//     updateEnvironment,
//     moveEnvironment,
//     setActiveEnvironment,
//     setSelectedEnvironment,
//     setRequestRunning,
//     setRequestResults,
//     setNavigationMenu
// } = apicizeSlice.actions

export const appStore = configureStore<ApicizeAppState>({
    reducer: apicizeAppSlice.reducer
})

export type AppState = ReturnType<typeof appStore.getState>
