import { useSelector } from "react-redux"
import { WorkbookState } from "../../../models/store"
import { Box, Stack, textTransform } from "@mui/system"
import { IconButton, Typography } from "@mui/material"
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import beautify from "js-beautify";

const TestInfo = (props: { isError?: boolean, text: string }) =>
(
    <Stack direction='row' sx={{ marginBottom: '18px' }}>
        <Stack direction='column' sx={{ marginLeft: '40px' }}>
            <Typography variant='h3' sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0, color: '#80000' }}>
                {
                    props.isError === true
                        ? (<Box color='#FF0000' sx={{ textTransform: 'capitalize' }}>{props.text}</Box>)
                        : (<>{props.text}</>)
                }
            </Typography>
        </Stack>
    </Stack>
)

const TestResult = (props: { name: string[], success: boolean, logs?: string[], error?: string }) =>
(
    <Stack direction='row' sx={{ marginBottom: '10px' }}>
        <Box sx={{ width: '32px', marginRight: '8px' }}>
            {props.success ? (<CheckIcon color='success' />) : (<BlockIcon color='error' />)}
        </Box>
        <Stack direction='column'>
            <Typography variant='h3' sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0 }}>
                Test: {props.name.join(' ')}
            </Typography>
            {(props.error?.length ?? 0) > 0 ? (<Typography variant='h3' sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0 }} color='error'>{props.error}</Typography>) : (<></>)}
            {(props.logs?.length ?? 0) > 0 ? (
                <Box sx={{ overflow: 'auto', marginTop: 4, marginBottom: 0 }}>
                    <pre style={{ paddingTop: 0, marginTop: 0, whiteSpace: 'pre-line' }}>{props.logs?.join('\n')}</pre>
                </Box>
            ) : (<></>)}
        </Stack>
    </Stack>
)

export function ResultInfoViewer(props: {
    triggerCopyTextToClipboard: (text?: string) => void
}) {
    const result = useSelector((state: WorkbookState) => state.selectedExecutionResult)
    if (!result) {
        return null
    }

    const copyResultToClipboard = () => {
        const text = beautify.js_beautify(JSON.stringify(result), {})
        props.triggerCopyTextToClipboard(text)
    }

    let cached = result.response?.authTokenCached === true
    var idx = 0
    return (
        <Box>
            <Typography variant='h2' sx={{ marginTop: 0 }}>
                Request Execution {result.success ? "Completed" : "Failed"}
                <IconButton
                    aria-label="Copy Results to Clipboard"
                    title="Copy Results to Clipboard"
                    sx={{ marginLeft: '16px' }}
                    onClick={_ => copyResultToClipboard()}>
                    <ContentCopyIcon />
                </IconButton>
            </Typography>
            {((result.errorMessage?.length ?? 0) == 0)
                ? (<></>)
                : (<TestInfo isError={true} text={`${result.errorMessage}`} />)}
            {result.response?.status === undefined
                ? (<></>)
                : (<TestInfo text={`Status: ${result.response.status} ${result.response.statusText}`} />)}
            {(result.executedAt > 0)
                ? (<TestInfo text={`Exeucted At: ${result.executedAt.toLocaleString()} ms`} />)
                : (<></>)}
            {(result.milliseconds && result.milliseconds > 0)
                ? (<TestInfo text={`Duration: ${result.milliseconds.toLocaleString()} ms`} />)
                : (<></>)}
            {cached
                ? (<TestInfo text='OAuth bearer token retrieved from cache' />)
                : (<></>)}
            <Box>
            {
                result.tests
                    ? (result.tests.map(test => (<TestResult key={`test-${idx++}`} name={test.testName} success={test.success} error={test.error} logs={test.logs} />)))
                    : (<></>)
            }
            </Box>
        </Box >
    )
}
