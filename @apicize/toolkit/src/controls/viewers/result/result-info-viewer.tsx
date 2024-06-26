import { useSelector } from "react-redux"
import { WorkbookState } from "../../../models/store"
import { Box, Stack } from "@mui/system"
import { IconButton, Typography } from "@mui/material"
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import beautify from "js-beautify";
import { WorkbookStorageContext } from "../../../contexts/workbook-storage-context";
import { useContext } from "react";
import { ExecutionSummaryInfo } from "../../../models/workbook/execution-summary-info";

const ResultSummary = (props: { info: ExecutionSummaryInfo }) => {
    let idx = 0
    let info = []
    if (props.info.status) {
        info.push(`${props.info.status} ${props.info.statusText}`)
    }
    if (props.info.milliseconds && props.info.milliseconds > 0) {
        info.push(`${props.info.milliseconds.toLocaleString()} ms`)
    }
    return (<Box key={`test-summary-${idx++}`} sx={{marginBottom: '1rem'}}>
        <Typography sx={{ marginTop: 0, paddingTop: 0, color: '#80000' }}>
            {props.info.name} 
            <>
                {info.length === 0 ? '' : ` (${info.join(', ')})`}
            </>
        </Typography>
        {((props.info.errorMessage?.length ?? 0) == 0)
                ? (<></>)
                : (<TestInfo isError={true} text={`${props.info.errorMessage}`} />)}
        {
        props.info.tests
            ? (
                <Box sx={{marginTop: '1rem'}}>
                    {
                    props.info.tests.map(test => (<TestResult 
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

const ResultDetail = (props: { info: ExecutionSummaryInfo }) => {
    let idx = 0
    return (<Box sx={{marginBottom: '2rem'}}>
        <Box sx={{ marginBottom: '1rem' }}>
            {((props.info.errorMessage?.length ?? 0) == 0)
                ? (<></>)
                : (<TestInfo isError={true} text={`${props.info.errorMessage}`} />)}
            {props.info.status === undefined
                ? (<></>)
                : (<TestInfo text={`Status: ${props.info.status} ${props.info.statusText}`} />)}
            {(props.info.executedAt > 0)
                ? (<TestInfo text={`Exeucted At: ${props.info.executedAt.toLocaleString()} ms`} />)
                : (<></>)}
            {(props.info.milliseconds && props.info.milliseconds > 0)
                ? (<TestInfo text={`Duration: ${props.info.milliseconds.toLocaleString()} ms`} />)
                : (<></>)}
            {/* {props.tokenCached
                ? (<TestInfo text='OAuth bearer token retrieved from cache' />)
                : (<></>)} */}
        </Box>
        {
        props.info.tests
            ? (props.info.tests.map(test => (<TestResult 
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
        <Stack direction='column' sx={{ marginLeft: '0rem' }}>
            <Box sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0, color: '#80000' }}>
                {
                    props.isError === true
                        ? (<Box color='#FF0000' sx={{ ":first-letter": { textTransform: 'capitalize'}, whiteSpace: 'pre-wrap' }}>{props.text}</Box>)
                        : (<>{props.text}</>)
                }
            </Box>
        </Stack>
    </Stack>
)

const TestResult = (props: { name: string[], success: boolean, logs?: string[], error?: string }) =>
(
    <Stack direction='row'>
        <Box sx={{ width: '1.5rem', marginRight: '0.5rem' }}>
            {props.success ? (<CheckIcon color='success' />) : (<BlockIcon color='error' />)}
        </Box>
        <Stack direction='column'>
            <Typography sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0 }}>
                Test: {props.name.join(' ')}
            </Typography>
            {(props.error?.length ?? 0) > 0 ? (<Typography 
                sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0, ":first-letter": { textTransform: 'capitalize'} }} color='error'>{props.error}</Typography>) : (<></>)}
            {(props.logs?.length ?? 0) > 0 ? (
                <Box sx={{ overflow: 'auto', marginTop: '0.25rem', marginBottom: 0 }}>
                    <pre style={{ paddingTop: 0, marginTop: 0, whiteSpace: 'pre-line' }}>{props.logs?.join('\n')}</pre>
                </Box>
            ) : (<></>)}
        </Stack>
    </Stack>
)

export function ResultInfoViewer(props: {
    triggerCopyTextToClipboard: (text?: string) => void
}) {
    const executionId = useSelector((state: WorkbookState) => state.navigation.activeExecutionID)
    if (! executionId) {
        return null
    }

    const execution = useContext(WorkbookStorageContext).execution
    const summary = execution.getSummary(executionId)
    
    const copyToClipboard = (data: any) => {
        const text = beautify.js_beautify(JSON.stringify(data), {})
        props.triggerCopyTextToClipboard(text)
    }

    if (Array.isArray(summary)) {
        // let cached = executionResult.response?.authTokenCached === true
        const allSucceeded = summary.reduce((a, r) => a && r.success, true)
        let idx = 0
        return (
            <Box>
                <Typography variant='h2' sx={{ marginTop: 0 }}>
                    Group Execution {allSucceeded ? "Completed" : "Failed"}
                    <IconButton
                        aria-label="Copy Group Results to Clipboard"
                        title="Copy Group Results to Clipboard"
                        sx={{ marginLeft: '16px' }}
                        onClick={_ => copyToClipboard(summary)}>
                        <ContentCopyIcon />
                    </IconButton>
                </Typography>
                {
                    summary.map(request => (
                        <Box key={`test-grp-${idx++}`}>
                            <ResultSummary info={request} />
                        </Box>
                    ))
                }
            </Box>
        )
    } else if (summary) {
        return (
            <Box>
                <Typography variant='h2' sx={{ marginTop: 0 }}>
                    Request Execution {summary.success ? "Completed" : "Failed"}
                    <IconButton
                        aria-label="Copy Results to Clipboard"
                        title="Copy Results to Clipboard"
                        sx={{ marginLeft: '1rem' }}
                        onClick={_ => copyToClipboard(summary)}>
                        <ContentCopyIcon />
                    </IconButton>
                </Typography>
                <ResultDetail info={summary} />
            </Box >
        )
    } else {
        return <></>
    }
}
