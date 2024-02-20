import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { WorkbookState, updateRequest } from '../../../models/store'
import { EditableNameValuePair } from '../../../models/workbook/editable-name-value-pair'
import { NameValueEditor } from '../name-value-editor'
import { castEntryAsRequest } from '../../../models/workbook/helpers/editable-workbook-request-helpers'

export function RequestHeadersEditor() {
  const dispatch = useDispatch()
  const requestEntry = useSelector((state: WorkbookState) => state.activeRequestEntry)
  const [requestHeaders, setRequestHeaders] = React.useState(castEntryAsRequest(requestEntry)?.headers)

  React.useEffect(() => {
    setRequestHeaders(castEntryAsRequest(requestEntry)?.headers)
  }, [requestEntry])

  if (!requestEntry) {
    return null
  }

  const onUpdate = (data: EditableNameValuePair[]) => {
    setRequestHeaders(data)
    dispatch(updateRequest({
      id: requestEntry.id,
      headers: data
    }))
  }

  return (
    <NameValueEditor values={requestHeaders} nameHeader='Header' valueHeader='Value' onUpdate={onUpdate} />
  )
}