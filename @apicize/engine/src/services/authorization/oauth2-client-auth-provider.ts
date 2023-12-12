import { OAuth2ClientAuthorizationData, WorkbookRequest, AuthorizationProvider } from "@apicize/definitions";

/**
 * Implements OAuth2 client grant authentication
 */
export class OAuth2ClientAuthorizationProvider implements AuthorizationProvider {
    private token?: string;
    private expires_at?: number;

    public constructor(private readonly data: OAuth2ClientAuthorizationData) { }

    /**
     * Set authorization to bearer access token
     * @param request 
     */
    public async Setup(request: WorkbookRequest): Promise<void> {
        if (! this.token && ((! this.expires_at) || (this.expires_at && this.expires_at > Date.now() - 1000))) {
            [this.token, this.expires_at] = await this.GetToken();
        }

        request.headers ??= []
        request.headers.push({
            name: 'Authorization',
            value: `Bearer ${this.token}`
        })

        return Promise.resolve();
    }

    /**
     * Retrieves access token from cache (if previously retrieved and not expired) or from configured URL
     * @returns access token and expiration (if any)
     */
    private async GetToken(): Promise<[string, number | undefined]> {

        const options: RequestInit = {
            redirect: 'follow'
        };

        let body: {
            client_id?: string,
            client_secret?: string,
            grant_type: string,
            scope?: string
        };
        if (this.data.sendCredentialsInBody) {
            body = {
                client_id: this.data.clientID,
                client_secret: this.data.clientSecret,
                grant_type: 'client'
            };
        } else {
            options.headers = {
                'Authorization': 'Basic ' + btoa(`${this.data.clientID}:${this.data.clientSecret}`)
            };
            body = {
                grant_type: 'client'
            };
        }
        if (this.data.scope) {
            body.scope = this.data.scope;
        }
        options.body = JSON.stringify(body);

        const result = await fetch(this.data.accessTokenUrl, options);
        if (result.status !== 200) {
            throw new Error(result.statusText);
        }

        const payload = (await result.json()) as OAuthClientResponse;
        if (! payload.access_token) {
            throw new Error('Authentication response did not include access_token');
        }

        const token = payload.access_token.toString();
        let expires_at: number | undefined;
        if (payload.expires_in) {
            expires_at = Date.now() + payload.expires_in;
        }
        
        return [token, expires_at];
    }
}


interface OAuthClientResponse {
    access_token?: string;
    expires_in?: number;
}