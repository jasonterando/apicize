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

export function RequestTestEditor() {
  const dispatch = useDispatch()

  const requestEntry = useSelector((state: WorkbookState) => state.activeRequestEntry)
  const [test, setTest] = React.useState<string | undefined>(castEntryAsRequest(requestEntry)?.test)

  React.useEffect(() => {
    let test: string | undefined = undefined
    if (requestEntry) {
      test = castEntryAsRequest(requestEntry)?.test
    }
    setTest(test)
  }, [requestEntry])

  if (!requestEntry) {
    return null
  }

  const updateTest = React.useCallback((val: string | undefined) => {
    setTest(val)
    dispatch(updateRequest({
      id: requestEntry.id,
      test: val
    }))
  }, [])

  return (
    <Box sx={{
      border: '1px solid #444!important',
      borderRadius: '4px',
      overflow: 'auto'
    }}>
      <Editor
        autoFocus
        padding={10}
        style={{
          fontFamily: 'monospace',
          // minHeight: '200px',
          outline: 'none',
          maxHeight: '20vh',
          // borderTopStyle: 'solid !important',
          // borderBottomStyle: 'solid !important',
          // borderLeftStyle: 'solid !important',
          // borderRightStyle: 'solid !important'
        }}
        value={test?.toString() ?? ""}
        highlight={code => highlight(code, languages.javascript, 'javascript')}
        onValueChange={updateTest}
      />
    </Box>
  )
}
