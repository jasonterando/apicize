import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { WorkbookState, updateRequest } from '../../../models/store'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-tomorrow.css'
import { castEntryAsRequest } from '../../../models/workbook/helpers/editable-workbook-request-helpers'
import { Box } from '@mui/system'
import { TextareaAutosize } from '@mui/material'

export function RequestTestEditor() {
  const dispatch = useDispatch()
  const requestEntry = useSelector((state: WorkbookState) => state.activeRequestEntry)
  const [test, setTest] = React.useState<string>(castEntryAsRequest(requestEntry)?.test ?? '')

  React.useEffect(() => {
    setTest(castEntryAsRequest(requestEntry)?.test ?? '')
  }, [requestEntry])

  if (!requestEntry) {
    return null
  }

  const updateTest = (val: string) => {
    setTest(val)
    dispatch(updateRequest({
      id: requestEntry.id,
      test: val
    }))
  }

  return (
    <TextareaAutosize
      autoFocus
      maxRows={20}
      style={{
        borderStyle: 'solid',
        borderWidth: '1px',
        borderLeftColor: '#444',
        borderRightColor: '#444',
        borderTopColor: '#444',
        borderBottomColor: '#444',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '12pt',
        outline: 'none',
        minHeight: '10vh',
        padding: '10px',
        width: '100%',
        color: '#FFFFFF',
        backgroundColor: '#202020',
        overflow: 'auto'
      }}
      value={test}
      onChange={(e) => updateTest(e.target.value)} />
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
