import { useSelector } from 'react-redux'
import { WorkbookState } from '../../../models/store'
import { EditableNameValuePair } from '../../../models/workbook/editable-name-value-pair'
import { NameValueEditor } from '../name-value-editor'
import { useContext } from 'react'
import { WorkbookStorageContext } from '../../../contexts/workbook-storage-context'

export function RequestQueryStringEditor() {
  const context = useContext(WorkbookStorageContext)
  const request = context.request
  const id = useSelector((state: WorkbookState) => state.request.id)
  const queryStringParams = useSelector((state: WorkbookState) => state.request.queryStringParams)

  if (! id) {
    return null
  }

  const onUpdate = (data: EditableNameValuePair[]) => {
    request.setQueryStringParams(id, data)
  }

  return (
    <NameValueEditor values={queryStringParams} nameHeader='Parameter' valueHeader='Value' onUpdate={onUpdate} />
  )
}