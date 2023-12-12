import { Grid, TextField } from "@mui/material"
import { BasicAuthorizationData } from "@apicize/definitions"
import { RootState, updateAuthorization } from "../../../models/store"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

export function AuthorizationBasicPanel() {
    const dispatch = useDispatch()

    const authorization = useSelector((state: RootState) => state.activeAuthorization)
    const [username, setUsername] = useState<string>((authorization?.data as BasicAuthorizationData)?.username ?? '')
    const [password, setPassword] = useState<string>((authorization?.data as BasicAuthorizationData)?.password ?? '')

    useEffect(() => {
        const data = authorization?.data as BasicAuthorizationData
        setUsername(data?.username ?? '')
        setPassword(data?.password ?? '')
    }, [authorization])

    if(! authorization) {
        return null
    }

    const updateUsername = (updatedUsername: string) => {
        setUsername(updatedUsername)
        dispatch(updateAuthorization({
            id: authorization.id,
            data: {
                username: updatedUsername ?? '',
                password: password ?? ''
            }
        }))
    }

    const updatePassword = (updatedPassword: string) => {
        setPassword(updatedPassword)
        dispatch(updateAuthorization({
            id: authorization.id,
            data: {
                username: username ?? '',
                password: updatedPassword ?? ''
            }
        }))
    }

    return (<Grid container direction={'column'} spacing={3} maxWidth={1000} className='authorization-editor-subpanel'>
        <Grid item>
            <TextField
                id='auth-username'
                label="Username"
                aria-label='username'
                value={username}
                onChange={e => updateUsername(e.target.value)}
                fullWidth
            />
        </Grid>
        <Grid item>
            <TextField
                id='auth-password'
                label="Password"
                aria-label='password'
                value={password}
                onChange={e => updatePassword(e.target.value)}
                fullWidth
            />
        </Grid>
    </Grid>)
}