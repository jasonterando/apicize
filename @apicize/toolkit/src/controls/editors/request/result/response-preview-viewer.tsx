import { useSelector } from "react-redux"
import { ImageViewer, KNOWN_IMAGE_EXTENSIONS } from "../../../viewers/image-viewer";
import { TextViewer } from "../../../viewers/text-viewer";
import { WorkbookState } from "../../../../models/store";
import { Typography } from "@mui/material";
import { Box } from "@mui/system";

export function ResultResponsePreview() {
    const result = useSelector((state: WorkbookState) => state.selectedExecutionResult)
    if (!result) return null

    let extension = ''
    for (const [name, value] of Object.entries(result.response?.headers ?? {})) {
        if (name.toLowerCase() === 'content-type') {
            let i = value.indexOf('/')
            if (i !== -1) {
                let j = value.indexOf(';')
                extension = value.substring(i + 1, j == -1 ? undefined : j)
            }
        }
    }
    return (
        <Box>
            <Typography variant='h1'>Response Body (Preview)</Typography>
            {
            result.response?.body?.data && KNOWN_IMAGE_EXTENSIONS.indexOf(extension) !== -1
                ? (<ImageViewer base64ToRender={result.response?.body?.data} extensionToRender={extension} />)
                : (<TextViewer text={result.response?.body?.text} extension={extension} />)
            }
        </Box>
    )
}
