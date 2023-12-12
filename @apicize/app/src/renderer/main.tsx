import {
    Navigation, AuthorizationEditor, EnvironmentEditor, RequestViewer, RequestGroupEditor} from "@apicize/toolkit";
import { CancelRequestsFunction, RunRequestsFunction, WorkbookAuthorization, WorkbookEnvironment, WorkbookRequest } from "@apicize/definitions";
import { Box, Stack } from '@mui/material'


console.log('Main file loaded')


export function Main() {
    const runRequests: RunRequestsFunction = (requests: WorkbookRequest[], authorization: WorkbookAuthorization, environment: WorkbookEnvironment) =>
        window.apicize.runRequests(requests, authorization, environment)

    const cancelRequests: CancelRequestsFunction = (ids: string[]) =>
        window.apicize.cancelRequests(ids)


    return (
        <Stack direction='row' sx={{ width: '100%', height: '100vh', display: 'flex' }}>
            <Navigation />
            <Box sx={{
                height: '100vh',
                display: 'flex',
                flexGrow: 1
            }}>
                <RequestViewer runRequests={runRequests} cancelRequests={cancelRequests} />
                <RequestGroupEditor />
                <AuthorizationEditor />
                <EnvironmentEditor />
            </Box>
        </Stack>
    )
}
