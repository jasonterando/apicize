import { useSelector } from "react-redux"
import { KNOWN_IMAGE_EXTENSIONS, ImageViewer } from "../../../viewers/image-viewer";
import { TextViewer } from "../../../viewers/text-viewer";
import { RootState } from "../../../../models/store";

export function ResultResponsePreview() {
    const result = useSelector((state: RootState) => state.activeResult)
    if (! result) return null
    return  (KNOWN_IMAGE_EXTENSIONS.indexOf(result.extension ?? '') === -1) 
        ? <TextViewer text={result.response?.text} extension={result.extension} />
        : <ImageViewer base64ToRender={result.response?.base64} extensionToRender={result.extension} />
}
