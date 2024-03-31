import { Grid, TextField } from "@mui/material"
import { WorkbookState } from "../../../models/store"
import { useContext } from "react"
import { useSelector } from "react-redux"
import { WorkbookStorageContext } from "../../../contexts/workbook-storage-context"

export function AuthorizationApiKeyPanel() {
    const auth = useContext(WorkbookStorageContext).authorization

    const id = useSelector((state: WorkbookState) => state.authorization.id)
    const header = useSelector((state: WorkbookState) => state.authorization.header)
    const value = useSelector((state: WorkbookState) => state.authorization.value)

    if (!id) {
        return null
    }

    const updateHeader = (updatedHeader: string) => {
        auth.setHeader(id, updatedHeader)
    }

    const updateValue = (updatedValue: string) => {
        auth.setValue(id, updatedValue)
    }

    return (<Grid container direction={'column'} spacing={3} maxWidth={1000} className='authorization-editor-subpanel'>
        <Grid item>
            <TextField
                id='auth-header'
                label="Header"
                aria-label='header'
                value={header}
                onChange={e => updateHeader(e.target.value)}
                fullWidth
            />
        </Grid>
        <Grid item>
            <TextField
                id='auth-value'
                label="Value"
                aria-label='value'
                value={value}
                onChange={e => updateValue(e.target.value)}
                fullWidth
            />
        </Grid>
    </Grid>)
}