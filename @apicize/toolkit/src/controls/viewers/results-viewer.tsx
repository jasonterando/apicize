import { OverridableStringUnion } from '@mui/types'
import { Box, Stack, SvgIconPropsColorOverrides, SxProps, Theme, ToggleButton, ToggleButtonGroup } from "@mui/material"
import { ResultType } from "../../models/store"
import ScienceIcon from '@mui/icons-material/ScienceOutlined'
import SendIcon from '@mui/icons-material/Send';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import PreviewIcon from '@mui/icons-material/Preview'
import React, { useState } from "react"
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markup'
// import 'prismjs/themes/prism-tomorrow.css''
import { ResultResponsePreview } from "./result/response-preview-viewer";
import { ResultRawPreview } from "./result/response-raw-viewer";
import { ResultInfoViewer } from "./result/result-info-viewer";
import { ResponseHeadersViewer } from "./result/response-headers-viewer";
import { ResultRequestViewer } from "./result/result-request-viewer";
import { RequestRunProgress } from "./result/requuest-run-progress";
import { useExecution } from "../../contexts/execution-context"

type InfoColorType = OverridableStringUnion<
    | 'inherit'
    | 'success'
    | 'warning'
    | 'disabled',
    SvgIconPropsColorOverrides>

export function ResultsViewer(props: {
    sx: SxProps<Theme>,
    requestOrGroupId: string,
    isGroup: boolean,
    runIndex: number,
    resultIndex: number,
    triggerCopyTextToClipboard: (text?: string) => void,
    triggerCopyImageToClipboard: (base64?: string) => void,
    cancelRequest: (id: string) => void
}) {
    const execution = useExecution()

    const getUpdatedState = (): [string, boolean, boolean, InfoColorType] => {
        const info = execution.getExecutionInfo(props.requestOrGroupId)

        let activeDisableOtherPanels: boolean
        let isRunning = (info?.running === true)
        if (isRunning) {
            activeDisableOtherPanels = true
        } else {
            activeDisableOtherPanels = props.isGroup
        }
        let activePanel = info?.panel ?? ''
        if (activePanel.length === 0 && (!props.isGroup)) {
            activePanel = longTextInResponse ? 'Text' : 'Preview'
        }
        if (activePanel.length === 0 || (activeDisableOtherPanels && activePanel !== 'Info')) {
            activePanel = 'Info'
        }

        const result = isRunning
            ? null
            : execution.getExecutionSummary(props.requestOrGroupId, props.runIndex, props.resultIndex)

        let allOk = true
        let failedTestCount = 0
        if (Array.isArray(result)) {
            for (const r of result) {
                if (!r.success) {
                    allOk = false
                    break
                }
                failedTestCount += (r.failedTestCount ?? 0)
            }
        } else if (result) {
            allOk = result.success
            failedTestCount = (result.failedTestCount ?? 0)
        }

        if (!allOk) {
            activeDisableOtherPanels = true
        }

        let activeInfoColor = (
            isRunning
                ? 'disabled'
                : allOk
                    ? failedTestCount === 0
                        ? 'success'
                        : 'warning'
                    : 'error'
        ) as InfoColorType

        return [activePanel, isRunning, activeDisableOtherPanels, activeInfoColor]
    }


    // TODO - FIX THESE
    const [activePanel, activeRunning, activeDisableOtherPanels, activeIconColor] = getUpdatedState()

    const [panel, setPanel] = useState(activePanel)
    const [running, setRunning] = useState(activeRunning)
    const [disableOtherPanels, setDisableOtherPanels] = useState(activeDisableOtherPanels)
    const [infoColor, setInfoColor] = useState(activeIconColor)
    const [longTextInResponse, setLongTextInResponse] = useState(false)


    React.useEffect(() => {
        const [activePanel, activeRunning, activeDisableOtherPanels, activeInfoColor] = getUpdatedState()
        setPanel(activePanel)
        setRunning(activeRunning)
        setDisableOtherPanels(activeDisableOtherPanels)
        setInfoColor(activeInfoColor)
    }, [execution.running])

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue) {
            execution.changePanel(props.requestOrGroupId, newValue)
            setPanel(newValue)
        }
    }

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
                        panel === 'Info' ? <ResultInfoViewer requestOrGroupId={props.requestOrGroupId} runIndex={props.runIndex} resultIndex={props.resultIndex}
                            triggerCopyTextToClipboard={props.triggerCopyTextToClipboard} />
                            : panel === 'Headers' ? <ResponseHeadersViewer requestOrGroupId={props.requestOrGroupId} runIndex={props.runIndex} resultIndex={props.resultIndex} />
                                : panel === 'Preview' ? <ResultResponsePreview
                                    requestOrGroupId={props.requestOrGroupId}
                                    runIndex={props.runIndex}
                                    resultIndex={props.resultIndex}
                                    triggerCopyTextToClipboard={props.triggerCopyTextToClipboard}
                                    triggerCopyImageToClipboard={props.triggerCopyImageToClipboard}
                                />
                                    : panel === 'Text' ? <ResultRawPreview
                                        requestOrGroupId={props.requestOrGroupId}
                                        runIndex={props.runIndex}
                                        resultIndex={props.resultIndex}
                                        triggerCopyTextToClipboard={props.triggerCopyTextToClipboard}
                                    />
                                        : panel === 'Request' ? <ResultRequestViewer
                                            requestOrGroupId={props.requestOrGroupId}
                                            runIndex={props.runIndex}
                                            resultIndex={props.resultIndex}
                                            triggerCopyTextToClipboard={props.triggerCopyTextToClipboard} />
                                            : null
                }
            </Box>
        </Stack>)
}
