/**
 * Interface that expresses how we identify things (name)
 */
export interface Identifiable {
    id: string
    name?: string
}

/**
 * Get an entity's name
 * @param entity Identifiable entity
 * @returns Name if set or "(Unnamed)" if not set
 */
export function GetEditableTitle(entity: Identifiable): string {
    return (entity.name && entity.name.length  > 0) ? entity.name : '(Unnamed)'
}
