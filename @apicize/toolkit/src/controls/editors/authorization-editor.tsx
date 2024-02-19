import { TextField, Box, Grid, Select, MenuItem, FormControl, InputLabel, Typography, Stack, Container } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock';
import { useSelector } from "react-redux";
import { useEffect, useState } from 'react'
import { WorkbookState, updateAuthorization } from '../../models/store'
import { useDispatch } from 'react-redux'
import { AuthorizationBasicPanel } from './authorization/authorization-basic';
import { AuthorizationOAuth2ClientPanel } from './authorization/authorization-oauth2-client';
import { AuthorizationApiKeyPanel } from './authorization/authorization-api-key';
import { WorkbookAuthorizationType } from '@apicize/lib-typescript';

export function AuthorizationEditor(props = { triggerClearToken: () => { } }) {
    const authorization = useSelector((state: WorkbookState) => state.activeAuthorization)
    const dispatch = useDispatch()

    const [name, setName] = useState<string | undefined>(authorization?.name ?? '')
    const [type, setType] = useState<string | undefined>(authorization?.type ?? WorkbookAuthorizationType.Basic)

    useEffect(() => {
        setName(authorization?.name ?? '')
        setType(authorization?.type ?? WorkbookAuthorizationType.Basic)
    }, [authorization])

    if (!authorization) {
        return null
    }

    const updateName = (name: string | undefined) => {
        dispatch(updateAuthorization({
            id: authorization.id,
            name
        }))
    }

    const updateType = (type: string) => {
        dispatch(updateAuthorization({
            id: authorization.id,
            type
        }))
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
                        {authorization.type === WorkbookAuthorizationType.Basic ? <AuthorizationBasicPanel /> :
                            authorization.type === WorkbookAuthorizationType.OAuth2Client ? <AuthorizationOAuth2ClientPanel triggerClearToken={props.triggerClearToken} /> :
                                authorization.type === WorkbookAuthorizationType.ApiKey ? <AuthorizationApiKeyPanel /> :
                                    null
                        }
                    </Grid>
                </Grid>
            </Stack>
        </Container>
    )
}