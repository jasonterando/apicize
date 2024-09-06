import { TextField, Grid, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material'
import { WorkbookMethod, WorkbookMethods } from '@apicize/lib-typescript'
import { useWorkspace } from '../../../contexts/root.context'
import { EditableEntityType } from '../../../models/workbook/editable-entity-type'
import { EditableWorkbookRequest } from '../../../models/workbook/editable-workbook-request'
import { observer } from 'mobx-react-lite'

export const RequestInfoEditor = observer(() => {
    const workspace = useWorkspace()
    
    if (workspace.active?.entityType !== EditableEntityType.Request) {
        return null
    }

    const request = workspace.active as EditableWorkbookRequest

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
                    required
                    // size="small"
                    value={request.name}
                    onChange={e => workspace.setName(e.target.value)}
                    error={request.nameInvalid}
                    helperText={request.nameInvalid ? 'Request name is required' : ''}
                    fullWidth
                />
            </Grid>
            <Grid item>
                <TextField
                    id='request-url'
                    label="URL"
                    aria-label='Request url'
                    required
                    // size="small"
                    value={request.url}
                    onChange={e => workspace.setRequestUrl(e.target.value)}
                    error={request.urlInvalid}
                    helperText={request.urlInvalid ? 'URL must include http/https protocol prefix and address' : ''}
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
