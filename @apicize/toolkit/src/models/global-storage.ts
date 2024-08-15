import { newEditableWorkspace } from "../services/apicize-serializer";
import { EditableWorkspace } from "./workbook/editable-workspace";
import { WorkbookExecution } from "./workbook/workbook-execution";

export interface GlobalStorageType {
    /**
     * Workspace representing all requests, scenarios, authorizations, certificates and proxies
     */
    workspace: EditableWorkspace,

    /**
     * Request executions underway or completed
     */
    requestExecutions: Map<string, WorkbookExecution>
}


export const GlobalStorage: GlobalStorageType = {
    workspace: newEditableWorkspace(),
    requestExecutions: new Map<string, WorkbookExecution>(),
}

