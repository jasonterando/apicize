import { useSelector } from "react-redux"
import { Box, Stack, SxProps, Theme, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material"
import { WorkbookState } from "../../../models/store"
import ScienceIcon from '@mui/icons-material/Science'
import SendIcon from '@mui/icons-material/Send';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import PreviewIcon from '@mui/icons-material/Preview'
import React, { useEffect } from "react"
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markup'
// import 'prismjs/themes/prism-tomorrow.css''
import "../../styles.css"
import { ResultResponsePreview } from "./result/response-preview-viewer";
import { ResultRawPreview } from "./result/response-raw-viewer";
import { ResultInfoViewer } from "./result/result-info-viewer";
import { ResponseHeadersViewer } from "./result/response-headers-viewer";
import { ResultRequestViwer } from "./result/result-request-viewer";
import { RequestRunProgress } from "./result/requuest-run-progress";



export function ResultsViewer(props: {
    sx: SxProps<Theme>,
    className?: string
}) {
    const execution = useSelector((state: WorkbookState) => state.activeExecution)
    const result = useSelector((state: WorkbookState) => state.activeExecution?.result)
    const longTextInResponse = useSelector((state: WorkbookState) => state.longTextInResponse)
    const runningRequestCount = useSelector((state: WorkbookState) => state.runningCount)
    const [inProgress, setInProgress] = React.useState(false)
    const [panel, setPanel] = React.useState<string>('Info')
    
    useEffect(() => {
        setInProgress(execution?.running === true)
        if (!(result?.response) && panel !== 'Info') {
            setPanel('Info')
        }
    }, [execution, result, runningRequestCount])

    if (! (result || inProgress)) {
        return null
    }

    const handlePanelChanged = (event: React.SyntheticEvent, newValue: string) => {
        if (newValue) setPanel(newValue)
    }
    const RequestLongTextWarning = () => longTextInResponse ? <Box className='text-warning'>Text Has Been Truncated</Box> : null

    let header: string

    const success = result?.tests?.reduce((r, t) => t.success && r, true) ?? true

    if (inProgress) {
        header = 'Request In Progress...'
    } else {
        switch (panel) {
            case 'Headers':
                header = 'Response Headers'
                break
            case 'Text':
                header = 'Response Body (Raw)'
                break
            case 'Preview':
                header = 'Response Body (Preview)'
                break
            case 'Request':
                header = 'Request'
                break
            default:
                header = success ? 'Request Execution Completed' : 'Unable to Execute Request'
                break
        }
    }

    return (
        <Stack direction={'row'} sx={props.sx} className={props.className}>
            <ToggleButtonGroup
                className='button-column'
                orientation='vertical'
                exclusive
                onChange={handlePanelChanged}
                value={panel}
                aria-label="text alignment">
                <ToggleButton value="Info" title="Show Result Info" aria-label='show info' disabled={inProgress}><ScienceIcon /></ToggleButton>
                <ToggleButton value="Headers" title="Show Response Headers" aria-label='show headers' disabled={inProgress || !execution?.result?.response}><ViewListOutlinedIcon /></ToggleButton>
                <ToggleButton value="Text" title="Show Response Body as Text" aria-label='show body text' disabled={inProgress || !execution?.result?.response}><ArticleOutlinedIcon /></ToggleButton>
                <ToggleButton value="Preview" title="Show Body as Preview" aria-label='show body preview' disabled={longTextInResponse || inProgress || !execution?.result?.response}><PreviewIcon /></ToggleButton>
                <ToggleButton value="Request" title="Show Request" aria-label='show request' disabled={inProgress || !execution?.result?.response}><SendIcon /></ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <Typography variant='h1' sx={{ marginTop: 0 }}>{header}</Typography>
                { panel == 'Text' ? <RequestLongTextWarning /> : null }
                {
                    inProgress ? <RequestRunProgress /> :
                        execution === undefined ? <Box /> :
                            panel === 'Info' ? <ResultInfoViewer />
                                : panel === 'Headers' ? <ResponseHeadersViewer />
                                    : panel === 'Preview' ? <ResultResponsePreview />
                                        : panel === 'Text' ? <ResultRawPreview />
                                            : panel === 'Request' ? <ResultRequestViwer />
                                                : null
                }
            </Box>
        </Stack>
    )
}
