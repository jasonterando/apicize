import { useSelector } from "react-redux";
import { WorkbookState } from "../../models/store";
import { Stack } from "@mui/system";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { EntitySelection } from "../../models/workbook/entity-selection";

export function ParametersEditor(props: {
    onScenarioUpdate: (id: string) => void,
    onAuthorizationUpdate: (id: string) => void,
    onCertificateUpdate: (id: string) => void,
    onProxyUpdate: (id: string) => void,
}) {
    const scenarios = useSelector((state: WorkbookState) => state.parameters.scenarios)
    const scenarioId = useSelector((state: WorkbookState) => state.parameters.scenarioId)
    const authorizations = useSelector((state: WorkbookState) => state.parameters.authorizations)
    const authorizationId = useSelector((state: WorkbookState) => state.parameters.authorizationId)
    const certificates = useSelector((state: WorkbookState) => state.parameters.certificates)
    const certificateId = useSelector((state: WorkbookState) => state.parameters.certificateId)
    const proxies = useSelector((state: WorkbookState) => state.parameters.proxies)
    const proxyId = useSelector((state: WorkbookState) => state.parameters.proxyId)

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
                    value={scenarioId}
                    onChange={(e) => props.onScenarioUpdate(e.target.value)}
                    fullWidth
                >
                    {itemsFromSelections(scenarios)}
                </Select>
            </FormControl>
            <FormControl>
                <InputLabel id='cred-auth-label'>Authorization</InputLabel>
                <Select
                    labelId='cred-auth-label'
                    id='cred-auth'
                    label='Authorization'
                    value={authorizationId}
                    onChange={(e) => props.onAuthorizationUpdate(e.target.value)}
                    fullWidth
                >
                    {itemsFromSelections(authorizations)}
                </Select>
            </FormControl>
            <FormControl>
                <InputLabel id='cred-cert-label'>Certificate</InputLabel>
                <Select
                    labelId='cred-cert-label'
                    id='cred-cert'
                    label='Certificate'
                    value={certificateId}
                    onChange={(e) => props.onCertificateUpdate(e.target.value)}
                    fullWidth
                >
                    {itemsFromSelections(certificates)}
                </Select>
            </FormControl>
            <FormControl>
                <InputLabel id='cred-proxy-label'>Proxy</InputLabel>
                <Select
                    labelId='cred-proxy-label'
                    id='cred-proxy'
                    label='Proxy'
                    value={proxyId}
                    onChange={(e) => props.onProxyUpdate(e.target.value)}
                    fullWidth
                >
                    {itemsFromSelections(proxies)}
                </Select>
            </FormControl>
        </Stack>
    )
}