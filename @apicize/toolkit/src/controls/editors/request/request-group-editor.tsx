import { TextField, Typography, Stack, SxProps } from '@mui/material'
import FolderIcon from '@mui/icons-material/Folder';
import { useSelector } from "react-redux";
import { useContext } from 'react'
import { WorkbookState } from '../../../models/store'
import { WorkbookStorageContext } from '../../../contexts/workbook-storage-context';

export function RequestGroupEditor(props: {
    sx?: SxProps
}) {
    const group = useContext(WorkbookStorageContext).group

    const id = useSelector((state: WorkbookState) => state.group.id)
    const name = useSelector((state: WorkbookState) => state.group.name)
    const runs = useSelector((state: WorkbookState) => state.group.runs)

    if (!id) return (<></>)

    const updateName = (name: string) => {
        group.setName(id, name)
    }

    const updateRuns = (runs: number | undefined) => {
        group.setRuns(id, runs || 1)
    }

    return (
        <Stack direction='column' className='no-button-column' sx={props.sx}>
            <Typography variant='h1'><FolderIcon /> {name?.length ?? 0 > 0 ? name : '(Unnamed)'}</Typography>
            <Stack direction='row' display='flex' spacing={3} maxWidth={1000}>
                <TextField
                    id='group-name'
                    label='Name'
                    aria-label='name'
                    sx={{flexGrow: 1}}
                    // size='small'
                    value={name}
                    onChange={e => updateName(e.target.value)}
                    
                />
                <TextField
                    aria-label='Nubmer of Run Attempts'
                    placeholder='Attempts'
                    label='# of Runs'
                    sx={{ marginLeft: '24px', width: '8em', flexGrow: 0 }}
                    type='number'
                    value={runs}
                    onChange={e => updateRuns(parseInt(e.target.value))}
                />
            </Stack>
        </Stack>
    )
}