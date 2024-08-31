import { IndexedEntities } from "@apicize/lib-typescript/src/models/indexed-entities";
import { EditableWorkbookAuthorization, EditableWorkbookAuthorizationEntry } from "./editable-workbook-authorization";
import { EditableWorkbookProxy } from "./editable-workbook-proxy";
import { EditableWorkbookRequestEntry } from "./editable-workbook-request-entry";
import { EditableWorkbookScenario } from "./editable-workbook-scenario";
import { EditableWorkbookCertificate, EditableWorkbookCertificateEntry } from "./editable-workbook-certificate";
import { IndexedNestedRequests, Selection } from "@apicize/lib-typescript";

export interface EditableWorkspace {
    requests: IndexedNestedRequests<EditableWorkbookRequestEntry>,
    scenarios: IndexedEntities<EditableWorkbookScenario>,
    authorizations: IndexedEntities<EditableWorkbookAuthorization>,
    certificates: IndexedEntities<EditableWorkbookCertificate>,
    proxies: IndexedEntities<EditableWorkbookProxy>,
    selectedScenario: Selection,
    selectedAuthorization: Selection,
    selectedCertificate: Selection,
    selectedProxy: Selection,
}