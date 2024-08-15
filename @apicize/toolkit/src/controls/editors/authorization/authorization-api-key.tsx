import { Grid, TextField } from "@mui/material"
import { useAuthorizationEditor } from "../../../contexts/editors/authorization-editor-context"

export function AuthorizationApiKeyPanel() {
    const authCtx = useAuthorizationEditor()
    if (! authCtx) return <></>

    return (<Grid container direction={'column'} spacing={3} maxWidth={1000} className='authorization-editor-subpanel'>
        <Grid item>
            <TextField
                id='auth-header'
                label="Header"
                aria-label='header'
                value={authCtx.header}
                onChange={e => authCtx.changeHeader(e.target.value)}
                fullWidth
            />
        </Grid>
        <Grid item>
            <TextField
                id='auth-value'
                label="Value"
                aria-label='value'
                value={authCtx.value}
                onChange={e => authCtx.changeValue(e.target.value)}
                fullWidth
            />
        </Grid>
    </Grid>)
}