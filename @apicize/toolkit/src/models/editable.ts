/**
 * Interface to track state of editable entity
 */
export interface Editable {
    id: string
    dirty?: boolean
    invalid?: boolean
}
