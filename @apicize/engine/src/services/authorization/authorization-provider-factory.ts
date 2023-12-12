import { BasicAuthorizationData, OAuth2ClientAuthorizationData, RequestAuthorizationType, WorkbookAuthorization } from "@apicize/definitions";
import { ApiKeyAuthorizationData } from "@apicize/definitions/dist/models/request-authorization";
import { ApiKeyAuthorizationProvider } from "./apikey-auth-provider";
import { BasicAuthorizationProvider } from "./basic-auth-provider";
import { OAuth2ClientAuthorizationProvider } from "./oauth2-client-auth-provider";

export class AuthorizationProviderFactory {
    public getProvider(authorization?: WorkbookAuthorization) {
        switch(authorization?.type) {
            case RequestAuthorizationType.ApiKey:
                return new ApiKeyAuthorizationProvider(authorization.data as ApiKeyAuthorizationData)
            case RequestAuthorizationType.Basic:
                return new BasicAuthorizationProvider(authorization.data as BasicAuthorizationData)
            case RequestAuthorizationType.OAuth2Client:
                return new OAuth2ClientAuthorizationProvider(authorization.data as OAuth2ClientAuthorizationData)
            default:
                return undefined
        }
    }
}