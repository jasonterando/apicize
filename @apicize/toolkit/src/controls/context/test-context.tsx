import { Box, ButtonGroup, FormControl, Grid, InputLabel, MenuItem, Select, ToggleButton } from '@mui/material';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, setSelectedAuthorization } from '../../models/store';
import './test-context.css'

export function TestContext() {
    const dispatch = useDispatch()
    const selectedAuthorization = useSelector((state: RootState) => state.selectedAuthorization)
    const authorizations = useSelector((state: RootState) => state.authorizations)
    const activeTest = useSelector((state: RootState) => state.activeTest)

    const updateAuthorization = (id: string) => {
        dispatch(setSelectedAuthorization({
            id
        }))
    }

    return (
        <Box className='test-context'>
            <ButtonGroup
                className='button-column'
                orientation='vertical'>
                <ToggleButton value='Run' disabled={activeTest === undefined}>
                    <PlayCircleFilledIcon />
                </ToggleButton>
            </ButtonGroup>

            <Grid container direction={'column'} spacing={3} maxWidth={1000}>
                <Grid item>
                    <FormControl>
                        <InputLabel id='auth-label-id'>Authorization</InputLabel>
                        <Select
                            labelId='request-label-id'
                            id='authorization'
                            value={selectedAuthorization.id}
                            label='Authorization'
                            onChange={e => updateAuthorization(e.target.value)}
                        >
                            {
                                authorizations.map(a => {
                                    return (
                                        <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)
                                })
                            }
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
        </Box>
    )
}

