import { WorkbookRequest, AuthorizationProvider, ApiKeyAuthorizationData } from "@apicize/definitions"

/**
 * Implements API key authorization
 */
export class ApiKeyAuthorizationProvider implements AuthorizationProvider {
    public constructor(private readonly data: ApiKeyAuthorizationData) {}

    /**
     * Inject authorization header
     * @param request 
     * @returns 
     */
    public Setup(request: WorkbookRequest): Promise<void> {
        request.headers ??= []
        request.headers.push({
            name: this.data.header,
            value: this.data.value
        })
        return Promise.resolve()
    }
}
