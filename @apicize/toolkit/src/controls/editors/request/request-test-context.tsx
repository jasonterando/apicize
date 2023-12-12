import { ButtonGroup, FormControl, Grid, InputLabel, MenuItem, Select, ToggleButton } from '@mui/material';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import { useDispatch, useSelector } from 'react-redux';
import { NO_AUTHORIZATION, NO_ENVIRONMENT, RunRequestsFunction } from '@apicize/definitions';
import { RootState, setSelectedAuthorization, setRequestRunning, setRequestResults, setSelectedEnvironment } from '../../../models/store';
import '../../styles.css'
import { Stack } from '@mui/system';
import { useEffect, useState } from 'react';
import { useToast } from '../../../services/toast-service';
import { ToastSeverity } from '../../toast';

export function RequestTestContext(props: { runRequests: RunRequestsFunction }) {
    const dispatch = useDispatch()
    const toast = useToast()

    const request = useSelector((state: RootState) => state.activeRequest)
    const selectedAuthorization = useSelector((state: RootState) => state.selectedAuthorization)
    const selectedEnvironment = useSelector((state: RootState) => state.selectedEnvironment)
    const authorizations = useSelector((state: RootState) => state.authorizationList)
    const environments = useSelector((state: RootState) => state.environmentList)
    const [disableRun, setDisableRun] = useState(false)

    useEffect(() => {
        setDisableRun(request?.running ?? false)
    }, [request])

    if (!request) {
        return null
    }

    const updateAuthorization = (id: string) => {
        dispatch(setSelectedAuthorization(id))
    }

    const updateEnvironment = (id: string) => {
        dispatch(setSelectedEnvironment(id))
    }

    const handleRunClick = () => async () => {
        dispatch(setRequestRunning({ id: request.id, onOff: true }))
        try {
            const results = await props.runRequests([request], selectedAuthorization, selectedEnvironment)
            dispatch(setRequestResults(results))
        } catch (e) {
            dispatch(setRequestRunning({ id: request.id, onOff: false }))
            await toast({
                message: `${e}`,
                severity: ToastSeverity.Error
            })
        }
    }

    return (
        <Stack direction={'row'} className='section'>
            <ButtonGroup
                className='button-column'
                orientation='vertical'
                aria-label="request run context">
                <ToggleButton value='Run' title='Run selected request' disabled={disableRun} onClick={handleRunClick()}>
                    <PlayCircleFilledIcon />
                </ToggleButton>
            </ButtonGroup>

            <Grid container direction={'row'} spacing={3}>
                <Grid item>
                    <FormControl>
                        <InputLabel id='auth-label-id'>Authorization</InputLabel>
                        <Select
                            labelId='auth-label-id'
                            id='authorization'
                            value={selectedAuthorization.id}
                            label='Authorization'
                            sx={{minWidth: '10em'}}
                            onChange={e => updateAuthorization(e.target.value)}
                        >
                            <MenuItem key='no-auth' value={NO_AUTHORIZATION}>(No Authorization)</MenuItem>
                            {
                                authorizations.map(a => {
                                    return (
                                        <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)
                                })
                            }
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item>
                    <FormControl>
                        <InputLabel id='env-label-id'>Environment</InputLabel>
                        <Select
                            labelId='env-label-id'
                            id='environment'
                            value={selectedEnvironment.id}
                            label='Environment'
                            sx={{minWidth: '10em'}}
                            onChange={e => updateEnvironment(e.target.value)}
                        >
                            <MenuItem key='no-env' value={NO_ENVIRONMENT}>(No Environment)</MenuItem>
                            {
                                environments.map(a => {
                                    return (
                                        <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)
                                })
                            }
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
        </Stack>
    )
}
