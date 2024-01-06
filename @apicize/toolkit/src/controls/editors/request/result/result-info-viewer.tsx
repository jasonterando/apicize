import { useSelector } from "react-redux"
import { WorkbookState } from "../../../../models/store"
import { Box } from "@mui/system"

export function ResultInfoViewer() {
    const result = useSelector((state: WorkbookState) => state.activeExecution?.result)
    if (! result) {
        return null
    }

    let testIndex = 0
    return (
        <Box>
            {((result.errorMessage?.length ?? 0) == 0) ? null : (<h3 className='result-fail'>{result.errorMessage}</h3>)}
            <ul>
                {result.response === undefined ? null : (<li key='result-status'>Status: {result.response.status} {result.response.statusText}</li>)}
                <li key='result-executed-at'>Exeucted At: {new Date(result.executedAt).toLocaleTimeString()}</li>
                {(result.milliseconds && result.milliseconds  > 0) ? (<li key='test-duration'>Duration: {result.milliseconds.toLocaleString()} ms</li>) : null}
            </ul>

            {(result.tests && result.tests.length > 0) ?
                (
                    <Box>
                        <ul>
                            {result.tests.map(test => {
                                let ctr = 0
                                const logs = (test.logs && test.logs.length > 0)
                                    ? (<div className='logs'>{test.logs.map(l => (<div key={`log-${ctr++}`}>{l}</div>))}</div>)
                                    : ''
                                return test.success
                                    ? (<li key={`test=${testIndex++}`} className='test-pass'><span className='indicator'>[PASS]</span> {test.testName.join(' ')}{logs}</li>)
                                    : (<li key={`test=${testIndex++}`} className='test-fail'><span className='indicator'>[FAIL]</span> {test.testName.join(' ')} ({test.error}){logs}</li>)
                            })}
                        </ul>

                    </Box>)
                : null}
        </Box>
    )
}

