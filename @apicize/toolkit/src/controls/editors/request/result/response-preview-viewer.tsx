import { useSelector } from "react-redux"
import { KNOWN_IMAGE_EXTENSIONS, ImageViewer } from "../../../viewers/image-viewer";
import { TextViewer } from "../../../viewers/text-viewer";
import { WorkbookState } from "../../../../models/store";

export function ResultResponsePreview() {
    const result = useSelector((state: WorkbookState) => state.activeExecution?.result)
    if (! result) return null
    
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
    console.log('Response data', result.response?.body?.data)
    return  (result.response?.body?.data && KNOWN_IMAGE_EXTENSIONS.indexOf(extension) !== -1) 
        ? <ImageViewer base64ToRender={result.response?.body?.data} extensionToRender={extension} />
        : <TextViewer text={result.response?.body?.text} extension={extension} />
}
