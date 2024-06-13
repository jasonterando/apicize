import { useSelector } from "react-redux"
import { WorkbookState } from "../../../models/store"
import { Box, Button, Typography } from "@mui/material"

export function RequestRunProgress(props: { cancelRequest: (requestId: string) => void }) {
    const executionId = useSelector((state: WorkbookState) => state.navigation.activeExecutionID)
    const running = useSelector((state: WorkbookState) => state.execution.running)
    useSelector((state: WorkbookState) => state.execution.resultIndex)
    useSelector((state: WorkbookState) => state.execution.runIndex)

    if (! (executionId && running)) {
        return null
    }

    const handleCancel = () => {
        if (executionId) props.cancelRequest(executionId)
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

