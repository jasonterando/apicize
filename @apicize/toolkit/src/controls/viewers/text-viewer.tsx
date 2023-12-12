import beautify from "js-beautify";
import { highlight, languages } from 'prismjs'

export const MAX_TEXT_RENDER_LENGTH = 2 * 1024 * 1024

export function TextViewer(props: { text?: string, extension?: string }) {
    const length = props.text?.length ?? 0
    if (! (props.text && length > 0)) {
        return null
    }

    let render = props.text
    if (length > MAX_TEXT_RENDER_LENGTH) {
        if (props.extension === 'txt') {
            render = render.substring(0, MAX_TEXT_RENDER_LENGTH)
        } else {
            return (<h3 style={{ marginTop: 0 }}>Sorry, the text length exceeds that which can be rendered</h3>)
        }
    }

    switch (props.extension) {
        case 'html':
            const html = beautify.html_beautify(render, {})
            return (<pre className='flex-code-viewer'><code dangerouslySetInnerHTML={{
                __html: highlight(html, languages.html, 'html')
            }} /></pre>)

        case 'css':
            const css = beautify.css_beautify(render, {})
            return (<pre className='flex-code-viewer'><code dangerouslySetInnerHTML={{
                __html: highlight(css, languages.css, 'css')
            }} /></pre>)

        case 'js':
            const javascript = beautify.js_beautify(render, {})
            return (<pre className='flex-code-viewer'><code dangerouslySetInnerHTML={{
                __html: highlight(javascript, languages.javascript, 'javascript')
            }} /></pre>)
            
        case 'json':
            const json = beautify.js_beautify(render)
            return (<pre className='flex-code-viewer'><code dangerouslySetInnerHTML={{
                __html: highlight(json, languages.json, 'json')
            }} /></pre>)

        default:
            return (<pre className='flex-code-viewer'>{render}</pre>)
    }
}
