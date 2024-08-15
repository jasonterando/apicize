import { Grid, TextField } from "@mui/material"
import { useAuthorizationEditor } from "../../../contexts/editors/authorization-editor-context"

export function AuthorizationBasicPanel() {
    const authCtx = useAuthorizationEditor()
    if (! authCtx) return <></>

    return (<Grid container direction={'column'} spacing={3} maxWidth={1000} className='authorization-editor-subpanel'>
        <Grid item>
            <TextField
                id='auth-username'
                label="Username"
                aria-label='username'
                value={authCtx.username}
                onChange={e => authCtx.changeUsername(e.target.value)}
                fullWidth
            />
        </Grid>
        <Grid item>
            <TextField
                id='auth-password'
                label="Password"
                aria-label='password'
                value={authCtx.password}
                onChange={e => authCtx.changePassword(e.target.value)}
                fullWidth
            />
        </Grid>
    </Grid>)
}