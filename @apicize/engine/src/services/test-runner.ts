import { Dispatcher, RequestAuthorizationType, WorkbookAuthorization, WorkbookTest } from "@apicize/definitions";
import { ApiKeyAuthorizationProvider } from "./authorization/apikey-auth-provider";
import { ApiKeyAuthorizationData, BasicAuthorizationData, OAuth2ClientAuthorizationData } from "@apicize/definitions/dist/models/authorization";
import { BasicAuthorizationProvider } from "./authorization/basic-auth-provider";
import { OAuth2ClientAuthorizationProvider } from "./authorization/oauth2-client-auth-provider";

export class TestRunner {
    public constructor(private readonly dispatcher: Dispatcher) {}

    public async run(tests: WorkbookTest[], authorization: WorkbookAuthorization) {

        for(const test of tests) {
            await this.dispatcher.dispatch(test, authorization)
        }
        
        
        
    }
}