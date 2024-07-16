import { Identifiable } from "../identifiable";
import { Named } from "../named";
import { Selection } from "../selection";

export interface WorkbookRequestGroup extends Identifiable, Named {
    id: string
    runs: number
    selectedScenario?: Selection
    selectedAuthorization?: Selection
    selectedCertificate?: Selection
    selectedProxy?: Selection
}