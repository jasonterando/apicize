import { TestRequest, TestResponse, AuthorizationProvider, Dispatcher, WorkbookAuthorization, WorkbookTest } from '@apicize/definitions';
import { AuthorizationProviderFactory } from './authorization/authorization-provider-factory';

export class FetchDispatcher implements Dispatcher {
    constructor(private readonly authorizationProviderFactory: AuthorizationProviderFactory) {}

    public async dispatch(
        test: WorkbookTest,
        authorization: WorkbookAuthorization | undefined
    ): Promise<TestResponse> {
        const authorizationProvider = this.authorizationProviderFactory.getProvider(authorization)

        if (authorizationProvider) {
            await authorizationProvider.Setup(test);
        }

        const result = await fetch(test.url, {
            method: test.method,
            keepalive: test.keepalive,
            headers: test.headers
                ?.filter(h => h.disabled !== true)
                .map(h => [h.name, h.value]),
            body: test.body,
            redirect: test.redirect,
            integrity: test.integrity,
            // signal: test.signal,
            mode: test.mode,
            referrer: test.referrer,
            referrerPolicy: test.referrerPolicy,
            duplex: test.duplex
          
        });

        const responseHeaders: { [name: string]: string } = {}
        for (const [name, value] of result.headers.entries()) {
            responseHeaders[name] = value
        }

        return result
    }
}