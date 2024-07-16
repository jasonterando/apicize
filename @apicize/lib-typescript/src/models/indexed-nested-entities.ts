import { Identifiable } from "./identifiable"
import { IndexedEntities } from "./indexed-entities"

/**
 * Indexed storage with hierchichal support
 */
export interface IndexedNestedRequests<T extends Identifiable> extends IndexedEntities<T> {
    /**
     * List of children (if any) for hierarchical ID
     */
    childIds?: { [id: string]: string[] }
}

/**
 * Find the parent, if any, of the specified ID
 * @param id 
 * @param storage 
 * @returns 
 */
export function findParentEntity<T extends Identifiable>(id: string | null, storage: IndexedNestedRequests<T>) {
    if (! id || ! storage.childIds) return null

    for(const [parentId, childIds] of Object.entries(storage.childIds)) {
        if (childIds.includes(id)) return storage.entities[parentId]
    }

    return null
}

/**
 * Utility to add a request to storage, optionally before the specified ID
 * @param id 
 * @param storage 
 * @returns 
 */
export function addNestedEntity<T extends Identifiable>(entity: T, storage: IndexedNestedRequests<T>, beforeId?: string | null) {
    storage.entities[entity.id] = entity
    if (beforeId) {
        let idx = storage.topLevelIds.indexOf(beforeId)
        if (idx !== -1) {
            storage.topLevelIds.splice(idx, 0, entity.id)
            return
        }

        if (storage.childIds) {
            for(const children of Object.values(storage.childIds)) {
                let idx = children.indexOf(beforeId)
                if (idx !== -1) {
                    children.splice(idx, 0, entity.id)
                    return
                }
            }
        }
    }
    storage.topLevelIds.push(entity.id)
}

/**
 * Utility to locate the specified ID in storage
 * @param id 
 * @param storage 
 * @returns 
 */
export function getNestedEntity<T extends Identifiable>(id: string, storage: IndexedNestedRequests<T>): T {
    const result = storage.entities[id]
    if (! result) {
        throw new Error(`Unable to find entry ID ${id}`)
    }
    return result
}

/**
 * Utility to locate the index and array of the specified ID in storage
 * @param id 
 * @param storage 
 * @returns 
 */
export function findNestedEntity<T extends Identifiable>(id: string, storage: IndexedNestedRequests<T>): [number, string[]] {
    let index = storage.topLevelIds.indexOf(id)
    if (index !== -1) {
        return [index, storage.topLevelIds]
    }
    if (storage.childIds) {
        for(const childList of Object.values(storage.childIds)) {
            index = childList.indexOf(id)
            if (index !== -1) {
                return [index, childList]
            }
        }
    }
    throw new Error(`Unable to find entry ID ${id}`)
}

/**
 * Utility to delete the specified ID in storage
 * @param id 
 * @param storage 
 * @returns 
 */
export function removeNestedEntity<T extends Identifiable>(id: string, storage: IndexedNestedRequests<T>): void {
    let found = false
    let idx = storage.topLevelIds.indexOf(id)
    if (idx !== -1) {
        storage.topLevelIds.splice(idx, 1)
        found = true
    } else {
        if (storage.childIds) {
            for (const children of Object.values(storage.childIds)) {
                idx = children.indexOf(id)
                if (idx !== -1) {
                    children.splice(idx, 1)
                    found = true
                }
            }
        }
    }

    if (storage.entities[id]) {
        delete storage.entities[id]
    }

    if (!found) {
        throw new Error(`Unable to find entry ID ${id}`)
    }
}

/**
 * Move an item ID to a different destination
 * @param id 
 * @param destinationID 
 * @param storage 
 */
export function moveNestedEntity<T extends Identifiable>(id: string,
    destinationID: string | null,
    onLowerHalf: boolean | null,
    onLeft: boolean | null,
    storage: IndexedNestedRequests<T>) {
    const [sourceIndex, sourceList] = findNestedEntity(id, storage)

    let destIndex: number
    let destList: string[]

    if (destinationID === null) {
        // If there is no destination ID, then we are moving to the top of the main index list
        destIndex = 0
        destList = storage.topLevelIds
    } else {
        [destIndex, destList] = findNestedEntity(destinationID, storage)
        const children = storage.childIds ? storage.childIds[destinationID] : undefined

        // If destination is a group, and on the left, then prepend to that group
        if (children && onLeft) {
            destIndex = 0
            destList = children
        } else {
            if (onLowerHalf) {
                destIndex++
            }
        }
    }

    if (destIndex === -1) {
        // Handle appends
        destList.push(id)
        sourceList.splice(sourceIndex, 1)
    } else if (sourceList === destList) {
        // Handle moving within the same list...
        destList.splice(destIndex, 0, id)
        if (sourceIndex < destIndex) {
            destList.splice(sourceIndex, 1)
        } else {
            destList.splice(sourceIndex + 1, 1)
        }
    } else {
        // Handle moving to a differnet list
        destList.splice(destIndex, 0, id)
        sourceList.splice(sourceIndex, 1)
    }
}
