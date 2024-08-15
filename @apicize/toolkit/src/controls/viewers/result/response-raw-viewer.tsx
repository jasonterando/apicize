import { TextViewer } from "../text-viewer";
import { IconButton, Stack, Typography } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useExecution } from "../../../contexts/execution-context";

export function ResultRawPreview(props: {
    requestOrGroupId: string,
    resultIndex: number,
    runIndex: number,
    triggerCopyTextToClipboard: (text?: string) => void
}) {
    const execution = useExecution()
    const body = execution.getExecutionResultBody(props.requestOrGroupId, props.runIndex, props.resultIndex)
    let has_text = body?.text !== undefined
    let preview = has_text ? body?.text : body?.data
    return (
        <Stack sx={{ bottom: 0, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex' }}>
            <Typography variant='h2' sx={{ marginTop: 0, flexGrow: 0 }}>Response Body (Raw)
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
        </Stack>
    )
}
