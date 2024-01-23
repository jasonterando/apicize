import { useSelector } from "react-redux"
import { TextViewer } from "../../viewers/text-viewer";
import { WorkbookState } from "../../../models/store";
import { Box, IconButton, Typography } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export function ResultRawPreview(props: {
    triggerCopyTextToClipboard: (text?: string) => void
}) {
    const result = useSelector((state: WorkbookState) => state.selectedExecutionResult)
    if (!result) return null
    let has_text = result.response?.body?.text !== undefined
    let preview = has_text ? result.response?.body?.text : result.response?.body?.data
    return (
        <Box sx={{ bottom: 0, overflow: 'auto' }}>
            <Typography variant='h2' sx={{ marginTop: 0 }}>Response Body (Raw)
                {(preview?.length ?? 0) > 0
                ? (<IconButton
                    aria-label="Copy Text to Clipboard"
                    title="Copy Text to Clipboard"
                    sx={{ marginLeft: '16px' }}
                    onClick={_ => props.triggerCopyTextToClipboard(preview)}>
                    <ContentCopyIcon />
                </IconButton>)
                : (<></>)
            }
            </Typography>
            {has_text
                ? (<TextViewer text={preview} extension='txt' />)
                : (<><Typography variant='h3' sx={{ marginTop: 0 }}>Base 64</Typography><TextViewer text={preview} extension='txt' /></>)
            }
        </Box>
    )
}
