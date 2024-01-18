import { ButtonGroup, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, ToggleButton } from '@mui/material';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import { useDispatch, useSelector } from 'react-redux';
import { NO_AUTHORIZATION, NO_ENVIRONMENT } from '@apicize/common';
import { WorkbookState, setSelectedAuthorization, setRequestRunning, setRequestResults, setSelectedEnvironment, setSelectedExecutionResult } from '../../../models/store';
import '../../styles.css'
import { Stack, SxProps } from '@mui/system';
import { useEffect, useState } from 'react';
import { isGroup } from '../../../models/state-storage';

export function RequestTestContext(props: { sx: SxProps, triggerRun: () => void }) {
    const dispatch = useDispatch()

    const request = useSelector((state: WorkbookState) => state.activeRequest)
    const group = useSelector((state: WorkbookState) => state.activeRequestGroup)
    const execution = useSelector((state: WorkbookState) => state.activeExecution)
    const result = useSelector((state: WorkbookState) => state.selectedExecutionResult)
    const selectedAuthorization = useSelector((state: WorkbookState) => state.selectedAuthorization)
    const selectedEnvironment = useSelector((state: WorkbookState) => state.selectedEnvironment)
    const authorizations = useSelector((state: WorkbookState) => state.authorizationList)
    const environments = useSelector((state: WorkbookState) => state.environmentList)
    const [disableRun, setDisableRun] = useState(false)

    useEffect(() => {
        setDisableRun((execution?.requestID === request?.id && execution?.running) ?? false)
    }, [request, execution])

    if (!(request || group)) {
        return null
    }

    const updateAuthorization = (id: string) => {
        dispatch(setSelectedAuthorization(id))
    }

    const updateEnvironment = (id: string) => {
        dispatch(setSelectedEnvironment(id))
    }

    const updateSelectedResult = (key: string) => {
        dispatch(setSelectedExecutionResult(key))
    }

    const handleRunClick = () => async () => {
        props.triggerRun()
    }

    return (
        <Stack direction={'row'} className='section' sx={props.sx}>
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
                            sx={{ minWidth: '10em' }}
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
                            sx={{ minWidth: '10em' }}
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
                {
                    ((execution?.results?.length ?? 0) > (group ? 0 : 1))
                        ?
                        <Grid item>
                            <FormControl>
                                <InputLabel id='env-result-id'>Results</InputLabel>
                                <Select
                                    labelId='env-result-id'
                                    id='result'
                                    value={result?.key ?? ''}
                                    label='Result'
                                    sx={{ minWidth: '10em' }}
                                    onChange={e => updateSelectedResult(e.target.value)}
                                >
                                    {
                                        (execution?.results ?? []).map(a => {
                                            return (
                                                <MenuItem key={a.key} value={a.key}>{a.name}</MenuItem>)
                                        })
                                    }
                                </Select>
                            </FormControl>
                        </Grid>
                        : <></>
                }


            </Grid>
        </Stack>
    )
}
