import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, updateRequest } from '../../../models/store'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-tomorrow.css'

export function RequestTestEditor() {
  const dispatch = useDispatch()

  const request = useSelector((state: RootState) => state.activeRequest)
  const [test, setTest] = React.useState<string | undefined>(request?.test)

  React.useEffect(() => {
    setTest(request?.test)
  }, [request])

  if(! request) {
    return null
  }

  const updateTest = React.useCallback((val: string | undefined) => {
    setTest(val)
    dispatch(updateRequest({
      id: request.id,
      test: val
    }))
  }, [])

  return (
      <Editor
        autoFocus
        padding={10}
        className='code-editor'
        value={test?.toString() ?? ""}
        highlight={code => highlight(code, languages.javascript, 'javascript')}
        onValueChange={updateTest}
      />
  )
}
