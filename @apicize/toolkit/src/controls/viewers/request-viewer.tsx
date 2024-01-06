import '../styles.css'
import * as React from 'react'
import { useSelector } from "react-redux";
import { ToggleButtonGroup, ToggleButton, Typography, Box, Stack } from '@mui/material'
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings'
import ViewListIcon from '@mui/icons-material/ViewList'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import { RequestParametersEditor } from '../editors/request/request-parameters-editor'
import { RequestHeadersEditor } from '../editors/request/request-headers-editor'
import SendIcon from '@mui/icons-material/Send';
import ScienceIcon from '@mui/icons-material/Science';
import { RequestQueryStringEditor } from '../editors/request/request-query-string-editor'
import { RequestBodyEditor } from '../editors/request/request-body-editor'
import { RequestTestEditor } from '../editors/request/request-test-editor'
import { RequestTestContext } from '../editors/request/request-test-context'
import { ResultsViewer } from '../editors/request/results-viewer'
import { WorkbookState } from '../../models/store'

export function RequestViewer(props: { triggerRun: () => {} }) {
    const request = useSelector((state: WorkbookState) => state.activeRequest)
    
    const [panel, setPanel] = React.useState<string>('Parameters')

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue) setPanel(newValue)
    }

    React.useEffect(() => {
        if (panel === null) {
            setPanel('Parameters')
        }
    }, [request])

    if (! request) {
        return null
    }

    return (
        <Stack direction='column' sx={{ width: '100%', height: '100vh', display: 'flex', bottom: 0 }}>
            <Stack direction='column' sx={{flexGrow: 1, flexShrink: 1, flexBasis: 1}}>
                <Box className='section'>
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
                <RequestTestContext triggerRun={props.triggerRun} />
            </Stack>
            <ResultsViewer className='section' sx={{display: 'flex', flexDirection: 'row', flexGrow: 2, flexShrink: 1, bottom: 0}} />
        </Stack>
    )
}
