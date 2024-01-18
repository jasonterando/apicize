import { Identifiable } from "@apicize/common"

/**
 * Interface to track state of editable entity
 */
export interface Editable extends Identifiable {
    dirty?: boolean
    invalid?: boolean
}
