import { action, computed, makeObservable, observable } from "mobx";
import { RootStore } from "./root.store";

export class WindowStore {
    @observable accessor appName = 'Apicize'
    @observable accessor appVersion = ''
    @observable accessor workbookFullName = ''
    @observable accessor workbookDisplayName = '(New Workbook)'
    @observable accessor dirty: boolean = false
    @observable accessor invalidItems = new Set<string>()

    constructor(private readonly root: RootStore) {
        makeObservable(this)
    }

    @action
    changeApp(name: string, version: string) {
        this.appName = name
        this.appVersion = version
    }

    @action
    changeWorkbook(fullName: string, displayName: string) {
        this.workbookFullName = fullName
        this.workbookDisplayName = displayName
        this.dirty = false
    }

    @action
    changeDirty(onOff: boolean) {
        this.dirty = onOff
    }

    @action 
    clearInvalid() {
        this.invalidItems.clear()
    }

    @action
    changeInvalid(id: string, onOff: boolean) {
        if (onOff) {
            this.invalidItems.add(id)
        } else {
            this.invalidItems.delete(id)
        }
    }
}
