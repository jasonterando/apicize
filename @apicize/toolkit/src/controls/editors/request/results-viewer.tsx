import { useDispatch, useSelector } from "react-redux"
import { Box, Stack, SxProps, Theme, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material"
import { RootState } from "../../../models/store"
import ScienceIcon from '@mui/icons-material/Science'
import SendIcon from '@mui/icons-material/Send';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import PreviewIcon from '@mui/icons-material/Preview'
import React, { useEffect, useState } from "react"
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markup'
// import 'prismjs/themes/prism-tomorrow.css''
import { CancelRequestsFunction, Result } from "@apicize/definitions"
import "../../styles.css"
import { ResultResponsePreview } from "./result/response-preview-viewer";
import { ResultRawPreview } from "./result/response-raw-viewer";
import { ResultInfoViewer } from "./result/result-info-viewer";
import { ResponseHeadersViewer } from "./result/response-headers-viewer";
import { ResultRequestViwer } from "./result/result-request-viewer";
import { RequestRunProgress } from "./result/requuest-run-progress";



export function ResultsViewer(props: {
    sx: SxProps<Theme>,
    className?: string,
    cancelRequests: CancelRequestsFunction
}) {
    const request = useSelector((state: RootState) => state.activeRequest)
    const result = useSelector((state: RootState) => state.activeResult)
    const longTextInResponse = useSelector((state: RootState) => state.longTextInResponse)
    const runningRequestCount = useSelector((state: RootState) => state.runningCount)
    const [inProgress, setInProgress] = React.useState(false)
    const [panel, setPanel] = React.useState<string>('Info')
    
    useEffect(() => {
        setInProgress(request?.running === true)
        const result = request?.result
        if (!(result?.response) && panel !== 'Info') {
            setPanel('Info')
        }

    }, [request, runningRequestCount])

    if (! (result || inProgress)) {
        return null
    }

    const handlePanelChanged = (event: React.SyntheticEvent, newValue: string) => {
        if (newValue) setPanel(newValue)
    }
    const RequestLongTextWarning = () => longTextInResponse ? <Box className='text-warning'>Text Has Been Truncated</Box> : null

    let header: string

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
                header = result?.success ? 'Request Execution Completed' : 'Unable to Execute Request'
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
                <ToggleButton value="Headers" title="Show Response Headers" aria-label='show headers' disabled={inProgress || !result?.response}><ViewListOutlinedIcon /></ToggleButton>
                <ToggleButton value="Text" title="Show Response Body as Text" aria-label='show body text' disabled={inProgress || !result?.response}><ArticleOutlinedIcon /></ToggleButton>
                <ToggleButton value="Preview" title="Show Body as Preview" aria-label='show body preview' disabled={longTextInResponse || inProgress || !result?.response}><PreviewIcon /></ToggleButton>
                <ToggleButton value="Request" title="Show Request" aria-label='show request' disabled={inProgress || !result?.response}><SendIcon /></ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <Typography variant='h1' sx={{ marginTop: 0 }}>{header}</Typography>
                { panel == 'Text' ? <RequestLongTextWarning /> : null }
                {
                    inProgress ? <RequestRunProgress cancelRequests={props.cancelRequests} /> :
                        result === undefined ? <Box /> :
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
