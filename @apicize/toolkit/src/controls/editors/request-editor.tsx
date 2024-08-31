import * as React from 'react'
import { ToggleButtonGroup, ToggleButton, Box, Stack, SxProps, ButtonGroup, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings'
import FolderIcon from '@mui/icons-material/Folder';
import ViewListIcon from '@mui/icons-material/ViewList'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import AltRouteIcon from '@mui/icons-material/AltRoute'
import { RequestInfoEditor } from './request/request-info-editor'
import { RequestHeadersEditor } from './request/request-headers-editor'
import SendIcon from '@mui/icons-material/Send';
import ScienceIcon from '@mui/icons-material/Science';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled'
import { RequestQueryStringEditor } from './request/request-query-string-editor'
import { RequestBodyEditor } from './request/request-body-editor'
import { RequestTestEditor } from './request/request-test-editor'
import { ResultsViewer } from '../viewers/results-viewer'
import { ContentDestination } from '../../models/store'
import { RequestGroupEditor } from './request/request-group-editor';
import { EditorTitle } from '../editor-title';
import { RequestParametersEditor } from './request/request-parameters-editor';
import { useExecution, useWorkspace } from '../../contexts/root.context';
import { WorkbookRequestType } from '@apicize/lib-typescript';
import { observer } from 'mobx-react-lite';
import { EditableEntityType } from '../../models/workbook/editable-entity-type';
import { EditableWorkbookRequestEntry } from '../../models/workbook/editable-workbook-request';
import { RunInformation } from '../../models/workbook/run-information';
import { WorkbookExecutionResultMenuItem, WorkbookExecutionRunMenuItem } from '../../models/workbook/workbook-execution';

export const RequestEditor = observer((props: {
    sx: SxProps,
    triggerRun: (info: RunInformation) => {},
    triggerCancel: () => {},
    triggerCopyTextToClipboard: (text?: string) => void
    triggerCopyImageToClipboard: (base64?: string) => void,
    triggerOpenFile: (destination: ContentDestination, id: string) => {},
    triggerPasteFromClipboard: (destination: ContentDestination, id: string) => {}
}) => {
    const [panel, setPanel] = React.useState<string>('Info')

    const workspace = useWorkspace()
    const request = (workspace.active?.entityType === EditableEntityType.Request && !workspace.helpVisible)
        ? workspace.active as EditableWorkbookRequestEntry
        : null

    const executionCtx = useExecution()

    const requestId = request?.id ?? ''
    const execution = executionCtx.getExecution(requestId)

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue) setPanel(newValue)
    }

    // React.useEffect(() => {
    //     if (panel === null) {
    //         setPanel('Info')
    //     }
    // }, [])

    // React.useEffect(() => {
    //     if (request) {
    //         if (request.type === WorkbookRequestType.Group) {
    //             helpCtx.changeNextHelpTopic('groups')
    //         } else {
    //             let helpTopic
    //             switch (panel) {
    //                 case 'Info':
    //                     helpTopic = 'requests/info'
    //                     break
    //                 case 'Query String':
    //                     helpTopic = 'requests/query'
    //                     break
    //                 case 'Headers':
    //                     helpTopic = 'requests/headers'
    //                     break
    //                 case 'Body':
    //                     helpTopic = 'requests/body'
    //                     break
    //                 case 'Test':
    //                     helpTopic = 'requests/test'
    //                     break
    //             }
    //             if (helpTopic) {
    //                 helpCtx.changeNextHelpTopic(helpTopic)
    //             }
    //         }
    //     }
    // }, [panel])

    // React.useEffect(() => {
    //     if (request) {
    //         const isRunning = execution.running.get(request.id) ?? false
    //         setRunning(isRunning === true)
    //         if (!isRunning) {
    //             const info = execution.getExecutionInfo(request.id)
    //             if (info) {
    //                 setRunIndex(info.runIndex)
    //                 setRunList(info.runList)
    //                 setResultIndex(info.resultIndex)
    //                 setResultLists(info.resultLists)
    //             }
    //         }
    //     }
    // }, [execution.running])

    // React.useEffect(() => {
    //     if (request) setRuns(request.runs)
    // }, [])

    if (request && request.type === WorkbookRequestType.Group && (!['Info', 'Parameters'].includes(panel))) {
        setPanel('Info')
    }

    const updateRuns = (runs: number) => {
        workspace.setRequestRuns(runs)
    }

    const updateSelectedRun = (index: number) => {
        executionCtx.changeRunIndex(requestId, index)
    }

    const updateSelectedResult = (index: number) => {
        executionCtx.changeResultIndex(requestId, index)
    }

    const handleRunClick = () => async () => {
        const runInfo = workspace.getRequestRunInformation()
        if (!runInfo) return
        props.triggerRun(runInfo)
    }

    let runsToShow: WorkbookExecutionRunMenuItem[] | null = null
    let resultsToShow: WorkbookExecutionResultMenuItem[] | null = null
    let runIndex = -1
    let resultIndex = -1

    if (execution.runIndex !== undefined && execution.runs !== undefined) {
        if (execution.runs.length > 1) {
            runIndex = execution.runIndex
            runsToShow = execution.runs
        }
        const run = execution.runs[execution.runIndex]
        if (execution.resultIndex !== undefined && run?.results && (run.results.length ?? 0) > 1) {
            resultsToShow = run.results
            resultIndex = execution.resultIndex
        }
    }

    return request ? (
        <Stack direction='column' className='editor-panel' sx={{ ...props.sx, display: 'flex' }}>
            <Stack sx={{ height: '50vh', paddingBottom: '48px', flexBasis: 2 }}>
                {
                    request.type === WorkbookRequestType.Group
                        ? (
                            <Box sx={{ display: "flex", bottom: 0 }}>
                                <ToggleButtonGroup
                                    className='button-column'
                                    orientation='vertical'
                                    exclusive
                                    onChange={handlePanelChanged}
                                    value={panel}
                                    sx={{ marginRight: '24px' }}
                                    aria-label="text alignment">
                                    <ToggleButton value="Info" title="Show Group Info" aria-label='show info'><DisplaySettingsIcon /></ToggleButton>
                                    <ToggleButton value="Parameters" title="Show Group Parameters" aria-label='show test'><AltRouteIcon /></ToggleButton>
                                </ToggleButtonGroup>
                                <Box className='panels' sx={{ flexGrow: 1 }}>
                                    <EditorTitle icon={<FolderIcon />} name={request.name.length ?? 0 > 0 ? `${request.name} - ${panel}` : '(Unnamed)'} />
                                    {panel === 'Info' ? <RequestGroupEditor />
                                        : panel === 'Parameters' ? <RequestParametersEditor />
                                            : null}
                                </Box>
                            </Box>
                        )
                        : (
                            <Box sx={{ display: "flex", bottom: 0 }}>
                                <ToggleButtonGroup
                                    className='button-column'
                                    orientation='vertical'
                                    exclusive
                                    onChange={handlePanelChanged}
                                    value={panel}
                                    sx={{ marginRight: '24px' }}
                                    aria-label="text alignment">
                                    <ToggleButton value="Info" title="Show Request Info" aria-label='show info'><DisplaySettingsIcon /></ToggleButton>
                                    <ToggleButton value="Query String" title="Show Request Query String" aria-label='show query string'><ViewListIcon /></ToggleButton>
                                    <ToggleButton value="Headers" title="Show Request Headers" aria-label='show headers'><ViewListOutlinedIcon /></ToggleButton>
                                    <ToggleButton value="Body" title="Show Request Body" aria-label='show body'><ArticleOutlinedIcon /></ToggleButton>
                                    <ToggleButton value="Test" title="Show Request Test" aria-label='show test'><ScienceIcon /></ToggleButton>
                                    <ToggleButton value="Parameters" title="Show Request Parameters" aria-label='show test'><AltRouteIcon /></ToggleButton>
                                </ToggleButtonGroup>
                                <Box className='panels' sx={{ flexGrow: 1 }}>
                                    <EditorTitle icon={<SendIcon />} name={(request.name.length > 0) ? `${request.name} - ${panel}` : `(Unnamed) - ${panel}`} />
                                    {panel === 'Info' ? <RequestInfoEditor />
                                        : panel === 'Headers' ? <RequestHeadersEditor />
                                            : panel === 'Query String' ? <RequestQueryStringEditor />
                                                : panel === 'Body' ? <RequestBodyEditor triggerOpenFile={props.triggerOpenFile} triggerPasteFromClipboard={props.triggerPasteFromClipboard} />
                                                    : panel === 'Test' ? <RequestTestEditor />
                                                        : panel === 'Parameters' ? <RequestParametersEditor />
                                                            : null}
                                </Box>
                            </Box>
                        )
                }
            </Stack>
            <Stack direction={'row'} sx={{ flexGrow: 0 }}>
                <ButtonGroup
                    sx={{ marginRight: '24px' }}
                    orientation='vertical'
                    aria-label="request run context">
                    <ToggleButton value='Run' title='Run selected request' disabled={execution.running} onClick={handleRunClick()}>
                        <PlayCircleFilledIcon />
                    </ToggleButton>
                </ButtonGroup>

                <Grid container direction={'row'} spacing={3}>
                    <Grid item>
                        <TextField
                            aria-label='Nubmer of Run Attempts'
                            placeholder='Attempts'
                            label='# of Runs'
                            disabled={execution.running}
                            sx={{ width: '8em', flexGrow: 0 }}
                            type='number'
                            InputProps={{
                                inputProps: {
                                    min: 1, max: 1000
                                }
                            }}

                            value={request.runs}
                            onChange={e => updateRuns(parseInt(e.target.value))}
                        />
                    </Grid>
                    {
                        (runsToShow)
                            ? <Grid item>
                                <FormControl>
                                    <InputLabel id='run-id'>Runs</InputLabel>
                                    <Select
                                        labelId='run-id'
                                        id='run'
                                        disabled={execution.running}
                                        label='Run'
                                        sx={{ minWidth: '10em' }}
                                        value={runIndex?.toString() ?? ''}
                                        onChange={e => updateSelectedRun(parseInt(e.target.value))}
                                    >
                                        {
                                            runsToShow.map((run, index) =>
                                            (
                                                <MenuItem key={`run-${index}`} value={index}>{run.title}</MenuItem>)
                                            )
                                        }
                                    </Select>
                                </FormControl>
                            </Grid>
                            : <></>
                    }
                    {
                        (resultsToShow)
                            ? <Grid item>
                                <FormControl>
                                    <InputLabel id='result-id'>Results</InputLabel>
                                    <Select
                                        labelId='results-id'
                                        id='result'
                                        value={resultIndex ?? 0}
                                        disabled={execution.running}
                                        label='Run'
                                        sx={{ minWidth: '10em' }}
                                        onChange={e => updateSelectedResult(e.target.value as number)}
                                    >
                                        {
                                            resultsToShow.map((run, index) => (
                                                <MenuItem key={`result-${index}`} value={run.index}>{run.title}</MenuItem>
                                            ))
                                        }
                                    </Select>
                                </FormControl>
                            </Grid>
                            : <></>
                    }
                </Grid>
            </Stack>
            <ResultsViewer
                sx={{ paddingTop: '48px', flexGrow: 1 }}
                requestOrGroupId={request.id}
                isGroup={request.type === WorkbookRequestType.Group}
                triggerCopyTextToClipboard={props.triggerCopyTextToClipboard}
                triggerCopyImageToClipboard={props.triggerCopyTextToClipboard}
                cancelRequest={props.triggerCancel}
            />
        </Stack>
    ) : null
})
