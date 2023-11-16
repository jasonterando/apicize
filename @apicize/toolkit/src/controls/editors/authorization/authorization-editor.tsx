import { TextField, Box, Grid, Select, MenuItem, FormControl, InputLabel, Typography } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock';
import { useEffect, useState } from 'react'
import { updateAuthorization } from '../../../models/store'
import { useDispatch } from 'react-redux'
import { EditableWorkbookAuthorization, RequestAuthorizationType } from '@apicize/definitions'

import './authorization-editor.css'
import { AuthorizationBasicPanel } from './authorization-basic';
import { AuthorizationOAuth2ClientPanel } from './authorization-oauth2-client';
import { AuthorizationApiKeyPanel } from './authorization-api-key';

export function AuthorizationEditor(props: { authorization: EditableWorkbookAuthorization }) {
    const dispatch = useDispatch()

    const [name, setName] = useState<string | undefined>(props.authorization.name)
    const [type, setType] = useState<string | undefined>(props.authorization.type)

    useEffect(() => {
        setName(props.authorization.name)
        setType(props.authorization.type)
    }, [props.authorization])

    const updateName = (name: string | undefined) => {
        dispatch(updateAuthorization({
            name
        }))
    }

    const updateType = (type: string) => {
        dispatch(updateAuthorization({
            type
        }))
    }

    return (
        <Box className='authorization-editor'>
            <Box className='authorization-editor-panel'>
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
                                <MenuItem value={RequestAuthorizationType.Basic}>Basic Authentication</MenuItem>
                                <MenuItem value={RequestAuthorizationType.ApiKey}>API Key Authentication</MenuItem>
                                <MenuItem value={RequestAuthorizationType.OAuth2Client}>OAuth2 Client Flow</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                {
                    type === RequestAuthorizationType.Basic
                        ? <AuthorizationBasicPanel auth={props.authorization} />
                        : type === RequestAuthorizationType.OAuth2Client
                            ? <AuthorizationOAuth2ClientPanel auth={props.authorization} />
                            : type == RequestAuthorizationType.ApiKey
                                ? <AuthorizationApiKeyPanel auth={props.authorization} />
                                : null
                }
            </Box>


        </Box>
    )
}