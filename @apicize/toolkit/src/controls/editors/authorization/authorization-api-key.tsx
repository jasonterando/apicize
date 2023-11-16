import { Grid, TextField } from "@mui/material"
import { updateAuthorization } from "../../../models/store"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { ApiKeyAuthorizationData } from "@apicize/definitions/dist/models/authorization"
import { EditableWorkbookAuthorization } from "@apicize/definitions"

export function AuthorizationApiKeyPanel(props: { auth: EditableWorkbookAuthorization }) {
    const dispatch = useDispatch()

    const [header, setHeader] = useState<string | undefined>((props.auth?.data as ApiKeyAuthorizationData)?.header)
    const [value, setValue] = useState<string | undefined>((props.auth?.data as ApiKeyAuthorizationData)?.value)

    useEffect(() => {
        const data = props.auth.data as ApiKeyAuthorizationData
        setHeader(data?.header ?? '')
        setValue(data?.value ?? '')
    }, [props.auth])

    const updateData = (header: string | undefined, value: string | undefined) => {
        dispatch(updateAuthorization({
            data: {
                header: header ?? "",
                value: value ?? ""
            }
        }))
    }

    return (<Grid container direction={'column'} spacing={3} maxWidth={1000} className='authorization-editor-subpanel'>
        <Grid item>
            <TextField
                id='auth-header'
                label="Header"
                aria-label='header'
                value={header}
                onChange={e => updateData(e.target.value, value)}
                fullWidth
            />
        </Grid>
        <Grid item>
            <TextField
                id='auth-value'
                label="Value"
                aria-label='value'
                value={value}
                onChange={e => updateData(header, e.target.value)}
                fullWidth
            />
        </Grid>
    </Grid>)
}