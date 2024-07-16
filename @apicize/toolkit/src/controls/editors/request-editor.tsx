import * as React from 'react'
import { useSelector } from "react-redux";
import { ToggleButtonGroup, ToggleButton, Typography, Box, Stack } from '@mui/material'
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
import { RequestQueryStringEditor } from './request/request-query-string-editor'
import { RequestBodyEditor } from './request/request-body-editor'
import { RequestTestEditor } from './request/request-test-editor'
import { RequestTestContext } from './request/request-test-context'
import { ResultsViewer } from '../viewers/results-viewer'
import { NavigationType, WorkbookState } from '../../models/store'
import { RequestGroupEditor } from './request/request-group-editor';
import { EditorTitle } from '../editor-title';
import { WorkspaceContext } from '../../contexts/workspace-context';
import { useContext } from 'react';
import { RequestParametersEditor } from './request/request-parameters-editor';

export function RequestEditor(props: {
    triggerRun: () => {},
    triggerCancel: () => {},
    triggerCopyTextToClipboard: (text?: string) => void
    triggerCopyImageToClipboard: (base64?: string) => void,
    triggerSetBodyFromFile: () => void,
}) {
    const help = useContext(WorkspaceContext).help
    const activeType = useSelector((state: WorkbookState) => state.navigation.activeType)
    const activeID = useSelector((state: WorkbookState) => state.navigation.activeID)
    const requestName = useSelector((state: WorkbookState) => state.request.name)
    const groupName = useSelector((state: WorkbookState) => state.group.name)

    const [panel, setPanel] = React.useState<string>('Info')

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue) setPanel(newValue)
    }

    React.useEffect(() => {
        if (panel === null) {
            setPanel('Info')
        }
    }, [activeID])

    React.useEffect(() => {
        if (activeType === NavigationType.Request) {
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
                help.setNextHelpTopic(helpTopic)
            }
        }
    }, [panel, activeType])

    if ((activeType !== NavigationType.Request && activeType !== NavigationType.Group) || !activeID) {
        return null
    }

    const isRequest = activeType === NavigationType.Request

    if (! isRequest && (! ['Info', 'Parameters'].includes(panel))) {
        setPanel('Info')
    }

    return (
        <Stack direction='column' className='editor-panel'>
            <Stack sx={{ height: '55vh', paddingBottom: '48px', flexBasis: 2 }}>
                {
                    isRequest
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
                                    <ToggleButton value="Info" title="Show Request Info" aria-label='show info'><DisplaySettingsIcon /></ToggleButton>
                                    <ToggleButton value="Query String" title="Show Request Query String" aria-label='show query string'><ViewListIcon /></ToggleButton>
                                    <ToggleButton value="Headers" title="Show Request Headers" aria-label='show headers'><ViewListOutlinedIcon /></ToggleButton>
                                    <ToggleButton value="Body" title="Show Request Body" aria-label='show body'><ArticleOutlinedIcon /></ToggleButton>
                                    <ToggleButton value="Test" title="Show Request Test" aria-label='show test'><ScienceIcon /></ToggleButton>
                                    <ToggleButton value="Parameters" title="Show Request Parameters" aria-label='show test'><AltRouteIcon /></ToggleButton>
                                </ToggleButtonGroup>
                                <Box className='panels' sx={{ flexGrow: 1 }}>
                                    <EditorTitle icon={<SendIcon />} name={(requestName?.length ?? 0 > 0) ? `${requestName} - ${panel}` : `(Unnamed) - ${panel}`} />
                                    {panel === 'Info' ? <RequestInfoEditor />
                                        : panel === 'Headers' ? <RequestHeadersEditor />
                                            : panel === 'Query String' ? <RequestQueryStringEditor />
                                                : panel === 'Body' ? <RequestBodyEditor triggerSetBodyFromFile={props.triggerSetBodyFromFile} />
                                                    : panel === 'Test' ? <RequestTestEditor />
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
                                    <ToggleButton value="Info" title="Show Group Info" aria-label='show info'><DisplaySettingsIcon /></ToggleButton>
                                    <ToggleButton value="Parameters" title="Show Group Parameters" aria-label='show test'><AltRouteIcon /></ToggleButton>
                                </ToggleButtonGroup>
                                <Box className='panels' sx={{ flexGrow: 1 }}>
                                    <EditorTitle icon={<FolderIcon />} name={groupName?.length ?? 0 > 0 ? `${groupName} - ${panel}` : '(Unnamed)'} />
                                    {panel === 'Info' ? <RequestGroupEditor />
                                        : panel === 'Parameters' ? <RequestParametersEditor />
                                            : null}
                                </Box>
                            </Box>
                        )
                }
                <RequestTestContext sx={{ flexGrow: 0, marginTop: '48px' }} triggerRun={props.triggerRun} />
            </Stack>
            <ResultsViewer
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    boxSizing: 'border-box',
                    position: 'relative',
                    height: '45vh',
                    flexGrow: 1,
                    flexShrink: 0,
                    bottom: 0,
                }}
                triggerCopyTextToClipboard={props.triggerCopyTextToClipboard}
                triggerCopyImageToClipboard={props.triggerCopyImageToClipboard}
                cancelRequest={props.triggerCancel} />
        </Stack>
    )
}
