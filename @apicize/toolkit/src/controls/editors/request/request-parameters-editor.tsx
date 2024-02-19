import { TextField, Grid, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { useEffect, useState } from 'react'
import { WorkbookState, updateRequest } from '../../../models/store'
import { useDispatch, useSelector } from 'react-redux'
import { Method, Methods } from '@apicize/lib-typescript'
import { castEntryAsRequest } from '../../../models/workbook/helpers/editable-workbook-request-helpers'

export function RequestParametersEditor() {
    const dispatch = useDispatch()

    const requestEntry = useSelector((state: WorkbookState) => state.activeRequestEntry)
    const [name, setName] = useState<string | undefined>(requestEntry?.name)
    const [url, setURL] = useState<string | undefined>(castEntryAsRequest(requestEntry)?.url)
    const [method, setMethod] = useState<string | undefined>(castEntryAsRequest(requestEntry)?.method ?? Method.Get)
    const [timeout, setTimeout] = useState(castEntryAsRequest(requestEntry)?.timeout ?? 60000)

    useEffect(() => {
        setName(requestEntry?.name ?? '')
        setURL(castEntryAsRequest(requestEntry)?.url ?? '')
        setMethod(castEntryAsRequest(requestEntry)?.method ?? '')
        setTimeout(castEntryAsRequest(requestEntry)?.timeout ?? 60000)
    }, [requestEntry])

    if (! requestEntry) {
        return null
    }

    const updateName = (name: string | undefined) => {
        setName(name)
        dispatch(updateRequest({
            id: requestEntry.id,
            name
        }))
    }

    const updateURL = (url: string | undefined) => {
        setURL(url)
        dispatch(updateRequest({
            id: requestEntry.id,
            url
        }))
    }

    const updateMethod = (method: string | undefined) => {
        setMethod(method)
        dispatch(updateRequest({
            id: requestEntry.id,
            method
        }))
    }

    const updateTimeout = (timeout: number | undefined) => {
        setTimeout(timeout ?? 0)
        dispatch(updateRequest({
            id: requestEntry.id,
            timeout
        }))
    }

    const methodMenuItems = () => {
        return Methods.map(method => (
            <MenuItem key={method} value={method}>{method}</MenuItem>
        ))
    }

    return (
        <Grid container direction='column' spacing={3} maxWidth={1000}>
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