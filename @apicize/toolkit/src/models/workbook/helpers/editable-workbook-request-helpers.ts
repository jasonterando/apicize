import { Editable } from "../../editable";
import { StateStorage } from "../../state-storage";
import { EditableWorkbookAuthorization } from "../editable-workbook-authorization";
import { EditableWorkbookRequest } from "../editable-workbook-request";
import { EditableWorkbookRequestEntry } from "../editable-workbook-request-entry";
import { EditableWorkbookRequestGroup } from "../editable-workbook-request-group";
import { EditableWorkbookScenario } from "../editable-workbook-scenario";

/**
 * Detects the type of item (request or group)
 * @param entry 
 * @returns typed tuple of cast item
 */
export function xxxcastRequestEntry(entry: EditableWorkbookRequestEntry):
    [request: EditableWorkbookRequest | undefined, group: EditableWorkbookRequestGroup | undefined] {
    const cast = entry as EditableWorkbookRequest
    if (cast.url) {
        return [cast, undefined]
    } else {
        return [undefined, entry as EditableWorkbookRequestGroup]
    }
}

/**
 * If entry is determined to be a request, by presence of a url property, return the cast request
 * @param entry 
 * @returns EditableWorkbookRequest if a request, otherwise undefined
 */
export function castEntryAsRequest(entry: EditableWorkbookRequestEntry | null): EditableWorkbookRequest | null {
    if (!entry) return null
    const cast = entry as EditableWorkbookRequest
    return cast.url === undefined ? null : cast
}

/**
 * If entry is determined to be a group, by absence of a url property, return the cast request
 * @param entry 
 * @returns EditableWorkbookRequestGroup if a group, otherwise undefined
 */
export function castEntryAsGroup(entry: EditableWorkbookRequestEntry | null): EditableWorkbookRequestGroup | null {
    if (!entry) return null
    const cast = entry as EditableWorkbookRequest
    return cast.url ? null : entry as EditableWorkbookRequestGroup
}

/**
 * Adds an item to the collection.  If atID matches an existing item in the list,
 * the item will be inserted before that item.  If atID matches a group, the item
 * will be appended to the end of that group.  Otherwise, the item will be append
 * to the end of the main list
 * @param entry 
 * @param targetId
 * @returns 
 */
export function addRequestEntryToStore(requests: StateStorage<EditableWorkbookRequestEntry>,
    entry: EditableWorkbookRequestEntry, asGroup: boolean, targetId?: string | null) {

    // Add the new item to the entity list
    requests.entities[entry.id] = entry

    if (asGroup) {
        if (!requests.childIDs) requests.childIDs = {}
        requests.childIDs[entry.id] = []
    }

    if (targetId) {
        // If the entry is a request and target is a group, then insert at top of group
        if (requests.childIDs && requests.childIDs[targetId]) {
            requests.childIDs[targetId].splice(0, 0, entry.id)
            return
        }

        // If the target ID is within a group, insert new entry after it
        if (requests.childIDs) {
            for (const [parentID, childIDs] of Object.entries(requests.childIDs)) {
                const idx = childIDs.indexOf(targetId)
                if (idx !== -1) {
                    if (idx === childIDs.length - 1) {
                        childIDs.push(entry.id)
                    } else {
                        childIDs.splice(idx + 1, 0, entry.id)
                    }
                    return
                }
            }
        }

        // If the target ID is in the top level list, insert after  it
        const idx = requests.topLevelIDs.indexOf(targetId)
        if (idx !== -1) {
            if (idx === requests.topLevelIDs.length - 1) {
                requests.topLevelIDs.push(entry.id)
            } else {
                requests.topLevelIDs.splice(idx + 1, 0, entry.id)
            }
            return
        }
    }

    // If no valid target ID, insert at top of topLevel list
    requests.topLevelIDs.splice(0, 0, entry.id)
}

/**
 * Add entry to top-level (non-hierarchical) store
 * @param store 
 * @param entry 
 * @param targetId 
 */
export function addTopLevelEntryToStore(store: StateStorage<Editable>,
    entity: Editable, targetId?: string | null) {
    store.entities[entity.id] = entity
    let idx
    if (targetId) {
        idx = store.topLevelIDs.indexOf(targetId)
        if (idx === store.topLevelIDs.length - 1) {
            idx = -1
        } else {
            idx++
        }
    } else {
        idx = -1
    }
    if (idx === -1) {
        store.topLevelIDs.push(entity.id)
    } else {
        store.topLevelIDs.splice(idx, 0, entity.id)
    }
}

/**
 * Delete the specified item from the store
 */
export function deleteRequestEntryFromStore(requests: StateStorage<EditableWorkbookRequestEntry>, id: string) {
    delete requests.entities[id]

    // Check to see if existing ID is at top level index
    const idx = requests.topLevelIDs.indexOf(id)
    if (idx !== -1) {
        requests.topLevelIDs.splice(idx, 1)
        return
    }

    // If not top level, check child indexes
    if (requests.childIDs) {
        for (const parentID of Object.keys(requests.childIDs)) {
            const childList = requests.childIDs[parentID]
            const idx = childList.indexOf(id)
            if (idx !== -1) {
                childList.splice(idx, 1)
                return
            }
        }
    }
}
