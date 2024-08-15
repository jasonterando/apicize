import { Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import { EntitySelection } from '../../../models/workbook/entity-selection'
import { useAuthorizationEditor } from '../../../contexts/editors/authorization-editor-context'

export function AuthorizationOAuth2ClientPanel(props = { triggerClearToken: () => { } }) {
    const authCtx = useAuthorizationEditor()
    if (! authCtx) return <></>

    // const updateSendCredentialsInBody = (updatedSendCredentialsInBody: string) => {
    //     setSendCredentialsInBody(updatedSendCredentialsInBody)
    //     dispatch(updateAuthorization({
    //         id: authorization.id,
    //         sendCredentialsInBody: updatedSendCredentialsInBody === 'yes'
    //     }))
    // }

    let credIndex = 0
    const itemsFromSelections = (selections: EntitySelection[]) => {
        return selections.map(s => (
            <MenuItem key={`creds-${credIndex++}`} value={s.id}>{s.name}</MenuItem>
        ))
    }

    return (<Grid container direction={'column'} spacing={3} maxWidth={1000} className='authorization-editor-subpanel'>
        <Grid item>
            <TextField
                id='auth-oauth2-access-token-url'
                label='Access Token URL'
                aria-label='access token url'
                value={authCtx.accessTokenUrl}
                onChange={e => authCtx.changeAccessTokenUrl(e.target.value)}
                fullWidth
            />
        </Grid>
        <Grid item>
            <TextField
                id='auth-oauth2-client-id'
                label='Client ID'
                aria-label='client id'
                value={authCtx.clientId}
                onChange={e => authCtx.changeClientId(e.target.value)}
                fullWidth
            />
        </Grid>
        <Grid item>
            <TextField
                id='auth-oauth2-client-secret'
                label='Client Secret'
                aria-label='client secret'
                value={authCtx.clientSecret}
                onChange={e => authCtx.changeClientSecret(e.target.value)}
                fullWidth
            />
        </Grid>
        <Grid item>
            <TextField
                id='auth-oauth2-scope'
                label='Scope'
                aria-label='scope'
                value={authCtx.scope}
                onChange={e => authCtx.changeScope(e.target.value)}
                fullWidth
            />
        </Grid>
        <Grid item>
            <FormControl>
                <InputLabel id='cred-cert-label'>Certificate</InputLabel>
                <Select
                    labelId='cred-cert-label'
                    id='cred-cert'
                    label='Certificate'
                    value={authCtx.selectedCertificateId}
                    onChange={(e) => authCtx.changeSelectedCertificateId(e.target.value)}
                    fullWidth
                >
                    {itemsFromSelections(authCtx.certificates)}
                </Select>
            </FormControl>
        </Grid>
        <Grid item>
            <FormControl>
                <InputLabel id='cred-proxy-label'>Proxy</InputLabel>
                <Select
                    labelId='cred-proxy-label'
                    id='cred-proxy'
                    label='Proxy'
                    value={authCtx.selectedProxyId}
                    onChange={(e) => authCtx.changeSelectedProxyId(e.target.value)}
                    fullWidth
                >
                    {itemsFromSelections(authCtx.proxies)}
                </Select>
            </FormControl>
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
    </Grid >)
}