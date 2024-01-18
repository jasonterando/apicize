import { useSelector } from "react-redux"
import { WorkbookState } from "../../../../models/store"
import { TextViewer } from "../../../viewers/text-viewer"
import { Typography } from "@mui/material"
import { Box } from "@mui/system"

export function ResultRequestViwer() {
    const result = useSelector((state: WorkbookState) => state.selectedExecutionResult)
    const request = result?.request
    if (! request) {
        return null
    }

    return (
        <Box>
            <Typography variant='h1'>Request</Typography>
            <TextViewer text={JSON.stringify(request)} extension='json' />
        </Box>
    )
}
