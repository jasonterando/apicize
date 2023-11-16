import { FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import { EditableWorkbookAuthorization, OAuth2ClientAuthorizationData } from '@apicize/definitions'
import { updateAuthorization } from '../../../models/store'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

export function AuthorizationOAuth2ClientPanel(props: { auth: EditableWorkbookAuthorization }) {
    const dispatch = useDispatch()

    const [accessTokenUrl, setAccessTokenUrl] = useState<string | undefined>((props.auth?.data as OAuth2ClientAuthorizationData)?.accessTokenUrl)
    const [clientID, setClientID] = useState<string | undefined>((props.auth?.data as OAuth2ClientAuthorizationData)?.clientID)
    const [clientSecret, setClientSecret] = useState<string | undefined>((props.auth?.data as OAuth2ClientAuthorizationData)?.clientSecret)
    const [scope, setScope] = useState<string | undefined>((props.auth?.data as OAuth2ClientAuthorizationData)?.scope)
    const [sendCredentialsInBody, setSendCredentialsInBody] = useState<string>(((props.auth?.data as OAuth2ClientAuthorizationData)?.sendCredentialsInBody ?? false) ? 'yes' : 'no')

    useEffect(() => {
        const data = props.auth.data as OAuth2ClientAuthorizationData
        setAccessTokenUrl(data?.accessTokenUrl ?? '')
        setClientID(data?.clientID ?? '')
        setClientSecret(data?.clientSecret ?? '')
        setScope(data?.scope ?? '')
        setSendCredentialsInBody(data?.sendCredentialsInBody ? 'yes' : 'no')
    }, [props.auth])

    const updateData = (accessTokenUrl: string | undefined,
        clientID: string | undefined,
        clientSecret: string | undefined,
        scope: string | undefined,
        sendCredentialsInBody: boolean) => {
        dispatch(updateAuthorization({ data: {
            accessTokenUrl: accessTokenUrl ?? '',
            clientID: clientID ?? '',
            clientSecret: clientSecret ?? '',
            scope: scope ?? '',
            sendCredentialsInBody
        } }))
    }

    return (<Grid container direction={'column'} spacing={3} maxWidth={1000} className='authorization-editor-subpanel'>
        <Grid item>
            <TextField
                id='auth-oauth2-access-token-url'
                label='Access Token URL'
                aria-label='access token url'
                value={accessTokenUrl}
                onChange={e => updateData(e.target.value, clientID, clientSecret, scope, sendCredentialsInBody === 'yes')}
                fullWidth
            />
        </Grid>
        <Grid item>
            <TextField
                id='auth-oauth2-client-id'
                label='Client ID'
                aria-label='client id'
                value={clientID}
                onChange={e => updateData(accessTokenUrl, e.target.value, clientSecret, scope, sendCredentialsInBody === 'yes' )}
                fullWidth
            />
        </Grid>
        <Grid item>
            <TextField
                id='auth-oauth2-client-secret'
                label='Client Secret'
                aria-label='client secret'
                value={clientSecret}
                onChange={e => updateData(accessTokenUrl, clientID, e.target.value, scope, sendCredentialsInBody === 'yes')}
                fullWidth
            />
        </Grid>
        <Grid item>
            <TextField
                id='auth-oauth2-scope'
                label='Scope'
                aria-label='scope'
                value={scope}
                onChange={e => updateData(accessTokenUrl, clientID, clientSecret, e.target.value, sendCredentialsInBody === 'yes')}
                fullWidth
            />
        </Grid>
        <Grid item>
            <FormControl>
                <InputLabel id='auth-oauth2-creds-lbl-id'>Credential Method</InputLabel>
                <Select
                    labelId='auth-oauth2-creds-lbl-id'
                    id='auth-oauth2-creds-id'
                    value={sendCredentialsInBody}
                    label='Credential Method'
                    onChange={e => updateData(accessTokenUrl, clientID, clientSecret, scope, e.target.value == 'yes')}
                >
                    <MenuItem value='no'>Send Credentials in Auth Header</MenuItem>
                    <MenuItem value='yes'>Send Credentials in Body</MenuItem>
                </Select>
            </FormControl>
        </Grid>


    </Grid>)
}