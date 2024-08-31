import { EditableWorkbookAuthorizationEntry } from "./workbook/editable-workbook-authorization";
import { EditableWorkbookScenario } from "./workbook/editable-workbook-scenario";
import { IndexedEntities } from "@apicize/lib-typescript/src/models/indexed-entities";
import { EditableWorkbookRequestEntry } from "./workbook/editable-workbook-request-entry";

export interface OpenedWorkbook {
    displayName: string,
    fullName: string,
    requests: IndexedEntities<EditableWorkbookRequestEntry>,
    authorizations: IndexedEntities<EditableWorkbookAuthorizationEntry>,
    scenarios: IndexedEntities<EditableWorkbookScenario>
}