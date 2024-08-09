import { useSelector } from "react-redux"
import { OverridableStringUnion } from '@mui/types'
import { Box, Stack, SvgIconPropsColorOverrides, SxProps, Theme, ToggleButton, ToggleButtonGroup } from "@mui/material"
import { ResultType, WorkbookState } from "../../models/store"
import ScienceIcon from '@mui/icons-material/ScienceOutlined'
import SendIcon from '@mui/icons-material/Send';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import PreviewIcon from '@mui/icons-material/Preview'
import React, { useContext, useEffect } from "react"
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markup'
// import 'prismjs/themes/prism-tomorrow.css''
import { ResultResponsePreview } from "./result/response-preview-viewer";
import { ResultRawPreview } from "./result/response-raw-viewer";
import { ResultInfoViewer } from "./result/result-info-viewer";
import { ResponseHeadersViewer } from "./result/response-headers-viewer";
import { ResultRequestViewer } from "./result/result-request-viewer";
import { RequestRunProgress } from "./result/requuest-run-progress";
import { WorkspaceContext } from "../../contexts/workspace-context";

export function ResultsViewer(props: {
    sx: SxProps<Theme>,
    triggerCopyTextToClipboard: (text?: string) => void,
    triggerCopyImageToClipboard: (base64?: string) => void,
    cancelRequest: (id: string) => void
}) {
    const context = useContext(WorkspaceContext)
    const executionId = useSelector((state: WorkbookState) => state.navigation.activeExecutionID)
    const resultType = useSelector((state: WorkbookState) => state.execution.resultType)
    const failedTestCount = useSelector((state: WorkbookState) => state.execution.failedTestCount)
    const running = useSelector((state: WorkbookState) => state.execution.running)
    const longTextInResponse = useSelector((state: WorkbookState) => state.execution.longTextInResponse)
    useSelector((state: WorkbookState) => state.execution.resultIndex)
    useSelector((state: WorkbookState) => state.execution.runIndex)
    const panel = useSelector((state: WorkbookState) => state.execution.panel);

    if (!executionId) {
        return null
    }

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue) {
            context.execution.setPanel(newValue)
        }
    }

    const disableOtherPanels = (running || resultType != ResultType.Single)

    let activePanel = panel
    if (activePanel.length === 0 && resultType === ResultType.Single) {
        activePanel = longTextInResponse ? 'Text' : 'Preview'
    }
    if (activePanel.length === 0 || (disableOtherPanels && activePanel !== 'Info')) {
        activePanel = 'Info'
    }

    let infoColor = (
        (resultType === ResultType.Single || resultType === ResultType.Group)
            ? failedTestCount === 0
                ? 'success'
                : 'warning'
            : (resultType === ResultType.Failed)
                ? 'error'
                : 'inherit'
    ) as OverridableStringUnion<
        | 'inherit'
        | 'success'
        | 'warning',
        SvgIconPropsColorOverrides
    >

    return (
        <Stack direction={'row'} sx={props.sx}>
            <ToggleButtonGroup
                orientation='vertical'
                exclusive
                onChange={handlePanelChanged}
                value={activePanel}
                sx={{ marginRight: '24px' }}
                aria-label="text alignment">
                <ToggleButton value="Info" title="Show Result Info" aria-label='show info' disabled={running}><ScienceIcon color={infoColor} /></ToggleButton>
                <ToggleButton value="Headers" title="Show Response Headers" aria-label='show headers' disabled={disableOtherPanels}><ViewListOutlinedIcon /></ToggleButton>
                <ToggleButton value="Text" title="Show Response Body as Text" aria-label='show body text' disabled={disableOtherPanels}><ArticleOutlinedIcon /></ToggleButton>
                <ToggleButton value="Preview" title="Show Body as Preview" aria-label='show body preview' disabled={disableOtherPanels || longTextInResponse}><PreviewIcon /></ToggleButton>
                <ToggleButton value="Request" title="Show Request" aria-label='show request' disabled={disableOtherPanels}><SendIcon /></ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ overflow: 'hidden', flexGrow: 1, bottom: '0', position: 'relative' }}>
                {
                    running ? <RequestRunProgress cancelRequest={props.cancelRequest} /> :
                        (!executionId) ? <></> :
                            activePanel === 'Info' ? <ResultInfoViewer triggerCopyTextToClipboard={props.triggerCopyTextToClipboard} />
                                : activePanel === 'Headers' ? <ResponseHeadersViewer />
                                    : activePanel === 'Preview' ? <ResultResponsePreview
                                        triggerCopyTextToClipboard={props.triggerCopyTextToClipboard}
                                        triggerCopyImageToClipboard={props.triggerCopyImageToClipboard}
                                    />
                                        : activePanel === 'Text' ? <ResultRawPreview triggerCopyTextToClipboard={props.triggerCopyTextToClipboard}
                                        />
                                            : activePanel === 'Request' ? <ResultRequestViewer triggerCopyTextToClipboard={props.triggerCopyTextToClipboard} />
                                                : null
                }
            </Box>
        </Stack>)
}
