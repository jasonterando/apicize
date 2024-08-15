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
import { useNavigationState } from '../../contexts/navigation-state-context';
import { useHelp } from '../../contexts/help-context';
import { useRequestEditor } from '../../contexts/editors/request-editor-context';
import { useExecution } from '../../contexts/execution-context';

export function RequestEditor(props: {
    sx: SxProps,
    triggerRun: () => {},
    triggerCancel: () => {},
    triggerCopyTextToClipboard: (text?: string) => void
    triggerCopyImageToClipboard: (base64?: string) => void,
    triggerOpenFile: (destination: ContentDestination, id: string) => {},
    triggerPasteFromClipboard: (destination: ContentDestination, id: string) => {}
}) {
    useNavigationState()
    const requestCtx = useRequestEditor()

    const helpCtx = useHelp()
    const execution = useExecution()

    const info = execution.getExecutionInfo(requestCtx.id)

    const [running, setRunning] = React.useState(false)
    const [runs, setRuns] = React.useState(requestCtx.runs)
    const [runIndex, setRunIndex] = React.useState(info?.runIndex)
    const [runList, setRunList] = React.useState(info?.runList)
    const [resultIndex, setResultIndex] = React.useState(info?.resultIndex)
    const [resultLists, setResultLists] = React.useState(info?.resultLists)


    const [panel, setPanel] = React.useState<string>('Info')

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue) setPanel(newValue)
    }

    React.useEffect(() => {
        if (panel === null) {
            setPanel('Info')
        }
    }, [requestCtx.id])

    React.useEffect(() => {
        if (requestCtx.isGroup) {
            helpCtx.changeNextHelpTopic('groups')
        } else {
            let helpTopic
            switch (panel) {
                case 'Info':
                    helpTopic = 'requests/info'
                    break
                case 'Query String':
                    helpTopic = 'requests/query'
                    break
                case 'Headers':
                    helpTopic = 'requests/headers'
                    break
                case 'Body':
                    helpTopic = 'requests/body'
                    break
                case 'Test':
                    helpTopic = 'requests/test'
                    break
            }
            if (helpTopic) {
                helpCtx.changeNextHelpTopic(helpTopic)
            }
        }
    }, [panel, requestCtx.id])

    React.useEffect(() => {
        const isRunning = execution.running.get(requestCtx.id) ?? false
        setRunning(isRunning === true)
        if (!isRunning) {
            const info = execution.getExecutionInfo(requestCtx.id)
            if (info) {
                setRunIndex(info.runIndex)
                setRunList(info.runList)
                setResultIndex(info.resultIndex)
                setResultLists(info.resultLists)
            }
        }
    }, [execution.running])

    React.useEffect(() => {
        setRuns(requestCtx.runs)
    }, [requestCtx.runs])


    if (requestCtx.id.length === 0) {
        return null
    }

    if (requestCtx.isGroup && (!['Info', 'Parameters'].includes(panel))) {
        setPanel('Info')
    }

    const updateRuns = (runs: number) => {
        requestCtx.changeRuns(runs)
    }

    const updateSelectedRun = (index: number) => {
        setRunIndex(index)
        execution.changeRunIndex(requestCtx.id, index)
    }

    const updateSelectedResult = (index: number) => {
        setResultIndex(index)
        execution.changeResultIndex(requestCtx.id, index)
    }

    const handleRunClick = () => async () => {
        props.triggerRun()
    }

    return (
        <Stack direction='column' className='editor-panel' sx={{ ...props.sx, display: 'flex' }}>
            <Stack sx={{ height: '50vh', paddingBottom: '48px', flexBasis: 2 }}>
                {
                    requestCtx.isGroup
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
                                    <EditorTitle icon={<FolderIcon />} name={requestCtx.name.length ?? 0 > 0 ? `${requestCtx.name} - ${panel}` : '(Unnamed)'} />
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
                                    <EditorTitle icon={<SendIcon />} name={(requestCtx.name.length > 0) ? `${requestCtx.name} - ${panel}` : `(Unnamed) - ${panel}`} />
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
                    <ToggleButton value='Run' title='Run selected request' disabled={running} onClick={handleRunClick()}>
                        <PlayCircleFilledIcon />
                    </ToggleButton>
                </ButtonGroup>

                <Grid container direction={'row'} spacing={3}>
                    <Grid item>
                        <TextField
                            aria-label='Nubmer of Run Attempts'
                            placeholder='Attempts'
                            label='# of Runs'
                            disabled={running}
                            sx={{ width: '8em', flexGrow: 0 }}
                            type='number'
                            InputProps={{
                                inputProps: {
                                    min: 1, max: 1000
                                }
                            }}

                            value={runs}
                            onChange={e => updateRuns(parseInt(e.target.value))}
                        />
                    </Grid>
                    {
                        (runIndex !== undefined && runList && (runList?.length ?? 0) > 1)
                            ? <Grid item>
                                <FormControl>
                                    <InputLabel id='run-id'>Runs</InputLabel>
                                    <Select
                                        labelId='run-id'
                                        id='run'
                                        value={runIndex.toString()}
                                        disabled={running}
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
                        (resultIndex !== undefined && runIndex !== undefined
                            && resultLists && ((resultLists[runIndex]?.length ?? 0) > 1))
                            ? <Grid item>
                                <FormControl>
                                    <InputLabel id='result-id'>Results</InputLabel>
                                    <Select
                                        labelId='results-id'
                                        id='result'
                                        value={resultIndex?.toString() ?? ''}
                                        disabled={running}
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
            {
                info && runIndex !== undefined && resultIndex !== undefined
                    ? <ResultsViewer
                        sx={{ paddingTop: '48px', flexGrow: 1 }}
                        requestOrGroupId={requestCtx.id}
                        isGroup={requestCtx.url === undefined}
                        runIndex={runIndex}
                        resultIndex={resultIndex}
                        triggerCopyTextToClipboard={props.triggerCopyTextToClipboard}
                        triggerCopyImageToClipboard={props.triggerCopyTextToClipboard}
                        cancelRequest={props.triggerCancel}
                    />
                    : <></>
            }
        </Stack>
    )
}
