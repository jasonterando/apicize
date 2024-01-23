import { Typography } from "@mui/material";
import { Grammar, highlight, languages } from 'prismjs'

export const MAX_TEXT_RENDER_LENGTH = 2 * 1024 * 1024

const FlexCodeViewer = (props: { text: string, grammar?: Grammar, language?: string }) => (
    <pre style={{
        overflow: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        paddingRight: '12px',
        marginTop: 0,
        fontSize: '10pt',
        whiteSpace: 'pre-wrap',
        lineBreak: 'anywhere'
    }}>
        {(props.grammar && props.language)
            ? (<code dangerouslySetInnerHTML={{
                __html: highlight(props.text, props.grammar, props.language)
            }} />)
            : (<code>{props.text}</code>)}
    </pre>)

export function TextViewer(props: { text?: string, extension?: string }) {
    const length = props.text?.length ?? 0
    if (! (props.text && length > 0)) {
        return null
    }

    let render = props.text
    if (length > MAX_TEXT_RENDER_LENGTH) {
        if (props.extension === 'txt') {
            render = render.substring(0, MAX_TEXT_RENDER_LENGTH) + '[...]'
        } else {
            return (<Typography variant='h3' style={{ marginTop: 0 }}>Sorry, the text length exceeds that which can be rendered</Typography>)
        }
    }

    switch (props.extension) {
        case 'html':
            return (<FlexCodeViewer text={render} grammar={languages.html} language='html' />)
        case 'css':
            return (<FlexCodeViewer text={render} grammar={languages.css} language='css' />)
        case 'js':
            return (<FlexCodeViewer text={render}  grammar={languages.javascript} language='javascript' />)
        case 'json':
            return (<FlexCodeViewer text={render}  grammar={languages.json} language='json' />)
        default:
            return (<FlexCodeViewer text={render} />)
    }
}
