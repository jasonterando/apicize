import { useSelector } from "react-redux"
import { WorkbookState } from "../../../../models/store"
import { Box, Button, Typography } from "@mui/material"
import { EditableWorkbookRequest } from "../../../../models/workbook/editable-workbook-request"

export function RequestRunProgress(props: {cancelRequest: (request: EditableWorkbookRequest) => void}) {
    // const dispatch = useDispatch()

    const request = useSelector((state: WorkbookState) => state.activeRequest)
    if(! request) {
        return null
    }

    const handleCancel = (request: EditableWorkbookRequest) => {
        props.cancelRequest(request)
        // dispatch(setRequestRunning({ id: request.id, onOff: false }))
    }

    return (
        <Box>
            <Typography variant='h1'>Execution In Progress...</Typography>
            <Button variant='outlined' color='error' onClick={() => handleCancel(request)}>Cancel</Button>
        </Box>
    )
}

