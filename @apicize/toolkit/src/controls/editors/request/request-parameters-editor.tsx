import { EntitySelection } from '../../../models/workbook/entity-selection'
import { MenuItem, FormControl, InputLabel, Select } from '@mui/material'
import { Stack } from '@mui/system'
import { DEFAULT_SELECTION_ID } from '../../../models/store'
import { EditableWorkbookRequest } from '../../../models/workbook/editable-workbook-request'
import { EditableEntityType } from '../../../models/workbook/editable-entity-type'
import { observer } from 'mobx-react-lite'
import { useWorkspace } from '../../../contexts/workspace.context'

export const RequestParametersEditor = observer(() => {
    const workspace = useWorkspace()

    if (workspace.active?.entityType !== EditableEntityType.Request && workspace.active?.entityType !== EditableEntityType.Group) {
        return null
    }

    const requestEntry = workspace.active as EditableWorkbookRequest

    let credIndex = 0
    const itemsFromSelections = (selections: EntitySelection[]) => {
        return selections.map(s => (
            <MenuItem key={`creds-${credIndex++}`} value={s.id}>{s.name}</MenuItem>
        ))
    }

    const lists = workspace.getRequestParameterLists()

    return (
        <Stack spacing={3}>
            <FormControl>
                <InputLabel id='cred-scenario-label'>Scenarios</InputLabel>
                <Select
                    labelId='cred-scenario-label'
                    id='cred-scenario'
                    label='Scenario'
                    value={requestEntry.selectedScenario?.id ?? DEFAULT_SELECTION_ID}
                    onChange={(e) => workspace.setRequestSelectedScenarioId(e.target.value)}
                    fullWidth
                >
                    {itemsFromSelections(lists.scenarios)}
                </Select>
            </FormControl>
            <FormControl>
                <InputLabel id='cred-auth-label'>Authorization</InputLabel>
                <Select
                    labelId='cred-auth-label'
                    id='cred-auth'
                    label='Authorization'
                    value={requestEntry.selectedAuthorization?.id ?? DEFAULT_SELECTION_ID}
                    onChange={(e) => workspace.setRequestSelectedAuthorizationId(e.target.value)}
                    fullWidth
                >
                    {itemsFromSelections(lists.authorizations)}
                </Select>
            </FormControl>
            <FormControl>
                <InputLabel id='cred-cert-label'>Certificate</InputLabel>
                <Select
                    labelId='cred-cert-label'
                    id='cred-cert'
                    label='Certificate'
                    value={requestEntry.selectedCertificate?.id ?? DEFAULT_SELECTION_ID}
                    onChange={(e) => workspace.setRequestSelectedCertificateId(e.target.value)}
                    fullWidth
                >
                    {itemsFromSelections(lists.certificates)}
                </Select>
            </FormControl>
            <FormControl>
                <InputLabel id='cred-proxy-label'>Proxy</InputLabel>
                <Select
                    labelId='cred-proxy-label'
                    id='cred-proxy'
                    label='Proxy'
                    value={requestEntry.selectedProxy?.id ?? DEFAULT_SELECTION_ID}
                    onChange={(e) => workspace.setRequestSelectedProxyId(e.target.value)}
                    fullWidth
                >
                    {itemsFromSelections(lists.proxies)}
                </Select>
            </FormControl>
        </Stack>
    )
})
