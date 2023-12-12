import { RequestAuthorizationData, RequestAuthorizationType } from '../request-authorization'
import { Identifiable } from '../identifiable'
import { EditableWorkbookAuthorization } from './editable/editable-workbook-authorization'

export const NO_AUTHORIZATION = '\0'

export interface WorkbookAuthorization extends Identifiable {
    type: RequestAuthorizationType
    data?: RequestAuthorizationData
}

