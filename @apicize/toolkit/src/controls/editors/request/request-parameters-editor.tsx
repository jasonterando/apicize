import { useEffect, useState } from 'react'
import { useRequestEditor } from '../../../contexts/editors/request-editor-context'
import { EntitySelection } from '../../../models/workbook/entity-selection'
import { MenuItem, FormControl, InputLabel, Select } from '@mui/material'
import { Stack } from '@mui/system'

export function RequestParametersEditor() {
  const requestEditorCtx = useRequestEditor()

  let credIndex = 0
  const itemsFromSelections = (selections: EntitySelection[]) => {
      return selections.map(s => (
          <MenuItem key={`creds-${credIndex++}`} value={s.id}>{s.name}</MenuItem>
      ))
  }

  return (
      <Stack spacing={3}>
          <FormControl>
              <InputLabel id='cred-scenario-label'>Scenarios</InputLabel>
              <Select
                  labelId='cred-scenario-label'
                  id='cred-scenario'
                  label='Scenario'
                  value={requestEditorCtx.selectedScenarioId}
                  onChange={(e) => requestEditorCtx.changeSelectedScenarioId(e.target.value)}
                  fullWidth
              >
                  {itemsFromSelections(requestEditorCtx.scenarios)}
              </Select>
          </FormControl>
          <FormControl>
              <InputLabel id='cred-auth-label'>Authorization</InputLabel>
              <Select
                  labelId='cred-auth-label'
                  id='cred-auth'
                  label='Authorization'
                  value={requestEditorCtx.selectedAuthorizationId}
                  onChange={(e) => requestEditorCtx.changeSelectedAuthorizationId(e.target.value)}
                  fullWidth
              >
                  {itemsFromSelections(requestEditorCtx.authorizations)}
              </Select>
          </FormControl>
          <FormControl>
              <InputLabel id='cred-cert-label'>Certificate</InputLabel>
              <Select
                  labelId='cred-cert-label'
                  id='cred-cert'
                  label='Certificate'
                  value={requestEditorCtx.selectedCertificateId}
                  onChange={(e) => requestEditorCtx.changeSelectedCertificateId(e.target.value)}
                  fullWidth
              >
                  {itemsFromSelections(requestEditorCtx.certificates)}
              </Select>
          </FormControl>
          <FormControl>
              <InputLabel id='cred-proxy-label'>Proxy</InputLabel>
              <Select
                  labelId='cred-proxy-label'
                  id='cred-proxy'
                  label='Proxy'
                  value={requestEditorCtx.selectedProxyId}
                  onChange={(e) => requestEditorCtx.changeSelectedProxyId(e.target.value)}
                  fullWidth
              >
                  {itemsFromSelections(requestEditorCtx.proxies)}
              </Select>
          </FormControl>
      </Stack>
  )
}