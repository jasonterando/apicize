import { FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import { WorkbookState, updateAuthorization } from '../../../models/store'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { EditableWorkbookOAuth2ClientAuthorization } from '../../../models/workbook/editable-workbook-authorization'

export function AuthorizationOAuth2ClientPanel() {
    const dispatch = useDispatch()

    const authorization = useSelector((state: WorkbookState) => state.activeAuthorization as EditableWorkbookOAuth2ClientAuthorization)
    const [accessTokenUrl, setAccessTokenUrl] = useState<string>(authorization?.accessTokenUrl ?? '')
    const [clientID, setClientID] = useState<string>(authorization?.clientId ?? '')
    const [clientSecret, setClientSecret] = useState<string>(authorization?.clientSecret ?? '')
    const [scope, setScope] = useState<string>(authorization?.scope ?? '')
    // const [sendCredentialsInBody, setSendCredentialsInBody] = useState<string>((authorization?.sendCredentialsInBody ?? false) ? 'yes' : 'no')

    useEffect(() => {
        setAccessTokenUrl(authorization?.accessTokenUrl ?? '')
        setClientID(authorization?.clientId ?? '')
        setClientSecret(authorization?.clientSecret ?? '')
        setScope(authorization?.scope ?? '')
        // setSendCredentialsInBody(authorization?.sendCredentialsInBody ? 'yes' : 'no')
    }, [authorization])

    if (!authorization) {
        return null
    }

    const updateAccessTokenUrl = (updatedAccessTokenUrl: string) => {
        setAccessTokenUrl(updatedAccessTokenUrl)
        dispatch(updateAuthorization({
            id: authorization.id,
            accessTokenUrl: updatedAccessTokenUrl,
        }))
    }

    const updateClientID = (updatedClientID: string) => {
        setClientID(updatedClientID)
        dispatch(updateAuthorization({
            id: authorization.id,
            clientID: updatedClientID,
        }))
    }

    const updateClientSecret = (updatedClientSecret: string) => {
        setClientSecret(updatedClientSecret)
        dispatch(updateAuthorization({
            id: authorization.id,
            clientSecret: updatedClientSecret ?? '',
        }))
    }

    const updateScope = (updatedScope: string) => {
        setScope(updatedScope)
        dispatch(updateAuthorization({
            id: authorization.id,
            scope: updatedScope,
        }))
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
                value={clientID}
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