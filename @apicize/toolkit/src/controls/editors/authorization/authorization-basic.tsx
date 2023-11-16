import { Grid, TextField } from "@mui/material"
import { BasicAuthorizationData, EditableWorkbookAuthorization } from "@apicize/definitions"
import { updateAuthorization } from "../../../models/store"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"

export function AuthorizationBasicPanel(props: { auth: EditableWorkbookAuthorization }) {
    const dispatch = useDispatch()

    const [username, setUsername] = useState<string | undefined>((props.auth?.data as BasicAuthorizationData)?.username)
    const [password, setPassword] = useState<string | undefined>((props.auth?.data as BasicAuthorizationData)?.password)

    useEffect(() => {
        const data = props.auth.data as BasicAuthorizationData
        setUsername(data?.username ?? '')
        setPassword(data?.password ?? '')
    }, [props.auth])

    const updateData = (username: string | undefined, password: string | undefined) => {
        dispatch(updateAuthorization({
            data: {
                username: username ?? "",
                password: password ?? ""
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
                onChange={e => updateData(e.target.value, password)}
                fullWidth
            />
        </Grid>
        <Grid item>
            <TextField
                id='auth-password'
                label="Password"
                aria-label='password'
                value={password}
                onChange={e => updateData(username, e.target.value)}
                fullWidth
            />
        </Grid>
    </Grid>)
}