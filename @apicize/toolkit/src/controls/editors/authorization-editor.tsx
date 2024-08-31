import { TextField, Grid, Select, MenuItem, FormControl, InputLabel, Stack, SxProps, Button } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock';
import { WorkbookAuthorizationType, WorkbookOAuth2ClientAuthorization } from '@apicize/lib-typescript';
import { EditorTitle } from '../editor-title';
import { PersistenceEditor } from './persistence-editor';
import { useWorkspace } from '../../contexts/root.context';
import { EditableWorkbookApiKeyAuthorization, EditableWorkbookAuthorization, EditableWorkbookBasicAuthorization, EditableWorkbookOAuth2ClientAuthorization } from '../../models/workbook/editable-workbook-authorization';
import { EntitySelection } from '../../models/workbook/entity-selection';
import { NO_SELECTION_ID } from '../../models/store';
import { observer } from 'mobx-react-lite';
import { EditableEntityType } from '../../models/workbook/editable-entity-type';

let credIndex = 0
const itemsFromSelections = (selections: EntitySelection[]) => {
    return selections.map(s => (
        <MenuItem key={`creds-${credIndex++}`} value={s.id}>{s.name}</MenuItem>
    ))
}

export const AuthorizationEditor = observer((props: {
    sx: SxProps
    triggerClearToken: () => void
}) => {
    const workspace = useWorkspace()
    if (workspace.active?.entityType !== EditableEntityType.Authorization || workspace.helpVisible) return null

    const auth = workspace.active as EditableWorkbookAuthorization
    return (
        <Stack className='editor-panel-no-toolbar' direction={'column'} sx={props.sx}>
            <EditorTitle icon={<LockIcon />} name={auth.name} />
            <Grid container direction={'column'} spacing={3} maxWidth={1000}>
                <Grid item>
                    <TextField
                        id='auth-name'
                        label='Name'
                        aria-label='name'
                        // size='small'
                        value={auth.name}
                        onChange={e => workspace.setAuthorizationName(e.target.value)}
                        fullWidth
                    />
                </Grid>
                <Grid item>
                    <Stack direction={'row'} spacing={'2em'}>
                        <FormControl>
                            <InputLabel id='auth-type-label-id'>Type</InputLabel>
                            <Select
                                labelId='auth-type-label-id'
                                id='auth-type'
                                value={auth.type}
                                label='Type'
                                onChange={e => workspace.setAuthorizationType(e.target.value as
                                    WorkbookAuthorizationType.Basic | WorkbookAuthorizationType.ApiKey | WorkbookAuthorizationType.OAuth2Client)}
                            >
                                <MenuItem value={WorkbookAuthorizationType.Basic}>Basic Authentication</MenuItem>
                                <MenuItem value={WorkbookAuthorizationType.ApiKey}>API Key Authentication</MenuItem>
                                <MenuItem value={WorkbookAuthorizationType.OAuth2Client}>OAuth2 Client Flow</MenuItem>
                            </Select>
                        </FormControl>
                        <PersistenceEditor onUpdatePersistence={workspace.setAuthorizationPersistence} persistence={auth.persistence} />
                    </Stack>
                </Grid>
                <Grid item>
                    {
                        auth.type === WorkbookAuthorizationType.ApiKey ?
                            <Grid container direction={'column'} spacing={3} maxWidth={1000} className='authorization-editor-subpanel'>
                                <Grid item>
                                    <TextField
                                        id='auth-header'
                                        label="Header"
                                        aria-label='header'
                                        value={(auth as EditableWorkbookApiKeyAuthorization).header}
                                        onChange={e => workspace.setAuthorizationHeader(e.target.value)}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item>
                                    <TextField
                                        id='auth-value'
                                        label="Value"
                                        aria-label='value'
                                        value={(auth as EditableWorkbookApiKeyAuthorization).value}
                                        onChange={e => workspace.setAuthorizationValue(e.target.value)}
                                        fullWidth
                                    />
                                </Grid>
                            </Grid>
                            : auth.type === WorkbookAuthorizationType.Basic
                                ? <Grid container direction={'column'} spacing={3} maxWidth={1000} className='authorization-editor-subpanel'>
                                    <Grid item>
                                        <TextField
                                            id='auth-username'
                                            label="Username"
                                            aria-label='username'
                                            value={(auth as EditableWorkbookBasicAuthorization).username}
                                            onChange={e => workspace.setAuthorizationUsername(e.target.value)}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item>
                                        <TextField
                                            id='auth-password'
                                            label="Password"
                                            aria-label='password'
                                            value={(auth as EditableWorkbookBasicAuthorization).password}
                                            onChange={e => workspace.setAuthorizationPassword(e.target.value)}
                                            fullWidth
                                        />
                                    </Grid>
                                </Grid>
                                : auth.type === WorkbookAuthorizationType.OAuth2Client
                                    ? <Grid container direction={'column'} spacing={3} maxWidth={1000} className='authorization-editor-subpanel'>
                                        <Grid item>
                                            <TextField
                                                id='auth-oauth2-access-token-url'
                                                label='Access Token URL'
                                                aria-label='access token url'
                                                value={(auth as EditableWorkbookOAuth2ClientAuthorization).accessTokenUrl}
                                                onChange={e => workspace.setAuthorizatinoAccessTokenUrl(e.target.value)}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item>
                                            <TextField
                                                id='auth-oauth2-client-id'
                                                label='Client ID'
                                                aria-label='client id'
                                                value={(auth as EditableWorkbookOAuth2ClientAuthorization).clientId}
                                                onChange={e => workspace.setAuthorizationClientId(e.target.value)}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item>
                                            <TextField
                                                id='auth-oauth2-client-secret'
                                                label='Client Secret'
                                                aria-label='client secret'
                                                value={(auth as EditableWorkbookOAuth2ClientAuthorization).clientSecret}
                                                onChange={e => workspace.setAuthorizationClientSecret(e.target.value)}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item>
                                            <TextField
                                                id='auth-oauth2-scope'
                                                label='Scope'
                                                aria-label='scope'
                                                value={(auth as EditableWorkbookOAuth2ClientAuthorization).scope}
                                                onChange={e => workspace.setAuthorizationScope(e.target.value)}
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
                                                    value={(auth as EditableWorkbookOAuth2ClientAuthorization).selectedCertificate?.id ?? NO_SELECTION_ID}
                                                    onChange={(e) => workspace.setAuthorizationSelectedCertificateId(e.target.value)}
                                                    fullWidth
                                                >
                                                    {itemsFromSelections(workspace.getAuthorizationCertificateList())}
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
                                                    value={(auth as EditableWorkbookOAuth2ClientAuthorization).selectedProxy?.id ?? NO_SELECTION_ID}
                                                    onChange={(e) => workspace.setAuthorizationSelectedProxyId(e.target.value)}
                                                    fullWidth
                                                >
                                                    {itemsFromSelections(workspace.getAuthorizationProxyList())}
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
                                    </Grid >
                                    : null
                    }
                </Grid>
            </Grid>
        </Stack>
    )
})