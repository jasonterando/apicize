import { Grid, TextField } from "@mui/material"
import { RootState, updateAuthorization } from "../../../models/store"
import { useEffect, useState } from "react"
import { ApiKeyAuthorizationData } from "@apicize/definitions"
import { useDispatch, useSelector } from "react-redux"

export function AuthorizationApiKeyPanel() {
    const dispatch = useDispatch()

    const authorization = useSelector((state: RootState) => state.activeAuthorization)
    const [header, setHeader] = useState<string>((authorization?.data as ApiKeyAuthorizationData)?.header ?? '')
    const [value, setValue] = useState<string>((authorization?.data as ApiKeyAuthorizationData)?.value ?? '')

    useEffect(() => {
        const data = authorization?.data as ApiKeyAuthorizationData
        setHeader(data?.header ?? '')
        setValue(data?.value ?? '')
    }, [authorization])

    if (!authorization) {
        return null
    }

    const updateHeader = (updatedHeader: string) => {
        setHeader(updatedHeader)
        dispatch(updateAuthorization({
            id: authorization.id,
            data: {
                header: updatedHeader,
                value: value ?? ''
            }
        }))
    }

    const updateValue = (updatedValue: string) => {
        setValue(updatedValue)
        dispatch(updateAuthorization({
            id: authorization.id,
            data: {
                header: header ?? '',
                value: updatedValue
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