import { useSelector } from "react-redux"
import { WorkbookState } from "../../../models/store"
import { TextViewer } from "../text-viewer"
import { IconButton, Typography } from "@mui/material"
import { Box } from "@mui/system"
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import beautify from "js-beautify";
import { WorkspaceContext } from "../../../contexts/workspace-context"
import { useContext } from "react"

export function ResultRequestViewer(props: {
    triggerCopyTextToClipboard: (text?: string) => void
}) {
    const executionId = useSelector((state: WorkbookState) => state.navigation.activeExecutionID)
    useSelector((state: WorkbookState) => state.execution.resultIndex)
    useSelector((state: WorkbookState) => state.execution.runIndex)
    if (! executionId) {
        return null
    }

    const execution = useContext(WorkspaceContext).execution
    const request = execution.getRequest(executionId)

    const text = beautify.js_beautify(JSON.stringify(request), {})
    return (
        <Box>
            <Typography variant='h2' sx={{marginTop: 0}}>Request
            <IconButton
                    aria-label="Copy Request to Clipboard"
                    title="Copy Request to Clipboard"
                    sx={{ marginLeft: '16px' }}
                    onClick={_ => props.triggerCopyTextToClipboard(text)}>
                    <ContentCopyIcon />
                </IconButton>
            </Typography>
            <TextViewer text={text} extension='json' />
        </Box>
    )
}
