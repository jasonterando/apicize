import {
    BodyInit,
    ReferrerPolicy,
    RequestDuplex,
    RequestMode,
    RequestRedirect,
    type RequestInit as RequestType
} from 'undici-types'

export interface RequestNameValuePair {
    name: string
    value: string
    disabled?: boolean
}

export enum Method {
    Get = 'GET',
    Post = 'POST',
    Put = 'PUT',
    Delete = 'DELETE',
    Patch = 'PATCH',
    Head = 'HEAD',
    Options = 'OPTIONS'
}

export const Methods = [Method.Get, Method.Post, Method.Put, Method.Delete, Method.Patch, Method.Head, Method.Options]

export enum BodyType {
    Text = 'Text',
    JSON = 'JSON',
    XML = 'XML'
}

export type Body = string | ArrayBuffer

export const BodyTypes = [BodyType.Text, BodyType.JSON, BodyType.XML]

export interface TestRequest {
    url: string;
    method?: Method
    keepalive?: boolean
    headers?: RequestNameValuePair[]
    queryStringParams?: RequestNameValuePair[]
    body?: Body,
    bodyType?: BodyType,
    redirect?: RequestRedirect
    integrity?: string
    mode?: RequestMode
    referrer?: string
    referrerPolicy?: ReferrerPolicy
    duplex?: RequestDuplex
}