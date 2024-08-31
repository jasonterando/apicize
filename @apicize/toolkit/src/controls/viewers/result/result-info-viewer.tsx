import { Box, Stack, SxProps } from "@mui/system"
import { IconButton, Typography } from "@mui/material"
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import beautify from "js-beautify";
import { useExecution, useWorkspace } from "../../../contexts/root.context";
import { WorkbookExecutionGroupSummary, WorkbookExecutionResult } from "../../../models/workbook/workbook-execution";
import { observer } from "mobx-react-lite";
import { EditableEntityType } from "../../../models/workbook/editable-entity-type";
import { WorkbookRequestEntry, WorkbookRequestType } from "@apicize/lib-typescript";
import { EditableWorkbookRequestEntry } from "../../../models/workbook/editable-workbook-request-entry";

const ResultSummary = (props: { summary: WorkbookExecutionGroupSummary, triggerCopyTextToClipboard: (text?: string) => void }) => {
    let idx = 0
    let title = `Group Execution ${props.summary.allTestsSucceeded ? "Completed" : "Failed"}`
    if (props.summary.milliseconds) {
        title += ` (${props.summary.milliseconds} ms)`
    }
    return (
        <Stack direction='column' sx={{ bottom: 0, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex' }}>
            <Typography variant='h2' sx={{ marginTop: 0 }} component='div'>
                {title}
                <IconButton
                    aria-label="Copy Group Results to Clipboard"
                    title="Copy Group Results to Clipboard"
                    sx={{ marginLeft: '16px' }}
                    onClick={_ => props.triggerCopyTextToClipboard(JSON.stringify(props.summary))}>
                    <ContentCopyIcon />
                </IconButton>
            </Typography>

            <Box key={`test-summary-${idx++}`}>
                {
                    props.summary.requests?.map(request => {
                        const subtitleParts: string[] = []
                        if (request.status) {
                            subtitleParts.push(`${request.status} ${request.statusText}`)
                        }
                        subtitleParts.push(`${request.milliseconds.toLocaleString()} ms`)
                        const title = `${request.requestName} (${subtitleParts.join(', ')})`
                        return (
                            <Box>
                                <Typography sx={{ marginTop: '0.5rem', marginBottom: '0.25rem', paddingTop: 0, color: '#80000' }} component='div'>
                                    {title}
                                </Typography>
                                {
                                    request.errorMessage
                                        ? (<TestInfo isError={true} text={`${request.errorMessage}`} />)
                                        : null
                                }
                                {
                                    request.tests
                                        ? (
                                            <Box>
                                                {
                                                    request.tests.map(test => (<TestResult
                                                        key={`test-${idx++}`}
                                                        name={test.testName}
                                                        success={test.success}
                                                        error={test.error}
                                                        logs={undefined} />))
                                                }
                                            </Box>
                                        )
                                        : null
                                }
                            </Box>
                        )
                    })
                }
            </Box>
        </Stack>
    )
}

const ResultDetail = (props: { result: WorkbookExecutionResult }) => {
    let idx = 0
    const executedAt = props.result.executedAt > 0 ? `${props.result.executedAt.toLocaleString()}` : '(Start)'
    return (<Box sx={{ marginBottom: '2rem' }}>
        <Box sx={{ marginBottom: '1rem' }}>
            {((props.result.errorMessage?.length ?? 0) == 0)
                ? (<></>)
                : (<TestInfo isError={true} text={`${props.result.errorMessage}`} />)}
            {props.result.response
                ? (<TestInfo text={`Status: ${props.result.response.status} ${props.result.response.statusText}`} />)
                : (<></>)}
            <TestInfo text={`Executed At: ${executedAt}`} />
            {(props.result.milliseconds && props.result.milliseconds > 0)
                ? (<TestInfo text={`Duration: ${props.result.milliseconds.toLocaleString()} ms`} />)
                : (<></>)}
            {/* {props.tokenCached
                ? (<TestInfo text='OAuth bearer token retrieved from cache' />)
                : (<></>)} */}
        </Box>
        {
            props.result.tests
                ? (props.result.tests.map(test => (<TestResult
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
                        ? (<Box color='#FF0000' sx={{ ":first-letter": { textTransform: 'capitalize' }, whiteSpace: 'pre-wrap' }}>{props.text}</Box>)
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
            <Typography sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0 }} component='div'>
                {props.name.join(' ')}
            </Typography>
            {(props.error?.length ?? 0) > 0 ? (<Typography
                sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0, ":first-letter": { textTransform: 'capitalize' } }} color='error'>{props.error}</Typography>) : (<></>)}
            {(props.logs?.length ?? 0) > 0 ? (
                <Box sx={{ overflow: 'auto', marginTop: '0.25rem', marginBottom: 0 }}>
                    <pre style={{ paddingTop: 0, marginTop: 0, whiteSpace: 'pre-line' }}>{props.logs?.join('\n')}</pre>
                </Box>
            ) : (<></>)}
        </Stack>
    </Stack>
)

export const ResultInfoViewer = (props: {
    requestOrGroupId: string, runIndex: number, resultIndex: number,
    triggerCopyTextToClipboard: (text?: string) => void
}) => {
    const workspaceCtx = useWorkspace()
    if (!workspaceCtx.active || workspaceCtx.active.entityType !== EditableEntityType.Request || !workspaceCtx.active.id) {
        return null
    }

    const request = workspaceCtx.active as EditableWorkbookRequestEntry


    const executionCtx = useExecution()

    const copyToClipboard = (data: any) => {
        const text = beautify.js_beautify(JSON.stringify(data), {})
        props.triggerCopyTextToClipboard(text)
    }

    if (request.type === WorkbookRequestType.Group && props.resultIndex === -1) {
        const summary = executionCtx.getExecutionGroupSummary(props.requestOrGroupId, props.runIndex)
        if (!summary) return null
        return (
            <ResultSummary summary={summary} triggerCopyTextToClipboard={copyToClipboard} />
        )
    }

    const result = executionCtx.getExecutionResult(props.requestOrGroupId, props.runIndex, props.resultIndex)
    if (!result) return null

    if (result) {
        return (
            <Box sx={{ position: 'relative', overflow: 'auto', boxSizing: 'border-box', width: '100%', height: '100%' }}>
                <Typography variant='h2' sx={{ marginTop: 0, flexGrow: 0 }} component='div'>
                    Request Execution {result.success ? "Completed" : "Failed"}
                    <IconButton
                        aria-label="Copy Results to Clipboard"
                        title="Copy Results to Clipboard"
                        sx={{ marginLeft: '1rem' }}
                        onClick={_ => copyToClipboard(result)}>
                        <ContentCopyIcon />
                    </IconButton>
                </Typography>
                <ResultDetail result={result} />
            </Box >
        )
    } else {
        return null
    }
}
