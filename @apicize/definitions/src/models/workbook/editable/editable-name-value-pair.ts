import { NameValuePair } from "../workbook-request";

/**
 * Used for editing headers, query string parameters, etc.
 */
export interface EditableNameValuePair extends NameValuePair {
    id: string;
    isNew?: boolean;
}