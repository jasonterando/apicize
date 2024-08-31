import { WorkspaceStore } from "./workspace.store";
import { WindowStore } from "./window.store";
import { ExecutionStore } from "./execution.store";

export class RootStore {
    constructor(
        public readonly workspace = new WorkspaceStore(this),
        public readonly window = new WindowStore(this),
        public readonly execution = new ExecutionStore(this),
    ) {
    }
}