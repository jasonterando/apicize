import { useSelector } from "react-redux"
import { Box, Stack, SxProps, Theme, ToggleButton, ToggleButtonGroup } from "@mui/material"
import { WorkbookState } from "../../models/store"
import ScienceIcon from '@mui/icons-material/Science'
import SendIcon from '@mui/icons-material/Send';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import PreviewIcon from '@mui/icons-material/Preview'
import React, { useEffect } from "react"
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markup'
// import 'prismjs/themes/prism-tomorrow.css''
import { ResultResponsePreview } from "./result/response-preview-viewer";
import { ResultRawPreview } from "./result/response-raw-viewer";
import { ResultInfoViewer } from "./result/result-info-viewer";
import { ResponseHeadersViewer } from "./result/response-headers-viewer";
import { ResultRequestViewer } from "./result/result-request-viewer";
import { RequestRunProgress } from "./result/requuest-run-progress";
import { EditableWorkbookRequestEntry } from "../../models/workbook/editable-workbook-request-entry";

export function ResultsViewer(props: {
    sx: SxProps<Theme>,
    triggerCopyTextToClipboard: (text?: string) => void,
    triggerCopyImageToClipboard: (base64?: string) => void,
    cancelRequest: (request: EditableWorkbookRequestEntry) => void
}) {
    const execution = useSelector((state: WorkbookState) => state.activeExecution)
    const executionResult = useSelector((state: WorkbookState) => state.selectedExecutionResult)
    const groupResults = useSelector((state: WorkbookState) => state.groupExecutionResults)
    const runningRequestCount = useSelector((state: WorkbookState) => state.runningCount)
    const [inProgress, setInProgress] = React.useState(false)
    const [panel, setPanel] = React.useState<string>('Info')

    useEffect(() => {
        setInProgress(execution?.running === true)
        if (!(executionResult?.response) && panel !== 'Info') {
            setPanel('Info')
        }
    }, [execution, executionResult, runningRequestCount])

    if (!(executionResult || groupResults ||inProgress)) {
        return null
    }

    const handlePanelChanged = (event: React.SyntheticEvent, newValue: string) => {
        if (newValue) setPanel(newValue)
    }

    const disableOtherPanels = inProgress || groupResults !== undefined || executionResult?.response === undefined
    return (<Stack direction={'row'} sx={props.sx}>
        <ToggleButtonGroup
            orientation='vertical'
            exclusive
            onChange={handlePanelChanged}
            value={panel}
            sx={{ marginRight: '24px' }}
            aria-label="text alignment">
            <ToggleButton value="Info" title="Show Result Info" aria-label='show info' disabled={inProgress}><ScienceIcon /></ToggleButton>
            <ToggleButton value="Headers" title="Show Response Headers" aria-label='show headers' disabled={disableOtherPanels}><ViewListOutlinedIcon /></ToggleButton>
            <ToggleButton value="Text" title="Show Response Body as Text" aria-label='show body text' disabled={disableOtherPanels}><ArticleOutlinedIcon /></ToggleButton>
            <ToggleButton value="Preview" title="Show Body as Preview" aria-label='show body preview' disabled={disableOtherPanels || executionResult?.longTextInResponse}><PreviewIcon /></ToggleButton>
            <ToggleButton value="Request" title="Show Request" aria-label='show request' disabled={disableOtherPanels}><SendIcon /></ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ overflow: 'auto', flexGrow: 1, bottom: '0' }}>
            {
                inProgress ? <RequestRunProgress cancelRequest={props.cancelRequest} /> :
                    execution === undefined ? <Box /> :
                        panel === 'Info' ? <ResultInfoViewer triggerCopyTextToClipboard={props.triggerCopyTextToClipboard} />
                            : panel === 'Headers' ? <ResponseHeadersViewer />
                                : panel === 'Preview' ? <ResultResponsePreview
                                    triggerCopyTextToClipboard={props.triggerCopyTextToClipboard}
                                    triggerCopyImageToClipboard={props.triggerCopyImageToClipboard}
                                />
                                    : panel === 'Text' ? <ResultRawPreview triggerCopyTextToClipboard={props.triggerCopyTextToClipboard}
                                    />
                                        : panel === 'Request' ? <ResultRequestViewer triggerCopyTextToClipboard={props.triggerCopyTextToClipboard} />
                                            : null
            }
        </Box>
    </Stack>)
}
