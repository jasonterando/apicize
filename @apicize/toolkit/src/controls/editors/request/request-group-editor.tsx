import { TextField, Box, Grid, Typography, Stack, SxProps, FormControl } from '@mui/material'
import FolderIcon from '@mui/icons-material/Folder';
import { useSelector } from "react-redux";
import { useEffect, useState } from 'react'
import { WorkbookState, updateRequestGroup } from '../../../models/store'
import { useDispatch } from 'react-redux'

import '../../styles.css'
import { castEntryAsGroup } from '../../../models/workbook/helpers/editable-workbook-request-helpers';

export function RequestGroupEditor(props: {
    sx?: SxProps
}) {
    const group = useSelector((state: WorkbookState) => state.activeRequestEntry)
    const dispatch = useDispatch()

    const [name, setName] = useState<string>('')
    const [runs, setRuns] = useState(1)

    useEffect(() => {
        setName(group?.name ?? '')
        setRuns(castEntryAsGroup(group)?.runs ?? 1)
    }, [group])

    if (!group) return (<></>)

    const updateName = (name: string | undefined) => {
        setName(name ?? '')
        dispatch(updateRequestGroup({
            id: group.id,
            name
        }))
    }

    const updateRuns = (runs: number | undefined) => {
        setRuns(runs ?? 1)
        dispatch(updateRequestGroup({
            id: group.id,
            runs
        }))
    }

    return (
        <Stack direction='column' className='no-button-column' sx={props.sx}>
            <Typography variant='h1'><FolderIcon /> {name?.length ?? 0 > 0 ? name : '(Unnamed)'}</Typography>
            <Stack direction='row' spacing={3} maxWidth={1000}>
                <TextField
                    id='group-name'
                    label='Name'
                    aria-label='name'
                    
                    // size='small'
                    value={name}
                    onChange={e => updateName(e.target.value)}
                    fullWidth
                />
                <FormControl>
                    <TextField
                        aria-label='Numer of Run Attempts'
                        placeholder='Attempts'
                        label='Numer of Run Attempts'
                        sx={{ marginLeft: '24px', width: '8em' }}
                        type='number'
                        value={runs}
                        onChange={e => updateRuns(parseInt(e.target.value))}
                    />
                </FormControl>
            </Stack>
        </Stack>
    )
}