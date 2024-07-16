import { Button, Grid, TextField } from '@mui/material'
import { WorkbookState } from '../../../models/store'
import { useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { EditableWorkbookOAuth2ClientAuthorization } from '../../../models/workbook/editable-workbook-authorization'
import { WorkspaceContext } from '../../../contexts/workspace-context'

export function AuthorizationOAuth2ClientPanel(props={triggerClearToken: () => {}}) {
    const auth = useContext(WorkspaceContext).authorization

    const id = useSelector((state: WorkbookState) => state.authorization.id)
    const accessTokenUrl = useSelector((state: WorkbookState) => state.authorization.accessTokenUrl ?? '')
    const clientId = useSelector((state: WorkbookState) => state.authorization.clientId ?? '')
    const clientSecret = useSelector((state: WorkbookState) => state.authorization.clientSecret ?? '')
    const scope = useSelector((state: WorkbookState) => state.authorization.scope ?? '')
    // const [sendCredentialsInBody, setSendCredentialsInBody] = useState<string>((authorization?.sendCredentialsInBody ?? false) ? 'yes' : 'no')

    if (!id) {
        return null
    }

    const updateAccessTokenUrl = (updatedAccessTokenUrl: string) => {
        auth.setAccessTokenUrl(id, updatedAccessTokenUrl)
    }

    const updateClientID = (updatedClientID: string) => {
        auth.setClientId(id, updatedClientID)
    }

    const updateClientSecret = (updatedClientSecret: string) => {
        auth.setClientSecret(id, updatedClientSecret)
    }

    const updateScope = (updatedScope: string) => {
        auth.setScope(id, updatedScope)
    }

    // const updateSendCredentialsInBody = (updatedSendCredentialsInBody: string) => {
    //     setSendCredentialsInBody(updatedSendCredentialsInBody)
    //     dispatch(updateAuthorization({
    //         id: authorization.id,
    //         sendCredentialsInBody: updatedSendCredentialsInBody === 'yes'
    //     }))
    // }

    return (<Grid container direction={'column'} spacing={3} maxWidth={1000} className='authorization-editor-subpanel'>
        <Grid item>
            <TextField
                id='auth-oauth2-access-token-url'
                label='Access Token URL'
                aria-label='access token url'
                value={accessTokenUrl}
                onChange={e => updateAccessTokenUrl(e.target.value)}
                fullWidth
            />
        </Grid>
        <Grid item>
            <TextField
                id='auth-oauth2-client-id'
                label='Client ID'
                aria-label='client id'
                value={clientId}
                onChange={e => updateClientID(e.target.value)}
                fullWidth
            />
        </Grid>
        <Grid item>
            <TextField
                id='auth-oauth2-client-secret'
                label='Client Secret'
                aria-label='client secret'
                value={clientSecret}
                onChange={e => updateClientSecret(e.target.value)}
                fullWidth
            />
        </Grid>
        <Grid item>
            <TextField
                id='auth-oauth2-scope'
                label='Scope'
                aria-label='scope'
                value={scope}
                onChange={e => updateScope(e.target.value)}
                fullWidth
            />
        </Grid>
        <Grid item>
            <Button
                color='warning'
                variant='outlined' 
                // startIcon={<ClearIcon />}
                onClick={() => props.triggerClearToken()}>
                Clear Any Cached Token
            </Button>
        </Grid>
        {
            // <Grid item>
            //     <FormControl>
            //         <InputLabel id='auth-oauth2-creds-lbl-id'>Credential Method</InputLabel>
            //         <Select
            //             labelId='auth-oauth2-creds-lbl-id'
            //             id='auth-oauth2-creds-id'
            //             value={sendCredentialsInBody}
            //             label='Credential Method'
            //             onChange={e => updateSendCredentialsInBody(e.target.value)}
            //         >
            //             <MenuItem value='no'>Send Credentials in Auth Header</MenuItem>
            //             <MenuItem value='yes'>Send Credentials in Body</MenuItem>
            //         </Select>
            //     </FormControl>
            // </Grid>
        }
    </Grid>)
}