import { useSelector } from "react-redux"
import { WorkbookState } from "../../../models/store"
import { Box, Stack, textTransform } from "@mui/system"
import { IconButton, Typography } from "@mui/material"
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import beautify from "js-beautify";
import { ApicizeResult } from "@apicize/lib-typescript";
import { WorkbookExecutionRequest } from "../../../models/workbook/workbook-execution";

const ResultSummary = (props: { executionResult: WorkbookExecutionRequest }) => {
    let idx = 0
    let info = []
    if (props.executionResult.response?.status) {
        info.push(`${props.executionResult.response.status} ${props.executionResult.response.statusText}`)
    }
    if (props.executionResult.milliseconds && props.executionResult.milliseconds > 0) {
        info.push(`${props.executionResult.milliseconds.toLocaleString()} ms`)
    }
    return (<Box key={`test-${idx++}`} sx={{marginBottom: '24px'}}>
        <Typography variant='h3' sx={{ marginTop: 0, paddingTop: 0, color: '#80000' }}>
            {props.executionResult.name} 
            <>
                {info.length === 0 ? '' : ` (${info.join(', ')})`}
            </>
        </Typography>
        {((props.executionResult.errorMessage?.length ?? 0) == 0)
                ? (<></>)
                : (<TestInfo isError={true} text={`${props.executionResult.errorMessage}`} />)}
        {
        props.executionResult.tests
            ? (
                <Box sx={{marginTop: '18px'}}>
                    {
                    props.executionResult.tests.map(test => (<TestResult 
                        key={`test-${idx++}`} 
                        name={test.testName} 
                        success={test.success} 
                        error={test.error} 
                        logs={undefined} />))
                    }
                </Box>
            )
            : (<></>)
        }
    </Box>)
}

const ResultDetail = (props: { executionResult: ApicizeResult }) => {
    let idx = 0
    return (<Box key={`test-${idx++}`} sx={{marginBottom: '24px'}}>
        <Box sx={{ marginBottom: '18px' }}>
            {((props.executionResult.errorMessage?.length ?? 0) == 0)
                ? (<></>)
                : (<TestInfo isError={true} text={`${props.executionResult.errorMessage}`} />)}
            {props.executionResult.response?.status === undefined
                ? (<></>)
                : (<TestInfo text={`Status: ${props.executionResult.response.status} ${props.executionResult.response.statusText}`} />)}
            {(props.executionResult.executedAt > 0)
                ? (<TestInfo text={`Exeucted At: ${props.executionResult.executedAt.toLocaleString()} ms`} />)
                : (<></>)}
            {(props.executionResult.milliseconds && props.executionResult.milliseconds > 0)
                ? (<TestInfo text={`Duration: ${props.executionResult.milliseconds.toLocaleString()} ms`} />)
                : (<></>)}
            {/* {props.tokenCached
                ? (<TestInfo text='OAuth bearer token retrieved from cache' />)
                : (<></>)} */}
        </Box>
        {
        props.executionResult.tests
            ? (props.executionResult.tests.map(test => (<TestResult 
                key={`test-${idx++}`} 
                name={test.testName} 
                success={test.success} 
                error={test.error} 
                logs={test.logs} />)))
            : (<></>)
        }
    </Box>)
}

const TestInfo = (props: { isError?: boolean, text: string }) =>
(
    <Stack direction='row'>
        <Stack direction='column' sx={{ marginLeft: '30px' }}>
            <Typography variant='h3' sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0, color: '#80000' }}>
                {
                    props.isError === true
                        ? (<Box color='#FF0000' sx={{ ":first-letter": { textTransform: 'capitalize'}, whiteSpace: 'pre-wrap' }}>{props.text}</Box>)
                        : (<>{props.text}</>)
                }
            </Typography>
        </Stack>
    </Stack>
)

const TestResult = (props: { name: string[], success: boolean, logs?: string[], error?: string }) =>
(
    <Stack direction='row'>
        <Box sx={{ width: '22px', marginRight: '8px' }}>
            {props.success ? (<CheckIcon color='success' />) : (<BlockIcon color='error' />)}
        </Box>
        <Stack direction='column'>
            <Typography variant='h3' sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0 }}>
                Test: {props.name.join(' ')}
            </Typography>
            {(props.error?.length ?? 0) > 0 ? (<Typography variant='h3'
                sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0, ":first-letter": { textTransform: 'capitalize'} }} color='error'>{props.error}</Typography>) : (<></>)}
            {(props.logs?.length ?? 0) > 0 ? (
                <Box sx={{ overflow: 'auto', marginTop: '10px', marginBottom: 0 }}>
                    <pre style={{ paddingTop: 0, marginTop: 0, whiteSpace: 'pre-line' }}>{props.logs?.join('\n')}</pre>
                </Box>
            ) : (<></>)}
        </Stack>
    </Stack>
)

export function ResultInfoViewer(props: {
    triggerCopyTextToClipboard: (text?: string) => void
}) {
    const executionResult = useSelector((state: WorkbookState) => state.selectedExecutionResult)
    const groupResults = useSelector((state: WorkbookState) => state.groupExecutionResults)

    if (!(executionResult || groupResults)) {
        return null
    }

    const copyResultToClipboard = () => {
        const text = beautify.js_beautify(JSON.stringify(executionResult), {})
        props.triggerCopyTextToClipboard(text)
    }

    const copyGroupResultsToClipboard = () => {
        const text = beautify.js_beautify(JSON.stringify(groupResults), {})
        props.triggerCopyTextToClipboard(text)
    }

    if (groupResults !== undefined) {
        // let cached = executionResult.response?.authTokenCached === true
        const allSucceeded = groupResults.requests.reduce((a, r) => a && r.success, true)
        return (
            <Box>
                <Typography variant='h2' sx={{ marginTop: 0 }}>
                    Group Execution {allSucceeded ? "Completed" : "Failed"}
                    <IconButton
                        aria-label="Copy Group Results to Clipboard"
                        title="Copy Group Results to Clipboard"
                        sx={{ marginLeft: '16px' }}
                        onClick={_ => copyGroupResultsToClipboard()}>
                        <ContentCopyIcon />
                    </IconButton>
                </Typography>
                {
                    groupResults.requests.map(request => (
                        <Box>
                            <ResultSummary executionResult={request} />
                        </Box>
                    ))
                }
            </Box>
        )
    } else if (executionResult !== undefined) {
        return (
            <Box>
                <Typography variant='h2' sx={{ marginTop: 0 }}>
                    Request Execution {executionResult.success ? "Completed" : "Failed"}
                    <IconButton
                        aria-label="Copy Results to Clipboard"
                        title="Copy Results to Clipboard"
                        sx={{ marginLeft: '16px' }}
                        onClick={_ => copyResultToClipboard()}>
                        <ContentCopyIcon />
                    </IconButton>
                </Typography>
                <ResultDetail executionResult={executionResult} />
            </Box >
        )
    } else {
        return <></>
    }
}
