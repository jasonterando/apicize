import { Identifiable } from "@apicize/lib-typescript"

/**
 * Interface to track state of editable entity
 */
export interface Editable extends Identifiable {
    dirty?: boolean
    invalid?: boolean
}
