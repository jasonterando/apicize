import { useSelector } from "react-redux"
import { TextViewer } from "../../../viewers/text-viewer";
import { WorkbookState } from "../../../../models/store";

export function ResultRawPreview() {
    const result = useSelector((state: WorkbookState) => state.activeExecution?.result)
    if (! result) return null
    return (<TextViewer text={result.response?.text} extension='txt' />)
}
