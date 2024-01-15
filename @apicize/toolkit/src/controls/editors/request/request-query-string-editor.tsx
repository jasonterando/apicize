import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { WorkbookState, updateRequest } from '../../../models/store'
import { EditableNameValuePair } from '../../../models/workbook/editable-name-value-pair'
import { NameValueEditor } from '../name-value-editor'

export function RequestQueryStringEditor() {
  const dispatch = useDispatch()
  const request = useSelector((state: WorkbookState) => state.activeRequest)
  const [requestQueryString, setRequestQueryString] = React.useState(request?.queryStringParams)

  React.useEffect(() => {
    setRequestQueryString(request?.queryStringParams)
  }, [request])

  if (!request) {
    return null
  }

  const onUpdate = (data: EditableNameValuePair[]) => {
    setRequestQueryString(data)
    dispatch(updateRequest({
      id: request.id,
      queryString: data
    }))
  }

  return (
    <NameValueEditor values={requestQueryString} nameHeader='Parameter' valueHeader='Value' onUpdate={onUpdate} />
  )
}