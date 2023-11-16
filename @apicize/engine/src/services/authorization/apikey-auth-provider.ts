import { TestRequest, AuthorizationProvider } from "@apicize/definitions"
import { ApiKeyAuthorizationData } from "@apicize/definitions/dist/models/authorization"

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
    public Setup(request: TestRequest): Promise<void> {
        const headers = request.headers ?? []
        headers.push({
            name: this.data.header,
            value: this.data.value
        })
        // request.headers = headers
        return Promise.resolve()
    }
}
