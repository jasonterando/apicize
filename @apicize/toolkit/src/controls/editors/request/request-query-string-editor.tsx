import { WorkbookRequestType } from '@apicize/lib-typescript'
import { useWorkspace } from '../../../contexts/root.context'
import { NameValueEditor } from '../name-value-editor'
import { EditableEntityType } from '../../../models/workbook/editable-entity-type'
import { EditableWorkbookRequest, EditableWorkbookRequestEntry } from '../../../models/workbook/editable-workbook-request'
import { observer } from 'mobx-react-lite'

export const RequestQueryStringEditor = observer(() => {
  const workspace = useWorkspace()

  if (workspace.active?.entityType !== EditableEntityType.Request) {
    return null
  }

  const requestEntry = workspace.active as EditableWorkbookRequestEntry
  if (requestEntry.type !== WorkbookRequestType.Request) {
    return null
  }

  const request = requestEntry as EditableWorkbookRequest
  return (<NameValueEditor
    values={request.queryStringParams}
    nameHeader='Parameter'
    valueHeader='Value'
    onUpdate={workspace.setRequestQueryStringParams} />
  )
})