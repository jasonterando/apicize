import * as React from 'react'
import { useSelector } from "react-redux";
import { ToggleButtonGroup, ToggleButton, Typography, Box, Stack } from '@mui/material'
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings'
import ViewListIcon from '@mui/icons-material/ViewList'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import { RequestParametersEditor } from './request/request-parameters-editor'
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
import { WorkbookStorageContext } from '../../contexts/workbook-storage-context';
import { useContext } from 'react';

export function RequestEditor(props: {
    triggerRun: () => {},
    triggerCancel: () => {},
    triggerCopyTextToClipboard: (text?: string) => void
    triggerCopyImageToClipboard: (base64?: string) => void,
    triggerSetBodyFromFile: () => void,
}) {
    const help = useContext(WorkbookStorageContext).help
    const activeType = useSelector((state: WorkbookState) => state.navigation.activeType)
    const activeID = useSelector((state: WorkbookState) => state.navigation.activeID)
    const requestName = useSelector((state: WorkbookState) => state.request.name)

    const [panel, setPanel] = React.useState<string>('Parameters')

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue) setPanel(newValue)
    }

    React.useEffect(() => {
        if (panel === null) {
            setPanel('Parameters')
        }
    }, [activeID])

    React.useEffect(() => {
        if (activeType === NavigationType.Request) {
            let helpTopic
            switch (panel) {
                case 'Parameters':
                    helpTopic = 'requests#info-pane'
                    break
                case 'Query String':
                    helpTopic = 'requests#query-string-pane'
                    break
                case 'Headers':
                    helpTopic = 'requests#headers-pane'
                    break
                case 'Body':
                    helpTopic = 'requests#body-pane'
                    break
                case 'Test':
                    helpTopic = 'requests#test-pane'
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

    return (
        <Stack direction='column' className={isRequest ? 'editor-panel' : 'editor-panel-no-toolbar'}>
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
                                    <ToggleButton value="Parameters" title="Show Request Parameters" aria-label='show parameters'><DisplaySettingsIcon /></ToggleButton>
                                    <ToggleButton value="Query String" title="Show Request Query String" aria-label='show query string'><ViewListIcon /></ToggleButton>
                                    <ToggleButton value="Headers" title="Show Request Headers" aria-label='show headers'><ViewListOutlinedIcon /></ToggleButton>
                                    <ToggleButton value="Body" title="Show Request Body" aria-label='show body'><ArticleOutlinedIcon /></ToggleButton>
                                    <ToggleButton value="Test" title="Show Request Test" aria-label='show test'><ScienceIcon /></ToggleButton>
                                </ToggleButtonGroup>
                                <Box className='panels' sx={{ flexGrow: 1 }}>
                                    <EditorTitle icon={<SendIcon />} name={(requestName?.length ?? 0 > 0) ? `${requestName} - ${panel}` : `(Unnamed) - ${panel}`} />
                                    {panel === 'Parameters' ? <RequestParametersEditor />
                                        : panel === 'Headers' ? <RequestHeadersEditor />
                                            : panel === 'Query String' ? <RequestQueryStringEditor />
                                                : panel === 'Body' ? <RequestBodyEditor triggerSetBodyFromFile={props.triggerSetBodyFromFile} />
                                                    : panel === 'Test' ? <RequestTestEditor />
                                                        : null}
                                </Box>
                            </Box>
                        )
                        : (
                            <RequestGroupEditor sx={{ bottom: 0 }} />
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
