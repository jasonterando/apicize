import { Identifiable } from "@apicize/common";

/**
 * Interface to track a hierarchical entitiy
 */
export interface Hierarchical<T> extends Identifiable {
    children?: T[]
}
