// import { URLSearchParams } from 'url';
// import { Blob } from 'buffer';
// import { FormData } from 'undici';
// import { RequestHelper } from '../../src/helpers/request-helper';
// import { Method } from '../../src/models/request';

// describe('RequestHelper', () => {
//     const defaultURL = 'https://foo';
//     const defaultMethod = Method.Post;

//     let request: RequestHelper;

//     beforeEach(() => {
//         request = new RequestHelper(defaultURL, defaultMethod);
//     });

//     describe('constructor', () => {
//         it('sets url', () => {
//             expect(request.url).toEqual(defaultURL);
//         });
//         it('sets method', () => {
//             expect(request.method).toEqual(defaultMethod);
//         });
//         it('sets unspecified method to get', () => {
//             request = new RequestHelper(defaultURL);
//             expect(request.method).toEqual(Method.Get);
//         });
//     });

//     describe('headers', () => {
//         it('returns headers when headers are defined', () => {
//             const fakeHeaders = { 'foo': '123' };
//             // @ts-expect-error
//             request._headers = fakeHeaders;
//             expect(request.headers).toEqual(fakeHeaders);
//         });
//         it('returns undefined when headers are not defined', () => {
//             expect(request.headers).toEqual(undefined);
//         });
//     });

//     describe('queryStringParams', () => {
//         it('returns params when query string parameters are defined', () => {
//             const fakeParams = { 'foo': '123', 'bar': ['xxx', 'yyy'] };
//             // @ts-expect-error
//             request._queryStringParams = fakeParams;
//             expect(request.queryStringParams).toEqual(fakeParams);
//         });
//         it('returns undefined when query string parameters are not defined', () => {
//             expect(request.queryStringParams).toEqual(undefined);
//         });
//     });

//     describe('body', () => {
//         it('returns body when body is defined', () => {
//             const fakeBody = 'foo';
//             // @ts-expect-error
//             request._body = fakeBody;
//             expect(request.body).toEqual(fakeBody);
//         });
//         it('returns undefined when body is not defined', () => {
//             expect(request.body).toEqual(undefined);
//         });
//     });

//     describe('SetHeader', () => {
//         it('sets header when there are not existing headers', () => {
//             // @ts-expect-error
//             request._headers = undefined;
//             request.SetHeader('foo', 'bar');
//             expect(request.headers).toEqual({ 'foo': 'bar' });
//         });

//         it('sets header when there are existing headers', () => {
//             // @ts-expect-error
//             request._headers = { 'xxx': 'yyy' };
//             request.SetHeader('foo', 'bar');
//             expect(request.headers).toEqual({ 'xxx': 'yyy', 'foo': 'bar' });
//         });

//         it('returns request', () => {
//             expect(request.SetHeader('foo', 'bar')).toEqual(request);
//         });
//     });

//     describe('SetHeaders', () => {
//         it('sets headers when there are not existing headers', () => {
//             // @ts-expect-error
//             request._headers = undefined;
//             request.SetHeaders({ 'foo': 'bar' });
//             expect(request.headers).toEqual({ 'foo': 'bar' });
//         });

//         it('sets header when there are existing headers', () => {
//             // @ts-expect-error
//             request._headers = { 'xxx': 'yyy' };
//             request.SetHeaders({ 'foo': 'bar' });
//             expect(request.headers).toEqual({ 'xxx': 'yyy', 'foo': 'bar' });
//         });

//         it('returns request', () => {
//             expect(request.SetHeaders({ 'foo': 'bar' })).toEqual(request);
//         });
//     });

//     describe('RemoveHeader', () => {
//         it('removes header if it is set', () => {
//             // @ts-expect-error
//             request._headers = { 'foo': 'bar' };
//             request.RemoveHeader('foo');
//             expect(Object.keys(request.headers ?? {})).not.toContain('foo');
//         });

//         it('does not die no headers are set', () => {
//             // @ts-expect-error
//             request._headers = undefined;
//             request.RemoveHeader('foo');
//             expect(Object.keys(request.headers ?? {})).not.toContain('foo');
//         });

//         it('returns request', () => {
//             expect(request.RemoveHeader('foo')).toEqual(request);
//         });
//     });

//     describe('MergeQueryStringParam', () => {
//         it('adds parameter when there are not existing parameters', () => {
//             // @ts-expect-error
//             request._queryStringParams = {};
//             // @ts-expect-error
//             request.MergeQueryStringParam('foo', 'bar');
//             expect(request.queryStringParams).toEqual({ 'foo': 'bar' });
//         });

//         it('adds parameter when there are existing parameters', () => {
//             // @ts-expect-error
//             request._queryStringParams = { 'xxx': 'yyy' };
//             // @ts-expect-error
//             request.MergeQueryStringParam('foo', 'bar');
//             expect(request.queryStringParams).toEqual({ 'xxx': 'yyy', 'foo': 'bar' });
//         });

//         it('adds non-array parameter when there is a matching existing parameter that is an array', () => {
//             // @ts-expect-error
//             request._queryStringParams = { 'foo': ['bar'] };
//             // @ts-expect-error
//             request.MergeQueryStringParam('foo', 'baz');
//             expect(request.queryStringParams).toEqual({ 'foo': ['bar', 'baz'] });
//         });

//         it('adds non-array parameter when there is a matching existing parameter that is not an array', () => {
//             // @ts-expect-error
//             request._queryStringParams = { 'foo': 'bar' };
//             // @ts-expect-error
//             request.MergeQueryStringParam('foo', 'baz');
//             expect(request.queryStringParams).toEqual({ 'foo': ['bar', 'baz'] });
//         });

//         it('adds array parameter when there is a matching existing parameter that is an array', () => {
//             // @ts-expect-error
//             request._queryStringParams = { 'foo': ['bar'] };
//             // @ts-expect-error
//             request.MergeQueryStringParam('foo', ['bat', 'baz']);
//             expect(request.queryStringParams).toEqual({ 'foo': ['bar', 'bat', 'baz'] });
//         });

//         it('adds array parameter when there is a matching existing parameter that is not an array', () => {
//             // @ts-expect-error
//             request._queryStringParams = { 'foo': ['bar'] };
//             // @ts-expect-error
//             request.MergeQueryStringParam('foo', 'baz');
//             expect(request.queryStringParams).toEqual({ 'foo': ['bar', 'baz'] });
//         });

//         it('returns request', () => {
//             expect(request.AddQueryStringParam('foo', 'bar')).toEqual(request);
//         });
//     });

//     // describe('AddQueryStringParam', () => {
//     //     it('calls MergeQueryStringParam', () => {
//     //         // @ts-expect-error
//     //         const spyMerge = jest.spyOn(request, 'MergeQueryStringParam');
//     //         request.AddQueryStringParams({ 'foo': 'bar' });
//     //         expect(spyMerge).toHaveBeenCalledWith('foo', 'bar');
//     //     });

//     //     it('returns request', () => {
//     //         expect(request.AddQueryStringParam('foo', 'bar')).toEqual(request);
//     //     });
//     // });

//     // describe('AddQueryStringParam', () => {
//     //     it('calls MergeQueryStringParam for each parameter', () => {
//     //         // @ts-expect-error
//     //         const spyMerge = jest.spyOn(request, 'MergeQueryStringParam');
//     //         request.AddQueryStringParams({ 'foo': 'bar', 'xxx': ['yyy', 'zzz'] });
//     //         expect(spyMerge).toHaveBeenCalledWith('foo', 'bar');
//     //         expect(spyMerge).toHaveBeenCalledWith('xxx', ['yyy', 'zzz']);
//     //     });

//     //     it('returns request', () => {
//     //         expect(request.AddQueryStringParams({ 'foo': 'bar' })).toEqual(request);
//     //     });
//     // });

//     describe('RemoveQueryStringParam', () => {
//         it('removes query string parameter if it is set', () => {
//             // @ts-expect-error
//             request._queryStringParams = { 'foo': 'bar' };
//             request.RemoveQueryStringParam('foo');
//             expect(Object.keys(request.queryStringParams ?? {})).not.toContain('foo');
//         });

//         it('does not die no headers are set', () => {
//             // @ts-expect-error
//             request._queryStringParams = undefined;
//             request.RemoveQueryStringParam('foo');
//             expect(Object.keys(request.queryStringParams ?? {})).not.toContain('foo');
//         });

//         it('returns request', () => {
//             expect(request.RemoveQueryStringParam('foo')).toEqual(request);
//         });
//     });

//     describe('SetBodyText', () => {
//         const test = 'test';
//         it('sets body to UTF-8 encoded text', () => {
//             expect(request.SetBodyText(test).body).toEqual(
//                 (new TextEncoder()).encode(test)
//             );
//         });

//         it('sets Content-Type header', () => {
//             expect(request.SetBodyText(test).headers!!['Content-Type']).toEqual(
//                 'text/plain; charset=utf-8'
//             );
//         });

//         it('sets Content-Length header', () => {
//             expect(request.SetBodyText(test).headers!!['Content-Length']).toEqual(
//                 (new TextEncoder()).encode(test).length.toString()
//             );
//         });

//         it('returns request', () => {
//             expect(request.SetBodyText(test)).toEqual(request);
//         });
//     });

//     describe('SetBodyFormParams', () => {
//         it('calls SetBodyFromFormParams', () => {
//             const data = {'foo': 'bar'};
//             const spySetBody = jest.spyOn(request, 'SetBodyUsingFormParams');
//             request.SetBodyFormParams(data);
//             expect(spySetBody).toHaveBeenCalledWith(new URLSearchParams(data));
//         });

//         it('returns request', () => {
//             expect(request.SetBodyFormParams({})).toEqual(request);
//         });
//     });

//     describe('SetBodyUsingFormParams', () => {
//         const data = new URLSearchParams({'foo': 'bar'});

//         it('sets body to UTF-8 encoded text', () => {
//             expect(request.SetBodyUsingFormParams(data).body).toEqual(
//                 (new TextEncoder()).encode(data.toString())
//             );
//         });

//         it('sets Content-Type header', () => {
//             expect(request.SetBodyUsingFormParams(data).headers!!['Content-Type']).toEqual(
//                 'application/x-www-form-urlencoded; charset=utf-8'
//             );
//         });

//         it('sets Content-Length header', () => {
//             expect(request.SetBodyUsingFormParams(data).headers!!['Content-Length']).toEqual(
//                 (new TextEncoder()).encode(data.toString()).length.toString()
//             );
//         });

//         it('returns request', () => {
//             expect(request.SetBodyUsingFormParams(new URLSearchParams())).toEqual(request);
//         });
//     });

//     describe('SetBodyUsingFormData', () => {
//         it('sets body to form data', () => {
//             const data = new FormData();
//             data.append('foo', 'bar');
//             expect(request.SetBodyUsingFormData(data).body).toEqual(data);
//         });

//         it('removes Content-Type header', () => {
//             const spyRemoveHeader = jest.spyOn(request, 'RemoveHeader');
//             request.SetBodyUsingFormData(new FormData());
//             expect(spyRemoveHeader).toHaveBeenCalledWith('Content-Type');
//         });

//         it('returns request', () => {
//             expect(request.SetBodyUsingFormData(new FormData)).toEqual(request);
//         });
//     });

//     describe('SetBodyUsingBlob', () => {
//         it('sets body to blob', () => {
//             const blob = new Blob([]);
//             expect(request.SetBodyUsingBlob(blob).body).toEqual(blob);
//         });

//         it('sets content type to specified header', () => {
//             const blob = new Blob([]);
//             expect(request.SetBodyUsingBlob(blob, 'application/foo').headers!!['Content-Type'])
//                 .toEqual('application/foo');
//         });

//         it('sets content type to default if not type specified', () => {
//             const blob = new Blob([]);
//             expect(request.SetBodyUsingBlob(blob).headers!!['Content-Type'])
//                 .toEqual('application/octet-stream');
//         });

//         it('sets content length if available from blob', () => {
//             const blob = new Blob(['foo']);
//             expect(request.SetBodyUsingBlob(blob).headers!!['Content-Length'])
//                 .toEqual(blob.size.toString());
//         });

//         it('does not set content length if unavailable from blob', () => {
//             const blob = new Blob(['foo']);
//             jest.spyOn(blob, 'size', 'get').mockReturnValue(0);
//             expect(request.SetBodyUsingBlob(blob).headers!!['Content-Length'])
//                 .toEqual(undefined);
//         });

//         it('returns request', () => {
//             expect(request.SetBodyUsingBlob(new Blob([]))).toEqual(request);
//         });
//     })

// });