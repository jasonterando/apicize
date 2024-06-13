import { TextField, Grid, Select, MenuItem, FormControl, InputLabel, Stack, FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock';
import { useSelector } from "react-redux";
import { useContext } from 'react'
import { NavigationType, WorkbookState } from '../../models/store'
import { AuthorizationBasicPanel } from './authorization/authorization-basic';
import { AuthorizationOAuth2ClientPanel } from './authorization/authorization-oauth2-client';
import { AuthorizationApiKeyPanel } from './authorization/authorization-api-key';
import { WorkbookAuthorizationType } from '@apicize/lib-typescript';
import { WorkbookStorageContext } from '../../contexts/workbook-storage-context';
import { EditorTitle } from '../editor-title';
import React from 'react';
// import { PersistenceOption } from '@apicize/lib-typescript/dist/models/workbook/workbook-authorization';

export function AuthorizationEditor(props = { triggerClearToken: () => { } }) {
    const help = useContext(WorkbookStorageContext).help
    const auth = useContext(WorkbookStorageContext).authorization

    const activeType = useSelector((state: WorkbookState) => state.navigation.activeType)
    const activeID = useSelector((state: WorkbookState) => state.navigation.activeID)
    const name = useSelector((state: WorkbookState) => state.authorization.name)
    const authType = useSelector((state: WorkbookState) => state.authorization.type)
    // const persistence = useSelector((state: WorkbookState) => state.authorization.persistence)

    React.useEffect(() => {
        if (activeType == NavigationType.Authorization) {
            help.setNextHelpTopic('authorizations')
        }
    }, [activeType])

    if (activeType !== NavigationType.Authorization || ! activeID) {
        return null
    }

    const updateName = (name: string) => {
        auth.setName(activeID, name)
    }

    const updateType = (type: string) => {
        auth.setType(activeID, type as WorkbookAuthorizationType)
    }

    // const updatePersistence = (persistence: PersistenceOption) => {
    //     auth.setPersistence(activeID, persistence)
    // }

    return (
        <Stack className='editor-panel-no-toolbar' direction={'column'} sx={{ flexGrow: 1 }}>
            <EditorTitle icon={<LockIcon />} name={name} />
            <Grid container direction={'column'} spacing={3} maxWidth={1000}>
                <Grid item>
                    <TextField
                        id='auth-name'
                        label='Name'
                        aria-label='name'
                        // size='small'
                        value={name}
                        onChange={e => updateName(e.target.value)}
                        fullWidth
                    />
                </Grid>
                <Grid item>
                    <FormControl>
                        <InputLabel id='auth-type-label-id'>Type</InputLabel>
                        <Select
                            labelId='auth-type-label-id'
                            id='auth-type'
                            value={authType}
                            label='Type'
                            onChange={e => updateType(e.target.value)}
                        >
                            <MenuItem value={WorkbookAuthorizationType.Basic}>Basic Authentication</MenuItem>
                            <MenuItem value={WorkbookAuthorizationType.ApiKey}>API Key Authentication</MenuItem>
                            <MenuItem value={WorkbookAuthorizationType.OAuth2Client}>OAuth2 Client Flow</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item>
                    {authType === WorkbookAuthorizationType.Basic ? <AuthorizationBasicPanel /> :
                        authType === WorkbookAuthorizationType.OAuth2Client ? <AuthorizationOAuth2ClientPanel triggerClearToken={props.triggerClearToken} /> :
                            authType === WorkbookAuthorizationType.ApiKey ? <AuthorizationApiKeyPanel /> :
                                null
                    }
                </Grid>
                {/* <Grid item>
                    <FormControl>
                        <FormLabel id='auth-storage-label'>Storage</FormLabel>
                        <RadioGroup
                            value={persistence}
                            onChange={e => updatePersistence(e.target.value as PersistenceOption)}
                        >
                            <FormControlLabel value={PersistenceOption.Workbook} control={<Radio />} label="Store in Workbook" />
                            <FormControlLabel value={PersistenceOption.CommonEnvironment} control={<Radio />} label="Store in Local Common Storage" />
                            <FormControlLabel value={PersistenceOption.None} control={<Radio />} label="Do Not Store" />
                        </RadioGroup>
                    </FormControl>
                </Grid> */}
            </Grid>
        </Stack>
    )
}