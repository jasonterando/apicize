import { useSelector } from "react-redux"
import { TextViewer } from "../../../viewers/text-viewer";
import { WorkbookState } from "../../../../models/store";
import { Typography } from "@mui/material";

export function ResultRawPreview() {
    const result = useSelector((state: WorkbookState) => state.activeExecution?.result)
    if (! result) return null
    let has_text = result.response?.body?.text !== undefined
    let preview = has_text ? result.response?.body?.text : result.response?.body?.data
    return has_text 
        ? (<TextViewer text={preview} extension='txt' />)
        : (<><Typography variant='h3' sx={{ marginTop: 0 }}>Base 64</Typography><TextViewer text={preview} extension='txt' /></>)
}
