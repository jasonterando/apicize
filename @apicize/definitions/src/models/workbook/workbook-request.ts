import { Identifiable as Identifiable } from '../identifiable';

import {
    ReferrerPolicy,
    RequestDuplex,
    RequestMode,
    RequestRedirect} from 'undici-types'

/**
 * Used to represent headers, query string parameters, etc.
 */
export interface NameValuePair {
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

export interface WorkbookRequest extends Identifiable {
    url: string
    method?: Method
    timeout?: number
    keepalive?: boolean
    headers?: NameValuePair[]
    queryStringParams?: NameValuePair[]
    body?: Body,
    bodyType?: BodyType,
    redirect?: RequestRedirect
    integrity?: string
    mode?: RequestMode
    referrer?: string
    referrerPolicy?: ReferrerPolicy
    duplex?: RequestDuplex
    test?: string
}
