import { useSelector } from "react-redux"
import { WorkbookState } from "../../../models/store"
import { Box, Button, Typography } from "@mui/material"
import { EditableWorkbookRequestEntry } from "../../../models/workbook/editable-workbook-request-entry"

export function RequestRunProgress(props: {cancelRequest: (request: EditableWorkbookRequestEntry) => void}) {
    // const dispatch = useDispatch()

    const requestEntry = useSelector((state: WorkbookState) => state.activeRequestEntry)
    if(! requestEntry) {
        return null
    }

    const handleCancel = (item: EditableWorkbookRequestEntry) => {
        props.cancelRequest(item)
    }

    return (
        <Box>
            <Typography variant='h2' sx={{marginTop: 0}}>Execution In Progress...</Typography>
            <Button variant='outlined' color='error' onClick={() => handleCancel(requestEntry)}>Cancel</Button>
        </Box>
    )
}

