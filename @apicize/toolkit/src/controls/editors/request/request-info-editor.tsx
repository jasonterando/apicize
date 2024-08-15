import { TextField, Grid, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material'
import { WorkbookMethod, WorkbookMethods } from '@apicize/lib-typescript'
import { useRequestEditor } from '../../../contexts/editors/request-editor-context'

export function RequestInfoEditor() {
    const requestCtx = useRequestEditor()

    if (requestCtx.id.length === 0) {
        return null
    }

    const methodMenuItems = () => {
        return WorkbookMethods.map(method => (
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
                    value={requestCtx.name}
                    onChange={e => requestCtx.changeName(e.target.value)}
                    fullWidth
                />
            </Grid>
            <Grid item>
                <TextField
                    id='request-url'
                    label="URL"
                    aria-label='Request url'
                    // size="small"
                    value={requestCtx.url}
                    onChange={e => requestCtx.changeUrl(e.target.value)}
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
                        value={requestCtx.method}
                        label="Method"
                        onChange={e => requestCtx.changeMethod(e.target.value as WorkbookMethod)}
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
                        value={requestCtx.timeout}
                        onChange={e => requestCtx.changeTimeout(parseInt(e.target.value))}
                    />
                </FormControl>
            </Grid>
        </Grid>
    )
}