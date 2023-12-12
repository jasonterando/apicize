import { useSelector } from "react-redux"
import { RootState } from "../../../../models/store"
import { TextViewer } from "../../../viewers/text-viewer"

export function ResultRequestViwer() {
    const result = useSelector((state: RootState) => state.activeResult)
    const request = result?.request
    if (! request) {
        return null
    }

    if (request.body && (!(typeof request.body === 'string'))) {
        request.body = '[Non-Text Body]'
    }
    return (<TextViewer text={JSON.stringify(request)} extension='json' />)
}
