import { Box, Button, Typography } from "@mui/material"
import { useExecution, useWorkspace } from "../../../contexts/root.context"
import { EditableEntityType } from "../../../models/workbook/editable-entity-type"

export function RequestRunProgress(props: { cancelRequest: (requestId: string) => void }) {
    const workbook = useWorkspace()
    const execution = useExecution()

    let running: boolean
    if (workbook.active?.entityType === EditableEntityType.Request) {
        running = execution.getExecution(workbook.active.id)?.running ?? false
    } else {
        running = false
    }
    
    const handleCancel = () => {
        if (workbook.activeExecutionId) props.cancelRequest(workbook.activeExecutionId)
    }

    return running
        ? (
            <Box>
                <Typography variant='h2' sx={{ marginTop: 0 }} component='div'>Execution In Progress...</Typography>
                <Button variant='outlined' color='error' onClick={() => handleCancel()}>Cancel</Button>
            </Box>
        )
        : null
}

