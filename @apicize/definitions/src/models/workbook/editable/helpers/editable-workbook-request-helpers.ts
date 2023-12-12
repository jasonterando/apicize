import { StateStorage } from "../../../storage/state-storage";
import { EditableWorkbookRequest } from "../editable-workbook-request";
import { EditableWorkbookRequestGroup } from "../editable-workbook-request-group";

export type EditableWorkbookRequestItem = EditableWorkbookRequest | EditableWorkbookRequestGroup

/**
 * Detects the type of item (request or group)
 * @param item 
 * @returns typed tuple of cast item
 */
export function castRequestItem(item: EditableWorkbookRequest | EditableWorkbookRequestGroup):
    [request: EditableWorkbookRequest | undefined, group: EditableWorkbookRequestGroup | undefined] {
    const cast = item as EditableWorkbookRequest
    if (cast.url) {
        return [cast, undefined]
    } else {
        return [undefined, item as EditableWorkbookRequestGroup]
    }
}

/**
 * Adds an item to the collection.  If atID matches an existing item in the list,
 * the item will be inserted before that item.  If atID matches a group, the item
 * will be appended to the end of that group.  Otherwise, the item will be append
 * to the end of the main list
 * @param item 
 * @param beforeID
 * @returns 
 */
export function addRequestItem(requests: StateStorage<EditableWorkbookRequestItem>,
    item: EditableWorkbookRequestItem, asGroup: boolean, beforeID?: string) {

    // Add the new item to the entity list
    requests.entities[item.id] = item

    let append = true
    if (beforeID !== undefined) {
        // Check to see if we want to insert in a group
        if (requests.childIDs) {
            for (const parentID of Object.keys(requests.childIDs)) {
                const childList = requests.childIDs[parentID]
                if (beforeID === parentID) {
                    childList.push(item.id)
                    append = false
                    break
                } else {
                    const idx = childList.indexOf(beforeID)
                    if (idx !== -1) {
                        requests.allIDs.splice(idx, 0, item.id)
                        append = false
                        break
                    }
                }
            }
        }

        // Check to see if existing ID is at top level
        if (!append) {
            const idx = requests.allIDs.indexOf(beforeID)
            if (idx !== -1) {
                requests.allIDs.splice(idx, 0, item.id)
                append = false
            }
        }
    }

    if (append) {
        requests.allIDs.push(item.id)
    }

    if (asGroup) {
        if (!requests.childIDs) {
            requests.childIDs = {}
            requests.childIDs[item.id] = []
        } else {
            if (!requests.childIDs[item.id]) {
                requests.childIDs[item.id] = []
            }
        }
    }
}

/**
 * Delete the specified item from the store
 */
export function deleteRequestItem(requests: StateStorage<EditableWorkbookRequestItem>, id: string) {
    delete requests.entities[id]

    // Check to see if existing ID is at top level index
    const idx = requests.allIDs.indexOf(id)
    if (idx !== -1) {
        requests.allIDs.splice(idx, 1)
        return
    }

    // If not top level, check child indexes
    if (requests.childIDs) {
        for (const parentID of Object.keys(requests.childIDs)) {
            const childList = requests.childIDs[parentID]
            const idx = childList.indexOf(id)
            if (idx !== -1) {
                requests.allIDs.splice(idx, 1)
                return
            }
        }
    }
}
