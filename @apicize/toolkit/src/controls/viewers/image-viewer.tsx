import { Button } from "@mui/material"

export const KNOWN_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'bmp', 'tif', 'tiff']

export function ImageViewer(props: {
    base64ToRender: string | undefined,
    extensionToRender?: string
}) {
    if (props.base64ToRender && props.base64ToRender.length > 0 && props.extensionToRender && props.extensionToRender.length > 0) {
        const base64 = props.base64ToRender
        return (
            <>
                <img
                    src={`data:image/${props.extensionToRender};base64,${props.base64ToRender}`}
                    style={{
                        flexGrow: 1,
                        flexBasis: 0,
                        objectFit: 'scale-down',
                        overflow: 'auto',
                        objectPosition: 'left top',
                        marginTop: 0
                    }} />
            </>
        )
    } else {
        return null
    }

}
