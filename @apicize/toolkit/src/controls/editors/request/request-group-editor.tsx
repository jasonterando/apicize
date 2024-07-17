import { TextField, Typography, Stack, SxProps, Grid, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { useSelector } from "react-redux";
import { useContext } from 'react'
import { WorkbookState } from '../../../models/store'
import { WorkspaceContext } from '../../../contexts/workspace-context';
import { WorkbookGroupExecution } from '@apicize/lib-typescript';

export function RequestGroupEditor(props: {
    sx?: SxProps
}) {
    const context = useContext(WorkspaceContext)
    const group = context.group

    const id = useSelector((state: WorkbookState) => state.group.id)
    const name = useSelector((state: WorkbookState) => state.group.name)
    const execution = useSelector((state: WorkbookState) => state.group.execution)

    if (!id) return (<></>)

    const updateName = (name: string) => {
        group.setName(id, name)
    }

    const updateExecution = (execution: string) => {
        group.setExecution(id, execution as WorkbookGroupExecution)
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
                    value={name}
                    onChange={e => updateName(e.target.value)}
                />
            </Grid>
            <Grid item>
            <FormControl>
                <InputLabel id='execution-id'>Execution Mode</InputLabel>
                <Select
                    labelId='execution-id'
                    id='execution'
                    value={execution}
                    label='Type'
                    onChange={e => updateExecution(e.target.value)}
                >
                    <MenuItem value={WorkbookGroupExecution.Sequential}>Sequential</MenuItem>
                    <MenuItem value={WorkbookGroupExecution.Concurrent}>Concurrent</MenuItem>
                </Select>
            </FormControl>

            </Grid>
        </Grid >
    )
}