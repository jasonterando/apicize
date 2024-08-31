import { Box, Stack, SxProps, Theme, ToggleButton, ToggleButtonGroup } from "@mui/material"
import ScienceIcon from '@mui/icons-material/ScienceOutlined'
import SendIcon from '@mui/icons-material/Send';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import PreviewIcon from '@mui/icons-material/Preview'
import React from "react"
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markup'
// import 'prismjs/themes/prism-tomorrow.css''
import { ResultResponsePreview } from "./result/response-preview-viewer";
import { ResultRawPreview } from "./result/response-raw-viewer";
import { ResultInfoViewer } from "./result/result-info-viewer";
import { ResponseHeadersViewer } from "./result/response-headers-viewer";
import { ResultRequestViewer } from "./result/result-request-viewer";
import { RequestRunProgress } from "./result/requuest-run-progress";
import { observer } from 'mobx-react-lite';
import { useExecution, useWorkspace } from '../../contexts/root.context';
import { EditableEntityType } from '../../models/workbook/editable-entity-type';

export const ResultsViewer = observer((props: {
    sx: SxProps<Theme>,
    requestOrGroupId: string,
    isGroup: boolean,
    triggerCopyTextToClipboard: (text?: string) => void,
    triggerCopyImageToClipboard: (base64?: string) => void,
    cancelRequest: (id: string) => void
}) => {
    const workspaceCtx = useWorkspace()
    const executionCtx = useExecution()

    if (workspaceCtx.active?.entityType !== EditableEntityType.Request) {
        return null
    }

    const requestExecution = executionCtx.requestExecutions.get(workspaceCtx.active.id)
    const executionResult = executionCtx.getExecutionResult(workspaceCtx.active.id,
        requestExecution?.runIndex ?? NaN, requestExecution?.resultIndex ?? 0)
    const groupSummary = executionCtx.getExecutionGroupSummary(workspaceCtx.active.id,
        requestExecution?.runIndex ?? NaN)
    
    const handlePanelChanged = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue) {
            executionCtx.changePanel(props.requestOrGroupId, newValue)
        }
    }

    const disableOtherPanels = requestExecution?.running || (executionResult?.disableOtherPanels ?? true)
    const disableRequest = requestExecution?.running || (! executionResult?.hasRequest === true)

    const runIndex = requestExecution?.runIndex ?? NaN
    const resultIndex = requestExecution?.resultIndex ?? NaN

    return requestExecution?.runs ? (
        <Stack direction={'row'} sx={props.sx}>
            <ToggleButtonGroup
                orientation='vertical'
                exclusive
                onChange={handlePanelChanged}
                value={requestExecution.panel}
                sx={{ marginRight: '24px' }}
                aria-label="text alignment">
                <ToggleButton value="Info" title="Show Result Info" aria-label='show info' disabled={requestExecution.running}><ScienceIcon color={executionResult?.infoColor ?? groupSummary?.infoColor ?? 'disabled'} /></ToggleButton>
                <ToggleButton value="Headers" title="Show Response Headers" aria-label='show headers' disabled={disableOtherPanels}><ViewListOutlinedIcon /></ToggleButton>
                <ToggleButton value="Text" title="Show Response Body as Text" aria-label='show body text' disabled={disableOtherPanels}><ArticleOutlinedIcon /></ToggleButton>
                <ToggleButton value="Preview" title="Show Body as Preview" aria-label='show body preview' disabled={disableOtherPanels || executionResult?.longTextInResponse === true}><PreviewIcon /></ToggleButton>
                <ToggleButton value="Request" title="Show Request" aria-label='show request' disabled={disableRequest}><SendIcon /></ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ overflow: 'hidden', flexGrow: 1, bottom: '0', position: 'relative' }}>
                {
                    requestExecution.running ? <RequestRunProgress cancelRequest={props.cancelRequest} /> :
                        requestExecution.panel === 'Info' ? <ResultInfoViewer requestOrGroupId={props.requestOrGroupId} runIndex={runIndex} resultIndex={resultIndex}
                            triggerCopyTextToClipboard={props.triggerCopyTextToClipboard} />
                            : requestExecution.panel === 'Headers' ? <ResponseHeadersViewer requestOrGroupId={props.requestOrGroupId} runIndex={runIndex} resultIndex={resultIndex} />
                                : requestExecution.panel === 'Preview' ? <ResultResponsePreview
                                    requestOrGroupId={props.requestOrGroupId}
                                    runIndex={runIndex} resultIndex={resultIndex}
                                    triggerCopyTextToClipboard={props.triggerCopyTextToClipboard}
                                    triggerCopyImageToClipboard={props.triggerCopyImageToClipboard}
                                />
                                    : requestExecution.panel === 'Text' ? <ResultRawPreview
                                        requestOrGroupId={props.requestOrGroupId}
                                        runIndex={runIndex}
                                        resultIndex={resultIndex}
                                        triggerCopyTextToClipboard={props.triggerCopyTextToClipboard}
                                    />
                                        : requestExecution.panel === 'Request' ? <ResultRequestViewer
                                            requestOrGroupId={props.requestOrGroupId}
                                            runIndex={runIndex}
                                            resultIndex={resultIndex}
                                            triggerCopyTextToClipboard={props.triggerCopyTextToClipboard} />
                                            : null
                }
            </Box>
        </Stack>)
        : null
})
