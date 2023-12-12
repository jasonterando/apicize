import { useSelector } from "react-redux"
import { ResultResponse } from "@apicize/definitions";
import { KNOWN_IMAGE_EXTENSIONS, ImageViewer } from "../../../viewers/image-viewer";
import { TextViewer } from "../../../viewers/text-viewer";
import { RootState } from "../../../../models/store";

export function ResultRawPreview() {
    const result = useSelector((state: RootState) => state.activeResult)
    if (! result) return null
    return (<TextViewer text={result.response?.text} extension='txt' />)
}
