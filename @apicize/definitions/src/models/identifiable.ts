export interface Identifiable {
    id: string
    name?: string
}

export function GetEditableTitle(entity: Identifiable) {
    return entity.name?.length ?? 0 > 0 ? entity.name : '(Unnamed)'
}
