import { TextField, Grid, Select, MenuItem, FormControl, InputLabel, Stack, SxProps } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock';
import { AuthorizationBasicPanel } from './authorization/authorization-basic';
import { AuthorizationOAuth2ClientPanel } from './authorization/authorization-oauth2-client';
import { AuthorizationApiKeyPanel } from './authorization/authorization-api-key';
import { WorkbookAuthorizationType } from '@apicize/lib-typescript';
import { EditorTitle } from '../editor-title';
import { PersistenceEditor } from './persistence-editor';
import { useAuthorizationEditor } from '../../contexts/editors/authorization-editor-context';

export function AuthorizationEditor(props: {
    sx: SxProps,
    triggerClearToken: () => void
}) {
    const authCtx = useAuthorizationEditor()
    return (
        <Stack className='editor-panel-no-toolbar' direction={'column'} sx={props.sx}>
            <EditorTitle icon={<LockIcon />} name={authCtx.name} />
            <Grid container direction={'column'} spacing={3} maxWidth={1000}>
                <Grid item>
                    <TextField
                        id='auth-name'
                        label='Name'
                        aria-label='name'
                        // size='small'
                        value={authCtx.name}
                        onChange={e => authCtx.changeName(e.target.value)}
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
                                value={authCtx.type}
                                label='Type'
                                onChange={e => authCtx.changeType(e.target.value as WorkbookAuthorizationType)}
                            >
                                <MenuItem value={WorkbookAuthorizationType.Basic}>Basic Authentication</MenuItem>
                                <MenuItem value={WorkbookAuthorizationType.ApiKey}>API Key Authentication</MenuItem>
                                <MenuItem value={WorkbookAuthorizationType.OAuth2Client}>OAuth2 Client Flow</MenuItem>
                            </Select>
                        </FormControl>
                        <PersistenceEditor onUpdatePersistence={authCtx.changePersistence} persistence={authCtx.persistence} />
                    </Stack>
                </Grid>
                <Grid item>
                    {authCtx.type === WorkbookAuthorizationType.Basic ? <AuthorizationBasicPanel /> :
                        authCtx.type === WorkbookAuthorizationType.OAuth2Client ? <AuthorizationOAuth2ClientPanel triggerClearToken={props.triggerClearToken} /> :
                            authCtx.type === WorkbookAuthorizationType.ApiKey ? <AuthorizationApiKeyPanel /> :
                                <></>
                    }
                </Grid>
            </Grid>
        </Stack>
    )
}