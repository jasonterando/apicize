import { TextField, Typography, Stack, SxProps, Grid } from '@mui/material'
import { useSelector } from "react-redux";
import { useContext } from 'react'
import { WorkbookState } from '../../../models/store'
import { WorkspaceContext } from '../../../contexts/workspace-context';

export function RequestGroupEditor(props: {
    sx?: SxProps
}) {
    const context = useContext(WorkspaceContext)
    const group = context.group

    const id = useSelector((state: WorkbookState) => state.group.id)
    const name = useSelector((state: WorkbookState) => state.group.name)

    if (!id) return (<></>)

    const updateName = (name: string) => {
        group.setName(id, name)
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
        </Grid >
    )
}