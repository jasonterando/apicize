import { TextViewer } from "../text-viewer"
import { IconButton, Typography } from "@mui/material"
import { Stack } from "@mui/system"
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import beautify from "js-beautify";
import { useExecution } from "../../../contexts/root.context";
import { observer } from "mobx-react-lite";

export const ResultRequestViewer = observer((props: {
    requestOrGroupId: string,
    runIndex: number,
    resultIndex: number,
    triggerCopyTextToClipboard: (text?: string) => void
}) => {
    const execution = useExecution()
    const request = execution.getExecutionRequest(props.requestOrGroupId, props.runIndex, props.resultIndex)
    const text = beautify.js_beautify(JSON.stringify(request), {})
    return (
        <Stack sx={{ bottom: 0, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex' }}>
            <Typography variant='h2' sx={{marginTop: 0, flexGrow: 0}} component='div'>Request
            <IconButton
                    aria-label="Copy Request to Clipboard"
                    title="Copy Request to Clipboard"
                    sx={{ marginLeft: '16px' }}
                    onClick={_ => props.triggerCopyTextToClipboard(text)}>
                    <ContentCopyIcon />
                </IconButton>
            </Typography>
            <TextViewer text={text} extension='json' />
        </Stack>
    )
})
