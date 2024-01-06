import { Grid, TextField } from "@mui/material"
import { WorkbookState, updateAuthorization } from "../../../models/store"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { EditableWorkbookApiKeyAuthorization } from "../../../models/workbook/editable-workbook-authorization"

export function AuthorizationApiKeyPanel() {
    const dispatch = useDispatch()

    const authorization = useSelector((state: WorkbookState) => state.activeAuthorization as EditableWorkbookApiKeyAuthorization)
    const [header, setHeader] = useState<string>(authorization?.header ?? '')
    const [value, setValue] = useState<string>(authorization?.value ?? '')

    useEffect(() => {
        setHeader(authorization?.header ?? '')
        setValue(authorization?.value ?? '')
    }, [authorization])

    if (!authorization) {
        return null
    }

    const updateHeader = (updatedHeader: string) => {
        setHeader(updatedHeader)
        dispatch(updateAuthorization({
            id: authorization.id,
            header: updatedHeader,
        }))
    }

    const updateValue = (updatedValue: string) => {
        setValue(updatedValue)
        dispatch(updateAuthorization({
            id: authorization.id,
            value: updatedValue
        }))
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