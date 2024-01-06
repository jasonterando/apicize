import { useDispatch, useSelector } from "react-redux"
import { WorkbookState, setRequestRunning } from "../../../../models/store"
import { Button } from "@mui/material"
import { Box } from "@mui/system"
import { EditableWorkbookRequest } from "../../../../models/workbook/editable-workbook-request"

export function RequestRunProgress() {
    const dispatch = useDispatch()

    const request = useSelector((state: WorkbookState) => state.activeRequest)
    if(! request) {
        return null
    }

    const handleCancel = (request: EditableWorkbookRequest) => {
        throw new Error('Cancel test not implemented');
        // props.cancelRequests([request.id])
        // dispatch(setRequestRunning({ id: request.id, onOff: false }))
    }

    return (
        <Box>
            <Button variant='outlined' color='error' onClick={() => handleCancel(request)}>Cancel</Button>
        </Box>
    )
}

