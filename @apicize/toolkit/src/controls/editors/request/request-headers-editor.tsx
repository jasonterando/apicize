import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { WorkbookState, updateRequest } from '../../../models/store'
import { EditableNameValuePair } from '../../../models/workbook/editable-name-value-pair'
import { NameValueEditor } from '../name-value-editor'

export function RequestHeadersEditor() {
  const dispatch = useDispatch()
  const request = useSelector((state: WorkbookState) => state.activeRequest)
  const [requestHeaders, setRequestHeaders] = React.useState(request?.headers)

  React.useEffect(() => {
    setRequestHeaders(request?.headers)
  }, [request])

  if (!request) {
    return null
  }

  const onUpdate = (data: EditableNameValuePair[]) => {
    setRequestHeaders(data)
    dispatch(updateRequest({
      id: request.id,
      headers: data
    }))
  }

  return (
    <NameValueEditor values={requestHeaders} nameHeader='Header' valueHeader='Value' onUpdate={onUpdate} />
  )
}