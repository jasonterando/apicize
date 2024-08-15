import { TextField, SxProps, Grid, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { WorkbookGroupExecution } from '@apicize/lib-typescript';
import { useRequestEditor } from '../../../contexts/editors/request-editor-context';

export function RequestGroupEditor(props: {
    sx?: SxProps
}) {
    const requestCtx = useRequestEditor()

    if (requestCtx.id.length === 0) return (<></>)

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
                    value={requestCtx.name}
                    onChange={e => requestCtx.changeName(e.target.value)}
                />
            </Grid>
            <Grid item>
            <FormControl>
                <InputLabel id='execution-id'>Execution Mode</InputLabel>
                <Select
                    labelId='execution-id'
                    id='execution'
                    value={requestCtx.execution}
                    label='Type'
                    onChange={e => requestCtx.changeExecution(e.target.value as WorkbookGroupExecution)}
                >
                    <MenuItem value={WorkbookGroupExecution.Sequential}>Sequential</MenuItem>
                    <MenuItem value={WorkbookGroupExecution.Concurrent}>Concurrent</MenuItem>
                </Select>
            </FormControl>

            </Grid>
        </Grid >
    )
}