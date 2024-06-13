import { ButtonGroup, FormControl, Grid, InputLabel, MenuItem, Select, ToggleButton } from '@mui/material';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import { useSelector } from 'react-redux';
import { NO_AUTHORIZATION, NO_SCENARIO } from '@apicize/lib-typescript';
import { WorkbookState } from '../../../models/store';
import { Stack, SxProps } from '@mui/system';
import { useContext, useState } from 'react';
import { WorkbookStorageContext } from '../../../contexts/workbook-storage-context';

export function RequestTestContext(props: { sx: SxProps, triggerRun: () => void }) {
    const context = useContext(WorkbookStorageContext)

    const requestId = useSelector((state: WorkbookState) => state.request.id)
    const groupId = useSelector((state: WorkbookState) => state.group.id)
    const executionId = useSelector((state: WorkbookState) => state.execution.id)
    const selectedAuthorizationID = useSelector((state: WorkbookState) => state.execution.selectedAuthorizationID)
    const selectedScenarioID = useSelector((state: WorkbookState) => state.execution.selectedScenarioID)
    const authorizations = useSelector((state: WorkbookState) => state.navigation.authorizationList)
    const scenarios = useSelector((state: WorkbookState) => state.navigation.scenarioList)
    const [disableRun] = useState(false)
    const runIndex = useSelector((state: WorkbookState) => state.execution.runIndex)
    const runList = useSelector((state: WorkbookState) => state.execution.runList)
    const resultIndex = useSelector((state: WorkbookState) => state.execution.resultIndex)
    const resultLists = useSelector((state: WorkbookState) => state.execution.resultLists)

    if (!(requestId || groupId)) {
        return null
    }

    const updateAuthorization = (id: string) => {
        context.execution.setSelectedAuthorization(id)
    }

    const updateScenario = (id: string) => {
        context.execution.setSelectedScenario(id)
    }

    const updateSelectedRun = (index: number) => {
        if (executionId) {
            context.execution.selectExecutionResult(
                executionId,
                index,
                resultIndex)
        }
    }

    const updateSelectedResult = (index: number) => {
        if (executionId) {
            context.execution.selectExecutionResult(
                executionId,
                runIndex,
                index)
        }
    }

    const handleRunClick = () => async () => {
        props.triggerRun()
    }

    return (
        <Stack direction={'row'} sx={props.sx}>
            <ButtonGroup
                sx={{ marginRight: '24px' }}
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
                            value={selectedAuthorizationID}
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
                            value={selectedScenarioID}
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
                    executionId && runList && runList.length > 1
                        ?
                        <Grid item>
                            <FormControl>
                                <InputLabel id='run-id'>Runs</InputLabel>
                                <Select
                                    labelId='run-id'
                                    id='run'
                                    value={runIndex?.toString() ?? ''}
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
                    executionId && runIndex !== undefined && resultLists && resultLists[runIndex] && resultLists[runIndex].length > 1
                        ?
                        <Grid item>
                            <FormControl>
                                <InputLabel id='result-id'>Results</InputLabel>
                                <Select
                                    labelId='results-id'
                                    id='result'
                                    value={resultIndex?.toString() ?? ''}
                                    label='Run'
                                    sx={{ minWidth: '10em' }}
                                    onChange={e => updateSelectedResult(parseInt(e.target.value))}
                                >
                                    <MenuItem key={`result-group`} value={-1}>Group Summary</MenuItem>
                                    {
                                        resultLists[runIndex].map(r => {
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
