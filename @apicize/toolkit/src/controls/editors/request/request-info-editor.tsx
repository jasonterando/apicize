import { TextField, Grid, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material'
import { WorkbookMethod, WorkbookMethods, WorkbookRequestType } from '@apicize/lib-typescript'
import { useWorkspace } from '../../../contexts/root.context'
import { EditableEntityType } from '../../../models/workbook/editable-entity-type'
import { EditableWorkbookRequest, EditableWorkbookRequestEntry } from '../../../models/workbook/editable-workbook-request'
import { observer } from 'mobx-react-lite'

export const RequestInfoEditor = observer(() => {
    const workspace = useWorkspace()
    
    if (workspace.active?.entityType !== EditableEntityType.Request) {
        return null
    }

    const requestEntry = workspace.active as EditableWorkbookRequestEntry
    if (requestEntry.type !== WorkbookRequestType.Request) {
        return null
    }

    const request = requestEntry as EditableWorkbookRequest

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
                    value={request.name}
                    onChange={e => workspace.setRequestName(e.target.value)}
                    fullWidth
                />
            </Grid>
            <Grid item>
                <TextField
                    id='request-url'
                    label="URL"
                    aria-label='Request url'
                    // size="small"
                    value={request.url}
                    onChange={e => workspace.setRequestUrl(e.target.value)}
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
                        value={request.method}
                        label="Method"
                        onChange={e => workspace.setRequestMethod(e.target.value as WorkbookMethod)}
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
                        value={request.timeout}
                        onChange={e => workspace.setRequestTimeout(parseInt(e.target.value))}
                    />
                </FormControl>
            </Grid>
        </Grid>
    )
})
