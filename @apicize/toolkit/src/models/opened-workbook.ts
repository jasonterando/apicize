import { EditableWorkbookAuthorization } from "./workbook/editable-workbook-authorization";
import { EditableWorkbookScenario } from "./workbook/editable-workbook-scenario";
import { StateStorage } from "./state-storage";
import { EditableWorkbookRequestEntry } from "./workbook/editable-workbook-request-entry";

export interface OpenedWorkbook {
    displayName: string,
    fullName: string,
    requests: StateStorage<EditableWorkbookRequestEntry>,
    authorizations: StateStorage<EditableWorkbookAuthorization>,
    scenarios: StateStorage<EditableWorkbookScenario>
}