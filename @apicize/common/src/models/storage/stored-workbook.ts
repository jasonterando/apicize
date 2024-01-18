import { WorkbookBasicAuthorization, WorkbookOAuth2ClientAuthorization, WorkbookApiKeyAuthorization } from '../workbook/workbook-authorization'
import { WorkbookEnvironment } from '../workbook/workbook-environment'
import { WorkbookRequest } from '../workbook/workbook-request'
import { WorkbookRequestGroup } from '../workbook/workbook-request-group'
import { StoredWorkbookSettings } from './stored-workbook-settings'

/**
 * Format of workbooks persistently stored
 */
export interface StoredWorkbook {
    version: number
    requests: (WorkbookRequest | WorkbookRequestGroup)[],
    authorizations: (WorkbookBasicAuthorization | WorkbookOAuth2ClientAuthorization | WorkbookApiKeyAuthorization)[],
    environments: WorkbookEnvironment[],
    settings?: StoredWorkbookSettings
}
