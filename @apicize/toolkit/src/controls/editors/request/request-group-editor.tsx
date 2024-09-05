import { TextField, SxProps, Grid, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { WorkbookGroupExecution, WorkbookRequestType } from '@apicize/lib-typescript';
import { useWorkspace } from '../../../contexts/root.context';
import { EditableEntityType } from '../../../models/workbook/editable-entity-type';
import { EditableWorkbookRequest } from '../../../models/workbook/editable-workbook-request';
import { observer } from 'mobx-react-lite';

export const RequestGroupEditor = observer((props: {
    sx?: SxProps
}) => {
    const workspace = useWorkspace()

    if (workspace.active?.entityType !== EditableEntityType.Request) {
        return null
    }

    const request = workspace.active as EditableWorkbookRequest
    if (request.type !== WorkbookRequestType.Group) {
        return null
    }

    return (
        <Grid container direction='column' spacing={3} maxWidth={1000} sx={props.sx}>
            <Grid item>
                <TextField
                    id='group-name'
                    label='Name'
                    aria-label='name'
                    sx={{ flexGrow: 1 }}
                    fullWidth
                    // size='small'
                    value={request.name}
                    onChange={e => workspace.setRequestName(e.target.value)}
                />
            </Grid>
            <Grid item>
                <FormControl>
                    <InputLabel id='execution-id'>Execution Mode</InputLabel>
                    <Select
                        labelId='execution-id'
                        id='execution'
                        value={request.execution}
                        label='Type'
                        onChange={e => workspace.setGroupExecution(e.target.value as WorkbookGroupExecution)}
                    >
                        <MenuItem value={WorkbookGroupExecution.Sequential}>Sequential</MenuItem>
                        <MenuItem value={WorkbookGroupExecution.Concurrent}>Concurrent</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
        </Grid >
    )
})