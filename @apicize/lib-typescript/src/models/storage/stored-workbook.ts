import { WorkbookAuthorization } from '../workbook/workbook-authorization'
import { WorkbookScenario } from '../workbook/workbook-scenario'
import { WorkbookRequest } from '../workbook/workbook-request'
import { WorkbookRequestGroup } from '../workbook/workbook-request-group'
import { StoredWorkbookSettings } from './stored-workbook-settings'

/**
 * Format of workbooks persistently stored
 */
export interface StoredWorkbook {
    version: number
    requests: (WorkbookRequest | WorkbookRequestGroup)[],
    authorizations: WorkbookAuthorization[],
    scenarios: WorkbookScenario[],
    settings?: StoredWorkbookSettings
}