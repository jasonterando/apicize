import { Box, Button, Typography } from "@mui/material"
import { useNavigationState } from "../../../contexts/navigation-state-context"
import { useExecution } from "../../../contexts/execution-context"

export function RequestRunProgress(props: { cancelRequest: (requestId: string) => void }) {
    const nav = useNavigationState()
    const executionCtx = useExecution()

    let running: boolean
    if (nav.activeExecutionId && nav.activeExecutionId.length > 0) {
        const execution = executionCtx.getExecutionInfo(nav.activeExecutionId)
        running = execution?.running ?? false
    } else {
        running = false
    }
    
    const handleCancel = () => {
        if (nav.activeExecutionId) props.cancelRequest(nav.activeExecutionId)
    }

    return running
        ? (
            <Box>
                <Typography variant='h2' sx={{ marginTop: 0 }}>Execution In Progress...</Typography>
                <Button variant='outlined' color='error' onClick={() => handleCancel()}>Cancel</Button>
            </Box>
        )
        : null
}

