import { WorkbookAuthorization } from '../workbook/workbook-authorization'
import { WorkbookEnvironment } from '../workbook/workbook-environment'
import { WorkbookRequest } from '../workbook/workbook-request'
import { WorkbookRequestGroup } from '../workbook/workbook-request-group'
import { StateStorage } from './state-storage'

export interface StoredWorkbook {
    version: number
    requests: StateStorage<WorkbookRequest | WorkbookRequestGroup>,
    authorizations: StateStorage<WorkbookAuthorization>,
    environments: StateStorage<WorkbookEnvironment>
}
