import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-tomorrow.css'
import AceEditor from "react-ace"
import "ace-builds/src-noconflict/mode-javascript"
import { useRequestEditor } from '../../../contexts/editors/request-editor-context'
// import { TextareaAutosize } from '@mui/material'

export function RequestTestEditor() {
  const requestCtx = useRequestEditor()

  return (
    <AceEditor
      mode='javascript'
      theme='monokai'
      fontSize='1rem'
      lineHeight='1rem'
      height='20em'
      width='100%'
      name='test-editor'
      showGutter={true}
      showPrintMargin={false}
      tabSize={3}
      onChange={(v) => requestCtx.changeTest(v)}
      setOptions={{
        useWorker: false,
        foldStyle: "markbegin",
        displayIndentGuides: true,
        enableAutoIndent: true,
        fixedWidthGutter: true,
        showLineNumbers: true,
      }}
      value={requestCtx.test} />

    // <TextareaAutosize
    //   autoFocus
    //   maxRows={20}
    //   style={{
    //     borderStyle: 'solid',
    //     borderWidth: '1px',
    //     borderLeftColor: '#444',
    //     borderRightColor: '#444',
    //     borderTopColor: '#444',
    //     borderBottomColor: '#444',
    //     borderRadius: '4px',
    //     fontFamily: 'monospace',
    //     outline: 'none',
    //     minHeight: '10vh',
    //     padding: '10px',
    //     minWidth: '100%',
    //     width: '100%',
    //     color: '#FFFFFF',
    //     backgroundColor: '#202020',
    //     overflow: 'auto'
    //   }}
    //   value={test}
    //   onChange={(e) => updateTest(e.target.value)} />
    // <Editor
    //   autoFocus
    //   padding={10}
    //   style={{
    //     fontFamily: 'monospace',
    //     // minHeight: '200px',
    //     outline: 'none',
    //     maxHeight: '20vh',
    //     // borderTopStyle: 'solid !important',
    //     // borderBottomStyle: 'solid !important',
    //     // borderLeftStyle: 'solid !important',
    //     // borderRightStyle: 'solid !important'
    //   }}
    //   value={test}
    //   highlight={code => highlight(code, languages.javascript, 'javascript')}
    //   onValueChange={updateTest}
    // />
  )
}
