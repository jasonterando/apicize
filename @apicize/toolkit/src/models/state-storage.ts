/**
 * State storage with sorted IDs
 */
export type StateStorage<T> = {
    /**
     * List of all entities (not in sorted or hierarchical order)
     */
    entities: { [id: string]: T },

    /**
     * Sorted list of IDs for top level IDs
     */
    topLevelIDs: string[]

    /**
     * List of children (if any) for hierarchical ID
     */
    childIDs?: { [id: string]: string[] }
}

/**
 * Utility to locate the specified ID in storage
 * @param id 
 * @param storage 
 * @returns 
 */
export function findInStorage<T>(id: string, storage: StateStorage<T>): [index: number, list: string[], item: T] {
    let idx = storage.topLevelIDs.indexOf(id)
    if (idx !== -1) {
        return [idx, storage.topLevelIDs, storage.entities[id]]
    }

    if (storage.childIDs !== undefined) {
        for (const [parentID, children] of Object.entries(storage.childIDs)) {
            idx = children.indexOf(id)
            if (idx !== -1) {
                return [idx, children, storage.entities[id]]
            }
        }
    }

    throw new Error(`Unable to find entry ID ${id}`)
}

/**
 * Move an item ID to a differnet destination
 * @param id 
 * @param destinationID 
 * @param storage 
 */
export function moveInStorage<T>(id: string, destinationID: string | null, storage: StateStorage<T>) {
    const [sourceIndex, sourceList] = findInStorage<T>(id, storage)

    let destIndex: number
    let destList: string[]

    if (destinationID === null) {
        // If there is no destination ID, then we are moving to the top of the main index list
        destIndex = 0
        destList = storage.topLevelIDs
    } else {
        [destIndex, destList] = findInStorage<T>(destinationID, storage)
        const children = storage.childIDs ? storage.childIDs[destinationID] : undefined
        console.log('Dropped on children', children)

        // If destination is a group, then prepend to that group
        if (children) {
            destIndex = 0
            destList = children
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

/**
 * Returns true if specified ID is a group
 * @param id 
 * @param storage 
 * @returns 
 */
export function isGroup(id: string, storage: StateStorage<unknown>) {
    return storage.childIDs && (storage.childIDs[id] !== undefined)
}