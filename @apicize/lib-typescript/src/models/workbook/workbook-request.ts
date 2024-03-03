import { Identifiable } from '../identifiable';
import { Named as Named } from '../named';

import {
    ReferrerPolicy,
    RequestDuplex,
    RequestMode,
    RequestRedirect
} from 'undici-types'

/**
 * Used to represent headers, query string parameters, etc.
 */
export interface WorkbookNameValuePair {
    name: string
    value: string
    disabled?: boolean
}

export enum WorkbookMethod {
    Get = 'GET',
    Post = 'POST',
    Put = 'PUT',
    Delete = 'DELETE',
    Patch = 'PATCH',
    Head = 'HEAD',
    Options = 'OPTIONS'
}

export const WorkbookMethods = [
    WorkbookMethod.Get,
    WorkbookMethod.Post,
    WorkbookMethod.Put,
    WorkbookMethod.Delete,
    WorkbookMethod.Patch,
    WorkbookMethod.Head,
    WorkbookMethod.Options
]

export enum WorkbookBodyType {
    Text = 'Text',
    JSON = 'JSON',
    XML = 'XML',
    Form = 'Form',
    Raw = 'Raw',
}

export type WorkbookBodyData = string | number[] | WorkbookNameValuePair[]

export const WorkbookBodyTypes = [WorkbookBodyType.Text, WorkbookBodyType.JSON, WorkbookBodyType.XML, WorkbookBodyType.Form, WorkbookBodyType.Raw]

export interface WorkbookBody {
    type?: WorkbookBodyType
    data?: WorkbookBodyData
}

export interface WorkbookRequest extends Identifiable, Named {
    id: string
    url: string
    method?: WorkbookMethod
    timeout?: number
    keepalive?: boolean
    headers?: WorkbookNameValuePair[]
    queryStringParams?: WorkbookNameValuePair[]
    body?: WorkbookBody
    redirect?: RequestRedirect
    integrity?: string
    mode?: RequestMode
    referrer?: string
    referrerPolicy?: ReferrerPolicy
    duplex?: RequestDuplex
    test?: string
}
