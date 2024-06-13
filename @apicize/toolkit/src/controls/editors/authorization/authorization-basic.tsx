import { Grid, TextField } from "@mui/material"
import { WorkbookState } from "../../../models/store"
import { useContext } from "react"
import { useSelector } from "react-redux"
import { WorkbookStorageContext } from "../../../contexts/workbook-storage-context"

export function AuthorizationBasicPanel() {
    const auth = useContext(WorkbookStorageContext).authorization

    const id = useSelector((state: WorkbookState) => state.authorization.id)
    const username = useSelector((state: WorkbookState) => state.authorization.username ?? '')
    const password = useSelector((state: WorkbookState) => state.authorization.password ?? '')

    if(! id) {
        return null
    }

    const updateUsername = (updatedUsername: string) => {
        auth.setUsername(id, updatedUsername)
    }

    const updatePassword = (updatedPassword: string) => {
        auth.setPassword(id, updatedPassword)
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