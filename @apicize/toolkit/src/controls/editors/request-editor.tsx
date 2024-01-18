import '../styles.css'
import * as React from 'react'
import { useSelector } from "react-redux";
import { ToggleButtonGroup, ToggleButton, Typography, Box, Stack, Grid, TextField, SxProps } from '@mui/material'
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
import { ResultsViewer } from './request/results-viewer'
import { WorkbookState } from '../../models/store'
import { RequestGroupEditor } from '../..';
import { relative } from 'path';

export function RequestEditor(props: {
    triggerRun: () => {},
    triggerCancel: () => {}
}) {
    const request = useSelector((state: WorkbookState) => state.activeRequest)
    const group = useSelector((state: WorkbookState) => state.activeRequestGroup)

    const [panel, setPanel] = React.useState<string>('Parameters')

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue) setPanel(newValue)
    }

    React.useEffect(() => {
        if (panel === null) {
            setPanel('Parameters')
        }
    }, [request])

    if (!(request || group)) {
        return null
    }

    return (
        <Stack direction='column' sx={{flex: 1}}>
            {
                request
                    ? (
                        <Box className='section' sx={{display: "flex", bottom: 0}}>
                            <ToggleButtonGroup
                                className='button-column'
                                orientation='vertical'
                                exclusive
                                onChange={handlePanelChanged}
                                value={panel}
                                aria-label="text alignment">
                                <ToggleButton value="Parameters" title="Show Request Parameters" aria-label='show parameters'><DisplaySettingsIcon /></ToggleButton>
                                <ToggleButton value="Query String" title="Show Request Query String" aria-label='show query string'><ViewListIcon /></ToggleButton>
                                <ToggleButton value="Headers" title="Show Request Headers" aria-label='show headers'><ViewListOutlinedIcon /></ToggleButton>
                                <ToggleButton value="Body" title="Show Request Body" aria-label='show body'><ArticleOutlinedIcon /></ToggleButton>
                                <ToggleButton value="Test" title="Show Request Test" aria-label='show test'><ScienceIcon /></ToggleButton>
                            </ToggleButtonGroup>
                            <Box className='panels' sx={{ flexGrow: 1 }}>
                                <Typography variant='h1'><SendIcon /> {request.name?.length ?? 0 > 0 ? request.name : '(Unnamed)'} - {panel}</Typography>
                                {panel === 'Parameters' ? <RequestParametersEditor />
                                    : panel === 'Headers' ? <RequestHeadersEditor />
                                        : panel === 'Query String' ? <RequestQueryStringEditor />
                                            : panel === 'Body' ? <RequestBodyEditor />
                                                : panel === 'Test' ? <RequestTestEditor />
                                                    : null}
                            </Box>
                        </Box>
                    )
                    : (
                        <RequestGroupEditor sx={{display: "flex", bottom: 0}}/>
                    )
            }
            <RequestTestContext sx={{flexGrow: 0}} triggerRun={props.triggerRun} />
            <ResultsViewer className='section' sx={{ 
                display: 'flex',
                flexDirection: 'row',
                boxSizing: 'border-box',
                position: 'relative',
                height: 'calc(100vh - 400px)',
                flexGrow: 0,
                flexShrink: 0,
                bottom: 0
                }} cancelRequest={props.triggerCancel} />
        </Stack>
    )
}
