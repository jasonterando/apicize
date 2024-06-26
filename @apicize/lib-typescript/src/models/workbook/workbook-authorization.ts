import { Identifiable } from "../identifiable"

export const NO_AUTHORIZATION = '\0'

/**
 * Specifies the type of authorization used for a request
 */
export enum WorkbookAuthorizationType { None = 'none', Basic = 'Basic', OAuth2Client = 'OAuth2Client', ApiKey = 'ApiKey'};

// export interface WorkbookAuthorization extends Named {
//     type: WorkbookAuthorizationType
// }

export enum PersistenceOption { None = 'None', Workbook = 'Workbook', CommonEnvironment = 'Environment' }

/**
 * Specifies how to persist sensitive information
 */

export type WorkbookAuthorization = WorkbookBasicAuthorization | WorkbookOAuth2ClientAuthorization | WorkbookApiKeyAuthorization

export interface WorkbookAuthorizationBase extends Identifiable {
    name: string
    type: WorkbookAuthorizationType
    persistence: PersistenceOption
}

/**
 * Information required for basic authentication
 */
export interface WorkbookBasicAuthorization extends WorkbookAuthorizationBase {
    type: WorkbookAuthorizationType.Basic
    username: string
    password: string
}

/**
 * Information required for basic authentication
 */
export interface WorkbookOAuth2ClientAuthorization extends WorkbookAuthorizationBase {
    type: WorkbookAuthorizationType.OAuth2Client
    accessTokenUrl: string
    clientId: string
    clientSecret: string
    scope: string
    // sendCredentialsInBody: boolean
}

/**
 * Information required for API key authentication (passed in via header)
 */
export interface WorkbookApiKeyAuthorization extends WorkbookAuthorizationBase {
    type: WorkbookAuthorizationType.ApiKey
    header: string
    value: string
}