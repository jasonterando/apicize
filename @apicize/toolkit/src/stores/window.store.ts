import { action, makeObservable, observable } from "mobx";
import { RootStore } from "./root.store";

export class WindowStore {
    @observable accessor appName = 'Apicize'
    @observable accessor appVersion = ''
    @observable accessor workbookFullName = ''
    @observable accessor workbookDisplayName = '(New Workbook)'
    @observable accessor dirty: boolean = false

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

    @action changeDirty(onOff: boolean) {
        this.dirty = onOff
    }
}
