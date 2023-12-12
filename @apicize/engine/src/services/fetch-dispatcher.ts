import { Result, ResultResponse, Dispatcher, WorkbookAuthorization, WorkbookRequest } from '@apicize/definitions';
import { AuthorizationProviderFactory } from './authorization/authorization-provider-factory';
import { abort } from 'process';

export class FetchDispatcher implements Dispatcher {
    constructor(private readonly authorizationProviderFactory: AuthorizationProviderFactory) { }

    public async dispatch(
        abort: AbortSignal,
        request: WorkbookRequest,
        authorization: WorkbookAuthorization | undefined
    ): Promise<ResultResponse> {
        const authorizationProvider = this.authorizationProviderFactory.getProvider(authorization)

        if (authorizationProvider) {
            await authorizationProvider.Setup(request);
        }

        const result = await fetch(request.url, {
            method: request.method,
            keepalive: request.keepalive,
            headers: request.headers
                ?.filter(h => h.disabled !== true)
                .map(h => [h.name, h.value]),
            body: request.body,
            redirect: request.redirect,
            integrity: request.integrity,
            // signal: test.signal,
            mode: request.mode,
            referrer: request.referrer,
            referrerPolicy: request.referrerPolicy,
            duplex: request.duplex,
            signal: abort
        })

        const responseHeaders: { [name: string]: string } = {}
        for (const [name, value] of result.headers.entries()) {
            responseHeaders[name] = value
        }

        // console.log('text', text)
        const buffer = Buffer.from(await result.arrayBuffer())
        const text = buffer.toString('utf-8')
        const base64 = buffer.toString('base64')

        return {
            headers: responseHeaders,
            ok: result.ok,
            status: result.status,
            statusText: result.statusText,
            url: result.url,
            redirected: result.redirected,
            text,
            base64
        }
    }
}