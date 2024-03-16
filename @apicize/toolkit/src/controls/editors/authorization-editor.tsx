import { TextField, Grid, Select, MenuItem, FormControl, InputLabel, Typography, Stack, Container } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock';
import { useSelector } from "react-redux";
import { useContext, useEffect, useState } from 'react'
import { WorkbookState } from '../../models/store'
import { AuthorizationBasicPanel } from './authorization/authorization-basic';
import { AuthorizationOAuth2ClientPanel } from './authorization/authorization-oauth2-client';
import { AuthorizationApiKeyPanel } from './authorization/authorization-api-key';
import { WorkbookAuthorizationType } from '@apicize/lib-typescript';
import { WorkbookStorageContext } from '../../contexts/workbook-storage-context';

export function AuthorizationEditor(props = { triggerClearToken: () => { } }) {
    const auth = useContext(WorkbookStorageContext).authorization

    const id = useSelector((state: WorkbookState) => state.authorization.id)
    const name = useSelector((state: WorkbookState) => state.authorization.name)
    const type = useSelector((state: WorkbookState) => state.authorization.type)

    if (!id) {
        return null
    }

    const updateName = (name: string) => {
        auth.setName(id, name)
    }

    const updateType = (type: string) => {
        auth.setType(id, type as WorkbookAuthorizationType)
    }

    return (
        <Container sx={{ marginLeft: 0 }}>
            <Stack direction={'column'} sx={{ flexGrow: 1 }}>
                <Typography variant='h1'><LockIcon /> {name?.length ?? 0 > 0 ? name : '(Unnamed)'}</Typography>
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
                                value={type}
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
                        {type === WorkbookAuthorizationType.Basic ? <AuthorizationBasicPanel /> :
                            type === WorkbookAuthorizationType.OAuth2Client ? <AuthorizationOAuth2ClientPanel triggerClearToken={props.triggerClearToken} /> :
                                type === WorkbookAuthorizationType.ApiKey ? <AuthorizationApiKeyPanel /> :
                                    null
                        }
                    </Grid>
                </Grid>
            </Stack>
        </Container>
    )
}