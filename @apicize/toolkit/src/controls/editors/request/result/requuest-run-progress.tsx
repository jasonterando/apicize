import { useDispatch, useSelector } from "react-redux"
import { RootState, setRequestRunning } from "../../../../models/store"
import { Button } from "@mui/material"
import { Box } from "@mui/system"
import { CancelRequestsFunction, WorkbookRequest } from "@apicize/definitions"

export function RequestRunProgress(props: { cancelRequests: CancelRequestsFunction }) {
    const dispatch = useDispatch()

    const request = useSelector((state: RootState) => state.activeRequest)
    if(! request) {
        return null
    }

    const handleCancel = (request: WorkbookRequest) => {
        props.cancelRequests([request.id])
        dispatch(setRequestRunning({ id: request.id, onOff: false }))
    }

    return (
        <Box>
            <Button variant='outlined' color='error' onClick={() => handleCancel(request)}>Cancel</Button>
        </Box>
    )
}

