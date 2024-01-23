import { useSelector } from "react-redux"
import { WorkbookState } from "../../../models/store"
import { TextViewer } from "../../viewers/text-viewer"
import { IconButton, Typography } from "@mui/material"
import { Box } from "@mui/system"
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import beautify from "js-beautify";

export function ResultRequestViewer(props: {
    triggerCopyTextToClipboard: (text?: string) => void
}) {
    const result = useSelector((state: WorkbookState) => state.selectedExecutionResult)
    const request = result?.request
    if (! request) {
        return null
    }

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
