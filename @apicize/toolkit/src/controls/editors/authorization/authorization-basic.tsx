import { Grid, TextField } from "@mui/material"
import { WorkbookState, updateAuthorization } from "../../../models/store"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { EditableWorkbookBasicAuthorization } from "../../../models/workbook/editable-workbook-authorization"

export function AuthorizationBasicPanel() {
    const dispatch = useDispatch()

    const authorization = useSelector((state: WorkbookState) => state.activeAuthorization as EditableWorkbookBasicAuthorization)
    const [username, setUsername] = useState<string>(authorization?.username ?? '')
    const [password, setPassword] = useState<string>(authorization?.password ?? '')

    useEffect(() => {
        setUsername(authorization?.username ?? '')
        setPassword(authorization?.password ?? '')
    }, [authorization])

    if(! authorization) {
        return null
    }

    const updateUsername = (updatedUsername: string) => {
        setUsername(updatedUsername)
        dispatch(updateAuthorization({
            id: authorization.id,
            username: updatedUsername ?? '',
        }))
    }

    const updatePassword = (updatedPassword: string) => {
        setPassword(updatedPassword)
        dispatch(updateAuthorization({
            id: authorization.id,
            password: updatedPassword ?? ''
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