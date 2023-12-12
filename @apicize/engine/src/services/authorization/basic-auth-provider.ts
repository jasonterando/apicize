import { BasicAuthorizationData, WorkbookRequest, AuthorizationProvider } from "@apicize/definitions";

/**
 * Implements basic authorization (RFC-7617)
 */
export class BasicAuthorizationProvider implements AuthorizationProvider {
    private header?: string;

    public constructor(private readonly data: BasicAuthorizationData) {}

    /**
     * Inject authorization header
     * @param request 
     * @returns 
     */
    public Setup(request: WorkbookRequest): Promise<void> {
        if (! this.header) {
            this.header = this.BuildHeader();
        }
        request.headers ??= [];
        request.headers.push({
            name: 'Authorization',
            value: this.header
        })
        return Promise.resolve();
    }

    /**
     * Generate basic authorization header
     * @returns authorization ehader
     */
    private BuildHeader(): string {
        return 'Basic ' + btoa(`${this.data.username}:${this.data.password}`);
    }
}
