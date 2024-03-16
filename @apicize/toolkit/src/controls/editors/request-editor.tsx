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
import { WorkbookState } from '../../models/store'
import { useContext } from 'react';
import { WorkbookStorageContext } from '../../contexts/workbook-storage-context';
import { RequestGroupEditor } from './request/request-group-editor';

export function RequestEditor(props: {
    triggerRun: () => {},
    triggerCancel: () => {},
    triggerCopyTextToClipboard: (text?: string) => void
    triggerCopyImageToClipboard: (base64?: string) => void,
    triggerSetBodyFromFile: () => void,
}) {
    const request = useContext(WorkbookStorageContext).request

    const requestId = useSelector((state: WorkbookState) => state.request.id)
    const groupId = useSelector((state: WorkbookState) => state.group.id)
    const requestName = useSelector((state: WorkbookState) => state.request.name)

    const [panel, setPanel] = React.useState<string>('Parameters')

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue) setPanel(newValue)
    }

    React.useEffect(() => {
        if (panel === null) {
            setPanel('Parameters')
        }
    }, [requestId, groupId])

    if (!(requestId || groupId)) {
        return null
    }

    return (
        <Stack direction='column' sx={{ flex: 1, paddingLeft: '8px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', height: '100vh' }}>
            <Stack sx={{ height: '55vh', paddingBottom: '48px', flexBasis: 2 }}>
                {
                    requestId
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
                                    <Typography variant='h1'><SendIcon /> {requestName?.length ?? 0 > 0 ? requestName : '(Unnamed)'} - {panel}</Typography>
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
