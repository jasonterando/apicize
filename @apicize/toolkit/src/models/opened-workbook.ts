import { EditableWorkbookAuthorization } from "./workbook/editable-workbook-authorization";
import { EditableWorkbookEnvironment } from "./workbook/editable-workbook-environment";
import { StateStorage } from "./state-storage";
import { EditableWorkbookRequestEntry } from "./workbook/editable-workbook-request-entry";

export interface OpenedWorkbook {
    displayName: string,
    fullName: string,
    requests: StateStorage<EditableWorkbookRequestEntry>,
    authorizations: StateStorage<EditableWorkbookAuthorization>,
    environments: StateStorage<EditableWorkbookEnvironment>
}