import { TextField, Box, Grid, Select, MenuItem, FormControl, InputLabel, Typography, Stack } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock';
import { useSelector } from "react-redux";
import { useEffect, useState } from 'react'
import { RootState, updateAuthorization } from '../../models/store'
import { useDispatch } from 'react-redux'
import { RequestAuthorizationType } from '@apicize/definitions'

import '../styles.css'
import { AuthorizationBasicPanel } from './authorization/authorization-basic';
import { AuthorizationOAuth2ClientPanel } from './authorization/authorization-oauth2-client';
import { AuthorizationApiKeyPanel } from './authorization/authorization-api-key';

export function AuthorizationEditor() {
    const authorization = useSelector((state: RootState) => state.activeAuthorization)
    const dispatch = useDispatch()

    const [name, setName] = useState<string | undefined>(authorization?.name ?? '')
    const [type, setType] = useState<string | undefined>(authorization?.type ?? RequestAuthorizationType.Basic)

    useEffect(() => {
        setName(authorization?.name ?? '')
        setType(authorization?.type ?? RequestAuthorizationType.Basic)
    }, [authorization])

    if (!authorization) {
        return null
    }

    const updateName = (name: string | undefined) => {
        setName(name)
        dispatch(updateAuthorization({
            id: authorization.id,
            name
        }))
    }

    const updateType = (type: string) => {
        setType(type)
        dispatch(updateAuthorization({
            id: authorization.id,
            type
        }))
    }
    return (
        <Stack direction={'column'} className='section no-button-column' sx={{ flexGrow: 1 }}>
            <Typography variant='h1'><LockIcon /> {name?.length ?? 0 > 0 ? name : '(Unnamed)'}</Typography>
            <Box className='section'>
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
                                <MenuItem value={RequestAuthorizationType.Basic}>Basic Authentication</MenuItem>
                                <MenuItem value={RequestAuthorizationType.ApiKey}>API Key Authentication</MenuItem>
                                <MenuItem value={RequestAuthorizationType.OAuth2Client}>OAuth2 Client Flow</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Box>
            {authorization.type === RequestAuthorizationType.Basic ? <AuthorizationBasicPanel /> :
                authorization.type === RequestAuthorizationType.OAuth2Client ? <AuthorizationOAuth2ClientPanel /> :
                    authorization.type === RequestAuthorizationType.ApiKey ? <AuthorizationApiKeyPanel /> :
                        null
            }
        </Stack>
    )
}