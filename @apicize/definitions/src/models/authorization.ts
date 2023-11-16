
/**
 * Specifies the type of authorization used for a request
 */
export enum RequestAuthorizationType { None = 'none', Basic = 'basic', OAuth2Client = 'oauth2-client', ApiKey = 'api-key'};

export type RequestAuthorizationData = BasicAuthorizationData | OAuth2ClientAuthorizationData | ApiKeyAuthorizationData

export interface RequestAuthorization {
    type: RequestAuthorizationType;
    data?: RequestAuthorizationData
}

/**
 * Information required for basic authentication
 */
export interface BasicAuthorizationData {
    username: string;
    password: string;
}

/**
 * Information required for basic authentication
 */
export interface OAuth2ClientAuthorizationData {
    accessTokenUrl: string;
    clientID: string;
    clientSecret: string;
    scope: string;
    sendCredentialsInBody: boolean;
}

/**
 * Information required for API key authentication (passed in via header)
 */
export interface ApiKeyAuthorizationData {
    header: string;
    value: string
}