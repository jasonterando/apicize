import { TextField, Grid, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { useContext } from 'react'
import { WorkbookState } from '../../../models/store'
import { useSelector } from 'react-redux'
import { Method, Methods } from '@apicize/lib-typescript'
import { WorkbookStorageContext } from '../../../contexts/workbook-storage-context'

export function RequestParametersEditor() {
    const request = useContext(WorkbookStorageContext).request

    const id = useSelector((state: WorkbookState) => state.request.id)
    const name = useSelector((state: WorkbookState) => state.request.name)
    const url = useSelector((state: WorkbookState) => state.request.url)
    const method = useSelector((state: WorkbookState) => state.request.method)
    const timeout = useSelector((state: WorkbookState) => state.request.timeout)

    if (! id) {
        return null
    }

    const updateName = (name: string) => {
        request.setName(id, name)
    }

    const updateURL = (url: string) => {
        request.setURL(id, url)
    }

    const updateMethod = (method: Method) => {
        request.setMethod(id, method)
    }

    const updateTimeout = (timeout: number) => {
        request.setTimeout(id, timeout)
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
                        onChange={e => updateMethod(e.target.value as Method)}
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