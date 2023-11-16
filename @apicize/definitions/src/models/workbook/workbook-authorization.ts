import { RequestAuthorizationData, RequestAuthorizationType } from '../authorization'
import { Identifiable } from '../identifiable'

export const NO_AUTHORIZATION = '\0'

export interface WorkbookAuthorization extends Identifiable {
    type: RequestAuthorizationType
    data?: RequestAuthorizationData
}