import { EditableWorkbookRequest } from "./editable-workbook-request"
import { EditableWorkbookRequestGroup } from "./editable-workbook-request-group"

export type EditableWorkbookRequestEntry = EditableWorkbookRequest | EditableWorkbookRequestGroup

export function castEntryAsRequest(entry: EditableWorkbookRequestEntry | null)  {
    if (! entry) return undefined
    const request = entry as EditableWorkbookRequest
    if (request.url !== undefined) {
        return request
    } else {
        return undefined
    }
}

export function castEntryAsGroup(entry: EditableWorkbookRequestEntry | null)  {
    if (! entry) return undefined
    const request = entry as EditableWorkbookRequest
    if (request.url === undefined) {
        return entry as EditableWorkbookRequestGroup
    } else {
        return undefined
    }
}
