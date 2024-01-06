import { useSelector } from "react-redux"
import { WorkbookState } from "../../../../models/store"
import { TextViewer } from "../../../viewers/text-viewer"

export function ResultRequestViwer() {
    const result = useSelector((state: WorkbookState) => state.activeExecution?.result)
    const request = result?.request
    if (! request) {
        return null
    }

    return (<TextViewer text={JSON.stringify(request)} extension='json' />)
}
