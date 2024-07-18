import { Identifiable } from "../identifiable";
import { Named } from "../named";
import { Selection } from "../selection";

export enum WorkbookGroupExecution {
    Sequential = "SEQUENTIAL",
    Concurrent= "CONCURRENT",
}

export interface WorkbookRequestGroup extends Identifiable, Named {
    id: string
    runs: number
    execution: WorkbookGroupExecution
    selectedScenario?: Selection
    selectedAuthorization?: Selection
    selectedCertificate?: Selection
    selectedProxy?: Selection
}