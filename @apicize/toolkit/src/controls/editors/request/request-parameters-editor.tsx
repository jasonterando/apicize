import { TextField, Grid, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { useEffect, useState } from 'react'
import { RootState, updateRequest } from '../../../models/store'
import { useDispatch, useSelector } from 'react-redux'
import { Method, Methods } from '@apicize/definitions'

import './request-editor.css'

export function RequestParametersEditor() {
    const dispatch = useDispatch()

    const request = useSelector((state: RootState) => state.activeRequest)
    const [name, setName] = useState<string | undefined>(request?.name)
    const [url, setURL] = useState<string | undefined>(request?.url)
    const [method, setMethod] = useState<string | undefined>(request?.method ?? Method.Get)
    const [timeout, setTimeout] = useState(request?.timeout ?? 60000)

    useEffect(() => {
        setName(request?.name ?? '')
        setURL(request?.url ?? '')
        setMethod(request?.method ?? '')
        setTimeout(request?.timeout ?? 60000)
    }, [request])

    if (! request) {
        return null
    }

    const updateName = (name: string | undefined) => {
        setName(name)
        dispatch(updateRequest({
            id: request.id,
            name
        }))
    }

    const updateURL = (url: string | undefined) => {
        setURL(url)
        dispatch(updateRequest({
            id: request.id,
            url
        }))
    }

    const updateMethod = (method: string | undefined) => {
        setMethod(method)
        dispatch(updateRequest({
            id: request.id,
            method
        }))
    }

    const updateTimeout = (timeout: number | undefined) => {
        setTimeout(timeout ?? 0)
        dispatch(updateRequest({
            id: request.id,
            timeout
        }))
    }

    const methodMenuItems = () => {
        return Methods.map(method => (
            <MenuItem key={method} value={method}>{method}</MenuItem>
        ))
    }

    return (
        <Grid container direction={'column'} spacing={3} maxWidth={1000}>
            <Grid item>
                <TextField
                    id='request-name'
                    label="Name"
                    aria-label='Request name'
                    // size="small"
                    value={name}
                    onChange={e => updateName(e.target.value)}
                    fullWidth
                />
            </Grid>
            <Grid item>
                <TextField
                    id='request-url'
                    label="URL"
                    aria-label='Request url'
                    // size="small"
                    value={url}
                    onChange={e => updateURL(e.target.value)}
                    fullWidth
                />
            </Grid>
            <Grid item>
                <FormControl>
                    <InputLabel id='request-method-label-id'>Method</InputLabel>
                    <Select
                        labelId='request-method-label-id'
                        aria-label='Request method'
                        id="request-method"
                        value={method}
                        label="Method"
                        onChange={e => updateMethod(e.target.value)}
                    >
                        {methodMenuItems()}
                    </Select>
                </FormControl>
                <FormControl>
                    <TextField
                        aria-label='Request Timeout input'
                        placeholder='Timeout in Milliseconds'
                        label='Timeout'
                        sx={{marginLeft: '24px', width: '8em'}}
                        type='number'
                        value={timeout}
                        onChange={e => updateTimeout(parseInt(e.target.value))}
                    />
                </FormControl>
            </Grid>
        </Grid>
    )
}