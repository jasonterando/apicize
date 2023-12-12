// import { Method, Request, NameValuePair } from "../models/request"
// import { URLSearchParams } from "url"
// import {
//     type BodyInit as BodyInitType
// } from 'undici-types'
// // import { BodyInit } from "../stubs/fetch.d.ts.zzz"
// // import { FormData } from "../stubs/formdata.d.ts.zzz"

// /**
//  * Fluent/method-chain mechanism to build requests
//  */
// export class RequestHelper implements Request {

//     private _headers?: NameValuePair[]
//     private _queryStringParams?: NameValuePair[]
//     private _body?: BodyInitType

//     public constructor(
//         /**
//          * URL to use for request
//          */
//         public readonly url: URL,
//         /**
//          * Method to use for request (default = GET)
//          */
//         public readonly method: Method = Method.Get
//     ) { }

//     /**
//      * Return defined headers (if any) to use for request
//      */
//     public get headers(): NameValuePair[] | undefined {
//         return this._headers
//     }

//     /**
//      * Return defined query string parameters (if any) to use for request
//      */
//     public get queryStringParams(): NameValuePair[] | undefined {
//         return this._queryStringParams
//     }

//     /**
//      * Return defined body (if any) to use for request
//      */
//     public get body(): BodyInitType | undefined {
//         return this._body
//     }

//     /**
//      * Set specified header value
//      * @param name 
//      * @param value 
//      * @returns Request
//      */
//     public SetHeader(name: string, value: string): RequestHelper {
//         if (this._headers) {
//             const match = this._headers.find(h => h.name === name)
//             if (match) {
//                 match.value = value
//                 return this
//             }

//         } else {
//             this._headers = []
//         }
//         this._headers.push({
//             name,
//             value
//         })
//         if (!this._headers) this._headers = []
//         return this
//     }

//     /**
//      * Set specified header values
//      * @param name 
//      * @param value 
//      * @returns Request
//      */
//     public SetHeaders(headers: {[name: string]: string}): RequestHelper {
//         for(const name of Object.keys(headers)) {
//             this.SetHeader(name, headers[name])
//         }
//         return this
//     }

//     /**
//      * Remove specified header value
//      * @param name 
//      * @returns 
//      */
//     public RemoveHeader(name: string): RequestHelper {
//         if (this._headers) {
//             const index = this._headers.findIndex(h => h.name === name)
//             if (index !== -1) {
//                 this._headers.splice(index, 1)
//             }
//             if (this._headers.length === 0) this._headers = undefined;
//         }
//         return this
//     }

//     /**
//      * Add specified query string parameters
//      * @param name 
//      * @param value 
//      */
//     public AddQueryStringParam(name: string,  value: string): RequestHelper {
//         this._queryStringParams = [...(this._queryStringParams ?? []), {name, value}];
//         return this;
//     }

//     /**
//      * Add/append specified query string parameter values
//      * @param name 
//      * @param value 
//      * @returns 
//      */
//     public AddQueryStringParams(data: NameValuePair[]): RequestHelper {
//         this._queryStringParams = [...(this._queryStringParams ?? []), ...data];
//         return this;
//     }

//     /**
//      * Remove specified query string parameter value
//      * @param name 
//      * @returns 
//      */
//     public RemoveQueryStringParam(name: string): RequestHelper {
//         if (this._queryStringParams) {
//             this._queryStringParams =  this._queryStringParams.filter(p => p.name !== name);
//             if (this._queryStringParams.length === 0) this._queryStringParams = undefined;
//         }
//         return this
//     }

//     /**
//      * Set request body with plain text, encoding to UTF8
//      * @param text 
//      * @returns Request
//      */
//     public SetBodyText(text: string): RequestHelper {
//         const encoded = (new TextEncoder()).encode(text)
//         this._body = encoded
//         this.SetHeader('Content-Type', 'text/plain charset=utf-8')
//         this.SetHeader('Content-Length', encoded.length.toString())
//         return this
//     }

//     /**
//      * Set request body from form parameters
//      * @param data
//      * @returns 
//      */
//     public SetBodyFormParams(data: { [name: string]: string | string[] }): RequestHelper {
//         return this.SetBodyUsingFormParams(new URLSearchParams(data))
//     }

//     /**
//      * Set request body from form parameters
//      * @param data
//      * @returns 
//      */
//     public SetBodyUsingFormParams(params: URLSearchParams): RequestHelper {
//         const encoded = (new TextEncoder()).encode(params.toString())
//         this._body = encoded
//         this.SetHeader('Content-Type', 'application/x-www-form-urlencoded charset=utf-8')
//         this.SetHeader('Content-Length', encoded.length.toString())
//         return this
//     }

//     /**
//      * Set request body from form parameters
//      * @param data
//      * @returns 
//      */
//     public SetBodyUsingFormData(data: FormData): RequestHelper {
//         this._body = data
//         // Whatever sends the command will have to set content type because it needs to include boundary
//         this.RemoveHeader('Content-Type')
//         return this
//     }

//     /**
//      * Set request body with Blob
//      * @param blob 
//      * @param mimeType (optional)
//      * @returns Request
//      */
//     public SetBodyUsingBlob(blob: Blob, mimeType: string = 'application/octet-stream'): RequestHelper {
//         this._body = blob
//         this.SetHeader('Content-Type', mimeType)
//         if (blob.size) this.SetHeader('Content-Length', blob.size.toString())
//         return this
//     }
// }