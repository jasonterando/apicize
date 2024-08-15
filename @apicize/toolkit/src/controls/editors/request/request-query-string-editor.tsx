import { NameValueEditor } from '../name-value-editor'
import { useRequestEditor } from '../../../contexts/editors/request-editor-context'

export function RequestQueryStringEditor() {
  const requestCtx = useRequestEditor()
  return (
    <NameValueEditor
      values={requestCtx.queryStringParams}
      nameHeader='Parameter'
      valueHeader='Value'
      onUpdate={requestCtx.changeQueryStringParams} />
  )
}