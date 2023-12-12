import { WorkbookRequest } from "../models/workbook/workbook-request";

/**
 * Interface for all authentication providers
 */
export interface AuthorizationProvider {
    Setup(request: WorkbookRequest): Promise<void>;
}