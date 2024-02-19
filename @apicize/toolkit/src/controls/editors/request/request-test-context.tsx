import { ButtonGroup, FormControl, Grid, InputLabel, MenuItem, Select, ToggleButton } from '@mui/material';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import { useDispatch, useSelector } from 'react-redux';
import { GetTitle, NO_AUTHORIZATION, NO_SCENARIO } from '@apicize/lib-typescript';
import { WorkbookState, setSelectedAuthorization, setSelectedExecutionResult, setSelectedScenario } from '../../../models/store';
import { Stack, SxProps } from '@mui/system';
import { useEffect, useState } from 'react';
import { castEntryAsGroup } from '../../../models/workbook/helpers/editable-workbook-request-helpers';

export function RequestTestContext(props: { sx: SxProps, triggerRun: () => void }) {
    const dispatch = useDispatch()

    const requestEntry = useSelector((state: WorkbookState) => state.activeRequestEntry)
    const execution = useSelector((state: WorkbookState) => state.activeExecution)
    const selectedAuthorization = useSelector((state: WorkbookState) => state.selectedAuthorization)
    const selectedScenario = useSelector((state: WorkbookState) => state.selectedScenario)
    const authorizations = useSelector((state: WorkbookState) => state.authorizationList)
    const scenarios = useSelector((state: WorkbookState) => state.scenarioList)
    const [disableRun, setDisableRun] = useState(false)
    const [runList, setRunList] = useState(execution?.runList)
    const [resultsLists, setResultsLists] = useState(execution?.resultLists)

    useEffect(() => {
        setDisableRun((execution?.requestID === requestEntry?.id && execution?.running) ?? false)
    }, [requestEntry])

    useEffect(() => {
        setRunList(execution?.runList)
        setResultsLists(execution?.resultLists)
    }, [execution])

    if (! requestEntry) {
        return null
    }

    const updateAuthorization = (id: string) => {
        dispatch(setSelectedAuthorization(id))
    }

    const updateScenario = (id: string) => {
        dispatch(setSelectedScenario(id))
    }

    const updateSelectedRun = (index: number) => {
        dispatch(setSelectedExecutionResult({
            runIndex: index,
            resultIndex: execution?.resultIndex
        }))
    }

    const updateSelectedResult = (index: number) => {
        dispatch(setSelectedExecutionResult({
            runIndex: execution?.runIndex,
            resultIndex: index
        }))
    }

    const handleRunClick = () => async () => {
        props.triggerRun()
    }

    return (
        <Stack direction={'row'} sx={props.sx}>
            <ButtonGroup
                sx={{marginRight: '24px'}}
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
                        <InputLabel id='scenario-label-id'>Scenario</InputLabel>
                        <Select
                            labelId='scenario-label-id'
                            id='scenario'
                            value={selectedScenario.id}
                            label='Scenario'
                            sx={{ minWidth: '10em' }}
                            onChange={e => updateScenario(e.target.value)}
                        >
                            <MenuItem key='no-scenario' value={NO_SCENARIO}>(No Scenario)</MenuItem>
                            {
                                scenarios.map(a => {
                                    return (
                                        <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)
                                })
                            }
                        </Select>
                    </FormControl>
                </Grid>
                {
                    runList
                    && runList.length > 1
                        ?
                        <Grid item>
                            <FormControl>
                                <InputLabel id='run-id'>Runs</InputLabel>
                                <Select
                                    labelId='run-id'
                                    id='run'
                                    value={execution?.runIndex?.toString() ?? ''}
                                    label='Run'
                                    sx={{ minWidth: '10em' }}
                                    onChange={e => updateSelectedRun(parseInt(e.target.value))}
                                >
                                    {
                                        runList.map(r => {
                                            return (
                                                <MenuItem key={`run-${r.index}`} value={r.index}>{r.text}</MenuItem>)
                                        })
                                    }
                                </Select>
                            </FormControl>
                        </Grid>
                        : <></>
                }
                {
                    execution 
                    && execution.runIndex !== undefined 
                    && resultsLists
                    && resultsLists[execution.runIndex]
                    && resultsLists[execution.runIndex].length > 1
                    ?
                        <Grid item>
                            <FormControl>
                                <InputLabel id='result-id'>Results</InputLabel>
                                <Select
                                    labelId='results-id'
                                    id='result'
                                    value={execution.resultIndex?.toString() ?? ''}
                                    label='Run'
                                    sx={{ minWidth: '10em' }}
                                    onChange={e => updateSelectedResult(parseInt(e.target.value))}
                                >
                                    {
                                        resultsLists[execution.runIndex].map(r => {
                                            return (
                                                <MenuItem key={`result-${r.index}`} value={r.index}>{r.text}</MenuItem>)
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
