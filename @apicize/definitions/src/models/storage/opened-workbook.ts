import { EditableWorkbookAuthorization } from "../workbook/editable/editable-workbook-authorization";
import { EditableWorkbookEnvironment } from "../workbook/editable/editable-workbook-environment";
import { EditableWorkbookRequestItem } from "../workbook/editable/helpers/editable-workbook-request-helpers";
import { StateStorage } from "./state-storage";

export interface OpenedWorkbook {
    displayName: string,
    fullName: string,
    requests: StateStorage<EditableWorkbookRequestItem>,
    authorizations: StateStorage<EditableWorkbookAuthorization>,
    environments: StateStorage<EditableWorkbookEnvironment>
}