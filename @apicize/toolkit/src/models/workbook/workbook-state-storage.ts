import { StateStorage } from "../state-storage";
import { EditableWorkbookAuthorization } from "./editable-workbook-authorization";
import { EditableWorkbookRequestEntry } from "./editable-workbook-request-entry";
import { EditableWorkbookScenario } from "./editable-workbook-scenario";

export interface WorkbookStateStorage {
    requests: StateStorage<EditableWorkbookRequestEntry>,
    authorizations: StateStorage<EditableWorkbookAuthorization>,
    scenarios: StateStorage<EditableWorkbookScenario>,
    selectedAuthorizationID: string,
    selectedScenarioID: string,
}