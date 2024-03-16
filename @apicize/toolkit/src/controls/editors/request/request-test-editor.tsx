import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { WorkbookState } from '../../../models/store'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-tomorrow.css'
import { castEntryAsRequest } from '../../../models/workbook/helpers/editable-workbook-request-helpers'
import { TextareaAutosize } from '@mui/material'
import { WorkbookStorageContext } from '../../../contexts/workbook-storage-context'

export function RequestTestEditor() {
  const request = React.useContext(WorkbookStorageContext).request
  const id = useSelector((state: WorkbookState) => state.request.id)
  const test = useSelector((state: WorkbookState) => state.request.test ?? '')

  if (!id) {
    return null
  }

  const updateTest = (val: string) => {
    request.setTest(id, val)
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
        minWidth: '100%',
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
