import { BodyType, StoredWorkbook, WorkbookAuthorization, WorkbookEnvironment, WorkbookRequest, WorkbookRequestGroup } from "@apicize/common";
import { GenerateIdentifier } from "./random-identifier-generator";
import { EditableWorkbookAuthorization } from "../models/workbook/editable-workbook-authorization";
import { EditableWorkbookEnvironment } from "../models/workbook/editable-workbook-environment";
import { EditableWorkbookRequestItem } from "../models/workbook/editable-workbook-request-item";
import { StateStorage } from '../models/state-storage'
import { Editable } from "../models/editable";
import { Hierarchical } from "../models/hierarchical";
import { EditableWorkbookRequest } from "../models/workbook/editable-workbook-request";
import { EditableNameValuePair } from "../models/workbook/editable-name-value-pair";

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Use a lookup table to find the index.
const lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
}

export const base64Encode = (arraybuffer: ArrayBuffer): string => {
    let bytes = new Uint8Array(arraybuffer),
        i,
        len = bytes.length,
        base64 = '';

    for (i = 0; i < len; i += 3) {
        base64 += chars[bytes[i] >> 2];
        base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
        base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
        base64 += chars[bytes[i + 2] & 63];
    }

    if (len % 3 === 2) {
        base64 = base64.substring(0, base64.length - 1) + '=';
    } else if (len % 3 === 1) {
        base64 = base64.substring(0, base64.length - 2) + '==';
    }

    return base64;
};

export const base64Decode = (base64: string): ArrayBuffer => {
    let bufferLength = base64.length * 0.75,
        len = base64.length,
        i,
        p = 0,
        encoded1,
        encoded2,
        encoded3,
        encoded4;

    if (base64[base64.length - 1] === '=') {
        bufferLength--;
        if (base64[base64.length - 2] === '=') {
            bufferLength--;
        }
    }

    const arraybuffer = new ArrayBuffer(bufferLength),
        bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i += 4) {
        encoded1 = lookup[base64.charCodeAt(i)];
        encoded2 = lookup[base64.charCodeAt(i + 1)];
        encoded3 = lookup[base64.charCodeAt(i + 2)];
        encoded4 = lookup[base64.charCodeAt(i + 3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arraybuffer;
};

export class WorkbookSerializer {
    public static convertToStateStorage(data: StoredWorkbook): {
        requests: StateStorage<EditableWorkbookRequestItem>,
        authorizations: StateStorage<EditableWorkbookAuthorization>,
        environments: StateStorage<EditableWorkbookEnvironment>
    } {
        if (data.version !== 1) {
            throw new Error(`Invalid stored workbook version: ${data.version}`)
        }

        // Transform hierarchical workbook data to state storage
        const toStateStorage = <S extends object | Hierarchical<S>, E extends S | Editable>(
            items: S[],
            postProcessor?: (entity: E) => void
        ): StateStorage<E> => {
            const entities: { [id: string]: E } = {}
            const topLevelIDs: string[] = []
            const childIDs: { [id: string]: string[] } = {}

            const process = (data: S[], parentID?: string) =>
                data?.forEach(item => {
                    const id = GenerateIdentifier()
                    const asGroup = item as Hierarchical<S>
                    if (Array.isArray(asGroup.requests)) {
                        childIDs[id] = []
                        process(asGroup.requests, id)
                    }
                    if (parentID) {
                        childIDs[parentID].push(id)
                    } else {
                        topLevelIDs.push(id)
                    }
                    const entity = { ...item } as E;
                    (entity as Editable).id = id
                    if (postProcessor) postProcessor(entity)
                    entities[id] = entity
                })

            process(items)
            return { entities, topLevelIDs, childIDs: Object.keys(childIDs).length > 0 ? childIDs : undefined }
        }

        return {
            requests: toStateStorage<(WorkbookRequest | WorkbookRequestGroup), EditableWorkbookRequestItem>(data.requests, (request) => {
                const stored = request as WorkbookRequest
                const r = request as EditableWorkbookRequest
                r.headers?.forEach(h => h.id = GenerateIdentifier())
                r.queryStringParams?.forEach(p => p.id = GenerateIdentifier())
                if (r.body && r.body.type === BodyType.Form && r.body.data) {
                    (r.body.data as EditableNameValuePair[])
                        .forEach(h => h.id = GenerateIdentifier())
                }
            }),
            authorizations: toStateStorage<WorkbookAuthorization, EditableWorkbookAuthorization>(data.authorizations),
            environments: toStateStorage<WorkbookEnvironment, EditableWorkbookEnvironment>(data.environments)
        }
    }

    public static deserialize(text: string): {
        requests: StateStorage<EditableWorkbookRequestItem>,
        authorizations: StateStorage<EditableWorkbookAuthorization>,
        environments: StateStorage<EditableWorkbookEnvironment>
    } {
        const data = JSON.parse(text) as StoredWorkbook
        return WorkbookSerializer.convertToStateStorage(data)
    }

    // Transform state storage to hierarchical workbook data
    public static serialize(
        requests: StateStorage<EditableWorkbookRequestItem>,
        authorizations: StateStorage<EditableWorkbookAuthorization>,
        environments: StateStorage<EditableWorkbookEnvironment>
    ): string {
        return JSON.stringify(WorkbookSerializer.convertFromStateStorage(requests, authorizations, environments))
    }

    public static convertFromStateStorage(
        requests: StateStorage<EditableWorkbookRequestItem>,
        authorizations: StateStorage<EditableWorkbookAuthorization>,
        environments: StateStorage<EditableWorkbookEnvironment>
    ): StoredWorkbook {

        const toHierarchical = <S extends object | Hierarchical<S>, E extends S | Editable>(
            storage: StateStorage<E>,
            processor: (entity: E) => S
        ): S[] => {
            const process = (ids: string[]): S[] =>
                ids?.map(id => {
                    const source = structuredClone(storage.entities[id])
                    const result = processor(source)
                    const childIDs = storage.childIDs ? storage.childIDs[id] : undefined
                    const children = childIDs === undefined
                        ? undefined
                        : process(childIDs)

                    const editable = result as any
                    delete editable['id']
                    delete editable['dirty']
                    if (children) {
                        editable.children = children
                    }
                    return result
                }) ?? []

            return process(storage.topLevelIDs)
        }

        const editableToNameValuePair = (pair: EditableNameValuePair) => ({
            name: pair.name,
            value: pair.value,
            disabled: pair.disabled
        })

        return {
            version: 1.0,
            requests: toHierarchical<(WorkbookRequest | WorkbookRequestGroup), EditableWorkbookRequestItem>(requests, (request) => {
                const r = structuredClone(request as EditableWorkbookRequest)
                const stored = r as WorkbookRequest
                stored.headers = r.headers?.map(editableToNameValuePair)
                stored.queryStringParams = r.queryStringParams?.map(editableToNameValuePair)
                let bodyIsValid = false
                if (r.body?.data) {
                    switch (r.body?.type) {
                        case BodyType.Form:
                            const bodyAsForm = r.body.data as EditableNameValuePair[]
                            bodyIsValid = bodyAsForm.length > 0
                            if (bodyIsValid) {
                                stored.body = {
                                    type: BodyType.Form,
                                    data: bodyAsForm.map(editableToNameValuePair)
                                }
                            }
                            break
                        case BodyType.Base64:
                            const bodyAsData = r.body.data as ArrayBuffer
                            bodyIsValid = bodyAsData.byteLength > 0
                            if (bodyIsValid) {
                                stored.body = {
                                    type: BodyType.Base64,
                                    data: base64Encode(bodyAsData)
                                }
                            }
                            break
                        default:
                            const bodyAsText = r.body.data as string
                            bodyIsValid = bodyAsText.length > 0
                            if (bodyIsValid) {
                                stored.body = {
                                    type: BodyType.Base64,
                                    data: bodyAsText
                                }
                            }
                            break
                    }
                }
                if (! bodyIsValid) {
                    delete stored.body
                }
                if ((stored.headers?.length ?? 0) === 0) {
                    delete stored.headers
                }
                if ((stored.queryStringParams?.length ?? 0) === 0) {
                    delete stored.queryStringParams
                }
                return stored
            }),
            authorizations: toHierarchical<WorkbookAuthorization, EditableWorkbookAuthorization>(
                authorizations, (auth) => structuredClone(auth) as unknown as WorkbookAuthorization
            ),
            environments: toHierarchical<WorkbookEnvironment, EditableWorkbookEnvironment>(
                environments, (env) => structuredClone(env) as unknown as WorkbookEnvironment
            )
        }
    }
}