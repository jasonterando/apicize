import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { WorkbookState, updateRequest } from '../../../models/store'
import { EditableNameValuePair } from '../../../models/workbook/editable-name-value-pair'
import { NameValueEditor } from '../name-value-editor'
import { castEntryAsRequest } from '../../../models/workbook/helpers/editable-workbook-request-helpers'

export function RequestQueryStringEditor() {
  const dispatch = useDispatch()
  const requestEntry = useSelector((state: WorkbookState) => state.activeRequestEntry)
  const [requestQueryString, setRequestQueryString] = React.useState(castEntryAsRequest(requestEntry)?.queryStringParams)

  React.useEffect(() => {
    setRequestQueryString(castEntryAsRequest(requestEntry)?.queryStringParams)
  }, [requestEntry])

  if (!requestEntry) {
    return null
  }

  const onUpdate = (data: EditableNameValuePair[]) => {
    setRequestQueryString(data)
    dispatch(updateRequest({
      id: requestEntry.id,
      queryString: data
    }))
  }

  return (
    <NameValueEditor values={requestQueryString} nameHeader='Parameter' valueHeader='Value' onUpdate={onUpdate} />
  )
}