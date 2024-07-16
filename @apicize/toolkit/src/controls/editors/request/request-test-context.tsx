import { ButtonGroup, FormControl, Grid, InputLabel, MenuItem, Select, TextField, ToggleButton } from '@mui/material';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import { useSelector } from 'react-redux';
import { NavigationType, WorkbookState } from '../../../models/store';
import { Stack, SxProps } from '@mui/system';
import { useContext, useState } from 'react';
import { WorkspaceContext } from '../../../contexts/workspace-context';

export function RequestTestContext(props: { sx: SxProps, triggerRun: () => void }) {
    const context = useContext(WorkspaceContext)

    const request = useSelector((state: WorkbookState) => state.request)
    const group = useSelector((state: WorkbookState) => state.group)
    const type = useSelector((state: WorkbookState) => state.navigation.activeType)
    const activeExecutionId = useSelector((state: WorkbookState) => state.navigation.activeExecutionID)
    const executionId = useSelector((state: WorkbookState) => state.execution.id)
    const [disableRun] = useState(false)
    const runIndex = useSelector((state: WorkbookState) => state.execution.runIndex)
    const runList = useSelector((state: WorkbookState) => state.execution.runList)
    const resultIndex = useSelector((state: WorkbookState) => state.execution.resultIndex)
    const resultLists = useSelector((state: WorkbookState) => state.execution.resultLists)

    let id: string
    let runs: number
    let isRequest = type === NavigationType.Request

    if (isRequest) {
        if (! (request.id && (request.id?.length ?? 0) > 0)) return null
        id = request.id
        runs = request.runs
    } else {
        if (! (group.id && (group.id?.length ?? 0) > 0)) return null
        id = group.id
        runs = group.runs
    }

    const updateRuns = (runs: number | undefined) => {
        if (isRequest) {
            context.request.setRuns(id, runs || 1)
        } else {
            context.group.setRuns(id, runs || 1)
        }
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
                <TextField
                    aria-label='Nubmer of Run Attempts'
                    placeholder='Attempts'
                    label='# of Runs'
                    sx={{ width: '8em', flexGrow: 0 }}
                    type='number'
                    value={runs}
                    onChange={e => updateRuns(parseInt(e.target.value))}
                />

                </Grid>
                {
                    activeExecutionId === executionId && runList && runList.length > 1
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
                    activeExecutionId === executionId && runIndex !== undefined && resultLists && resultLists[runIndex] && resultLists[runIndex].length > 1
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
