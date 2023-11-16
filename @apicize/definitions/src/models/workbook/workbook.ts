import { Editable } from "../editable";
import { EditableWorkbookAuthorization } from "./editable/editable-workbook-authorization";
import { EditableWorkbookTest } from "./editable/editable-workbook-test";
import { WorkbookAuthorization } from "./workbook-authorization";
import { WorkbookTest } from "./workbook-test";

export interface Workbook {
    tests: WorkbookTest[]
    authorizations: WorkbookAuthorization[]
}

/**
 * Remove editable artifacts (dirty/invalid) from workbook entries
 * @param editableTest 
 * @param editableAuthorizations 
 */
export function EditableWorkbookToWorkbook(editableTests: EditableWorkbookTest[], editableAuthorizations: EditableWorkbookAuthorization[]): Workbook {
    const cleanUp = (entities: Editable[]) => {
        for(const entity of entities) {
            entity.dirty = undefined
            entity.invalid = undefined
        }
    }
    const tests = structuredClone(editableTests)
    const authorizations = structuredClone(editableAuthorizations)
    cleanUp(tests)
    cleanUp(authorizations)

    return {
        tests,
        authorizations
    }
}