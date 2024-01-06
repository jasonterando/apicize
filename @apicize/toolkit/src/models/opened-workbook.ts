import { EditableWorkbookAuthorization } from "./workbook/editable-workbook-authorization";
import { EditableWorkbookEnvironment } from "./workbook/editable-workbook-environment";
import { EditableWorkbookRequestItem } from "./workbook/editable-workbook-request-item";
import { StateStorage } from "./state-storage";

export interface OpenedWorkbook {
    displayName: string,
    fullName: string,
    requests: StateStorage<EditableWorkbookRequestItem>,
    authorizations: StateStorage<EditableWorkbookAuthorization>,
    environments: StateStorage<EditableWorkbookEnvironment>
}