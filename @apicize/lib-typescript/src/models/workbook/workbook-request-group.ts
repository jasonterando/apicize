import { Executable } from "../executable";
import { Identifiable } from "../identifiable";
import { Named } from "../named";
import { Selection } from "../selection";

export enum WorkbookGroupExecution {
    Sequential = "SEQUENTIAL",
    Concurrent= "CONCURRENT",
}

export interface WorkbookRequestGroup extends Identifiable, Named, Executable {
    execution: WorkbookGroupExecution
}