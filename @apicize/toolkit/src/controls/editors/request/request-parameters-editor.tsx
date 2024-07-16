import { useSelector } from 'react-redux'
import { WorkbookState } from '../../../models/store'
import { useContext } from 'react'
import { WorkspaceContext } from '../../../contexts/workspace-context'
import { ParametersEditor } from '../parameters-editor'

export function RequestParametersEditor() {
  const activeType = useSelector((state: WorkbookState) => state.navigation.activeType)
  const activeId = useSelector((state: WorkbookState) => state.navigation.activeID)

  const context = useContext(WorkspaceContext).request
  
  if (! activeId) {
    return null
  }

  const onScenarioUpdate = (entityId: string) => {
    context.setSelectedScenarioId(activeId, entityId)
  }

  const onAuthorizationUpdate = (entityId: string) => {
    context.setSelectedAuthorizationId(activeId, entityId)
  }

  const onCertificateUpdate = (entityId: string) => {
    context.setSelectedCertificateId(activeId, entityId)
  }

  const onProxyUpdate = (entityId: string) => {
    context.setSelectedProxyId(activeId, entityId)
  }

  return (
    <ParametersEditor 
      onScenarioUpdate={onScenarioUpdate}
      onAuthorizationUpdate={onAuthorizationUpdate}
      onCertificateUpdate={onCertificateUpdate}
      onProxyUpdate={onProxyUpdate}
    />
  )
}