import { Persistence, WorkbookProxy } from "@apicize/lib-typescript"
import { Editable } from "../editable"
import { observable } from "mobx"
import { EditableEntityType } from "./editable-entity-type"

export class EditableWorkbookProxy extends Editable<WorkbookProxy> implements WorkbookProxy {
    public readonly entityType = EditableEntityType.Proxy
    @observable accessor persistence = Persistence.Private
    @observable accessor url = ''

    static fromWorkspace(entry: WorkbookProxy): EditableWorkbookProxy {
        const result = new EditableWorkbookProxy()
        result.id = entry.id
        result.name = entry.name ?? ''
        result.persistence = entry.persistence
        result.url = entry.url
        return result
    }

    toWorkspace(): WorkbookProxy {
        return {
            id: this.id,
            name: this.name,
            persistence: this.persistence,
            url: this.url
        }
    }
}
