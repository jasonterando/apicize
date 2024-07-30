import { Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import { WorkbookState } from '../../../models/store'
import { useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { WorkspaceContext } from '../../../contexts/workspace-context'
import { EntitySelection } from '../../../models/workbook/entity-selection'

export function AuthorizationOAuth2ClientPanel(props = { triggerClearToken: () => { } }) {
    const auth = useContext(WorkspaceContext).authorization

    const id = useSelector((state: WorkbookState) => state.authorization.id)
    const accessTokenUrl = useSelector((state: WorkbookState) => state.authorization.accessTokenUrl ?? '')
    const clientId = useSelector((state: WorkbookState) => state.authorization.clientId ?? '')
    const clientSecret = useSelector((state: WorkbookState) => state.authorization.clientSecret ?? '')
    const scope = useSelector((state: WorkbookState) => state.authorization.scope ?? '')
    const certificates = useSelector((state: WorkbookState) => state.authorization.certificates)
    const certificateId = useSelector((state: WorkbookState) => state.authorization.certificateId)
    const proxies = useSelector((state: WorkbookState) => state.authorization.proxies)
    const proxyId = useSelector((state: WorkbookState) => state.authorization.proxyId)

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

    const updateCertificateId = (updatedId: string) => {
        auth.setSelectedCertificateId(id, updatedId)
    }

    const updatedProxyId = (updatedId: string) => {
        auth.setSelectedProxyId(id, updatedId)
    }

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
            <FormControl>
                <InputLabel id='cred-cert-label'>Certificate</InputLabel>
                <Select
                    labelId='cred-cert-label'
                    id='cred-cert'
                    label='Certificate'
                    value={certificateId}
                    onChange={(e) => updateCertificateId(e.target.value)}
                    fullWidth
                >
                    {itemsFromSelections(certificates)}
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
                    value={proxyId}
                    onChange={(e) => updatedProxyId(e.target.value)}
                    fullWidth
                >
                    {itemsFromSelections(proxies)}
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