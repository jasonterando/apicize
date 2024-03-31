import * as React from 'react'
import { useSelector } from 'react-redux'
import { WorkbookState } from '../../../models/store'
import { EditableNameValuePair } from '../../../models/workbook/editable-name-value-pair'
import { NameValueEditor } from '../name-value-editor'
import { useContext } from 'react'
import { WorkbookStorageContext } from '../../../contexts/workbook-storage-context'

export function RequestHeadersEditor() {
  const request = useContext(WorkbookStorageContext).request

  const id = useSelector((state: WorkbookState) => state.request.id)
  const headers = useSelector((state: WorkbookState) => state.request.headers)

  if (! id) {
    return null
  }

  const onUpdate = (data: EditableNameValuePair[]) => {
    request.setHeaders(id, data)
  }

  return (
    <NameValueEditor values={headers} nameHeader='Header' valueHeader='Value' onUpdate={onUpdate} />
  )
}