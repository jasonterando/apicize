import { Box, Button, Typography } from "@mui/material"
import { EditableEntityType } from "../../../models/workbook/editable-entity-type"
import { useWorkspace } from "../../../contexts/workspace.context"
import { ToastSeverity, useToast } from "../../../contexts/toast.context"

export function RequestRunProgress() {
    const workspace = useWorkspace()
    const toast = useToast()

    let running: boolean
    if (workspace.active?.entityType === EditableEntityType.Request) {
        running = workspace.getExecution(workspace.active.id)?.running ?? false
    } else {
        running = false
    }
    
    const handleCancel = async () => {
        if (workspace.activeExecutionId) {
            try {
                await workspace.cancelRequest(workspace.activeExecutionId)
                toast('Request cancelled', ToastSeverity.Success)
            } catch(e) {
                toast(`Unable to cancel request - ${e}`, ToastSeverity.Error)
            }
        }
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

