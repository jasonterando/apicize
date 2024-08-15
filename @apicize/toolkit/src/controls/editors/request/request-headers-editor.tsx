import { NameValueEditor } from '../name-value-editor'
import { useRequestEditor } from '../../../contexts/editors/request-editor-context'

export function RequestHeadersEditor() {
  const requestCtx = useRequestEditor()

  return (
    <NameValueEditor
      values={requestCtx.headers}
      nameHeader='Header'
      valueHeader='Value'
      onUpdate={requestCtx.changeHeaders} />
  )
}