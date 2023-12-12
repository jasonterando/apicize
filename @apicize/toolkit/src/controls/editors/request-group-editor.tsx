import { TextField, Box, Grid, Typography, Stack } from '@mui/material'
import FolderIcon from '@mui/icons-material/Folder';
import { useSelector } from "react-redux";
import { useState } from 'react'
import { RootState, updateRequestGroup } from '../../models/store'
import { useDispatch } from 'react-redux'

import '../styles.css'

export function RequestGroupEditor() {
    const groupID = useSelector((state: RootState) => state.activeRequestGroup?.id)
    const dispatch = useDispatch()

    const [name, setName] = useState<string>('')

    if(! groupID) return (<></>)

    // useEffect((state) => {
    //     const group = state.
    //     setName(group?.name ?? '')
    // }, [groupID])

    // if (!group) {
    //     return null
    // }

    const updateName = (name: string | undefined) => {
        setName(name ?? '')
        dispatch(updateRequestGroup({
            id: groupID,
            name
        }))
    }

    return (
        <Stack direction={'column'} className='section no-button-column' sx={{ flexGrow: 1 }}>
            <Typography variant='h1'><FolderIcon /> {name?.length ?? 0 > 0 ? name : '(Unnamed)'}</Typography>
            <Box className='section'>
                <Grid container direction={'column'} spacing={3} maxWidth={1000}>
                    <Grid item>
                        <TextField
                            id='gorup-name'
                            label='Name'
                            aria-label='name'
                            // size='small'
                            value={name}
                            onChange={e => updateName(e.target.value)}
                            fullWidth
                        />
                    </Grid>
                </Grid>
            </Box>
        </Stack>
    )
}