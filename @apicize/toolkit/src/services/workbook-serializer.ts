import { BodyType, Identifiable, NO_AUTHORIZATION, NO_SCENARIO, StoredWorkbook, WorkbookAuthorization, WorkbookScenario, WorkbookRequest, WorkbookRequestGroup } from "@apicize/lib-typescript";
import { GenerateIdentifier } from "./random-identifier-generator";
import { EditableWorkbookAuthorization } from "../models/workbook/editable-workbook-authorization";
import { EditableWorkbookScenario } from "../models/workbook/editable-workbook-scenario";
import { StateStorage, isGroup } from '../models/state-storage'
import { Editable } from "../models/editable";
import { Hierarchical } from "../models/hierarchical";
import { EditableWorkbookRequest } from "../models/workbook/editable-workbook-request";
import { EditableNameValuePair } from "../models/workbook/editable-name-value-pair";
import { EditableWorkbookRequestEntry } from "../models/workbook/editable-workbook-request-entry";

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Use a lookup table to find the index.
const lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
}

export function base64Encode(bytes: number[]): string {
    let i,
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
}

export function base64Decode(base64: string): number[] {
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

    const bytes = new Uint8Array(bufferLength);

    for (i = 0; i < len; i += 4) {
        encoded1 = lookup[base64.charCodeAt(i)];
        encoded2 = lookup[base64.charCodeAt(i + 1)];
        encoded3 = lookup[base64.charCodeAt(i + 2)];
        encoded4 = lookup[base64.charCodeAt(i + 3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return Array.from(bytes);
}

export function workbookToStateStorage(data: StoredWorkbook): {
    requests: StateStorage<EditableWorkbookRequestEntry>,
    authorizations: StateStorage<EditableWorkbookAuthorization>,
    scenarios: StateStorage<EditableWorkbookScenario>,
    selectedAuthorization: EditableWorkbookAuthorization | undefined,
    selectedScenario: EditableWorkbookScenario | undefined,
} {
    if (data.version !== 1) {
        throw new Error(`Invalid stored workbook version: ${data.version}`)
    }

    // Transform hierarchical workbook data to state storage
    const toStateStorage = <S extends Identifiable | Hierarchical<S>, E extends S | Editable>(
        items: S[],
        postProcessor?: (entity: E) => void
    ): StateStorage<E> => {
        const entities: { [id: string]: E } = {}
        const topLevelIDs: string[] = []
        const childIDs: { [id: string]: string[] } = {}

        const process = (data: S[], parentID?: string) =>
            data?.forEach(item => {
                const id = item.id ?? GenerateIdentifier()
                const asGroup = item as Hierarchical<S>
                if (Array.isArray(asGroup.children)) {
                    childIDs[id] = []
                    process(asGroup.children, id)
                    delete asGroup.children
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

    const stateAuthorizations = toStateStorage<WorkbookAuthorization, EditableWorkbookAuthorization>(data.authorizations)
    const stateScenarios = toStateStorage<WorkbookScenario, EditableWorkbookScenario>(data.scenarios, (e) => {
        e.variables?.forEach(v => {
            if (! v.id) v.id = GenerateIdentifier()
        })
    })

    return {
        requests: toStateStorage<(WorkbookRequest | WorkbookRequestGroup), EditableWorkbookRequestEntry>(data.requests, (request) => {
            const r = request as EditableWorkbookRequest
            r.headers?.forEach(h => h.id = GenerateIdentifier())
            r.queryStringParams?.forEach(p => p.id = GenerateIdentifier())
            if (r.body && r.body.data) {
                switch(r.body.type) {
                    case BodyType.Form:
                        (r.body.data as EditableNameValuePair[])
                            .forEach(h => h.id = GenerateIdentifier())
                        break
                    case BodyType.Raw:
                        if (typeof r.body.data === 'string') {
                            r.body.data = base64Decode(r.body.data)
                        }
                        break
                }
            }
        }),
        authorizations: stateAuthorizations,
        scenarios: stateScenarios,
        selectedAuthorization: data.settings?.selectedAuthorizationId
            ? stateAuthorizations?.entities[data.settings?.selectedAuthorizationId] : undefined,
        selectedScenario: data.settings?.selectedScenarioId
            ? stateScenarios?.entities[data.settings?.selectedScenarioId] : undefined,
    }
}

export function editableToNameValuePair(pair: EditableNameValuePair) {
    return {
        name: pair.name,
        value: pair.value,
        disabled: pair.disabled
    }
}

export function stateStorageToRequestEntry(id: string, storage: StateStorage<EditableWorkbookRequestEntry>) {
    const entity = storage.entities[id]
    if (!entity) throw new Error(`Invalid request ID ${id}`)

    if (isGroup(id, storage)) {
        const group = structuredClone(entity) as WorkbookRequestGroup
        const childIDs = storage.childIDs ? storage.childIDs[id] : []
        group.children = childIDs ? Object.values(childIDs).map(childId =>
            stateStorageToRequestEntry(childId, storage)
        ) : []
        return group
    } else {
        const r = structuredClone(entity as EditableWorkbookRequest)
        delete r.dirty
        delete r.invalid
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
                case BodyType.Raw:
                    if (Array.isArray(r.body.data)) {
                        const data = r.body.data
                        bodyIsValid = data.length > 0
                        if (bodyIsValid) {
                            stored.body = {
                                type: BodyType.Raw,
                                data: base64Encode(data as number[])
                            }
                        }
    
                    } else {
                        bodyIsValid = false
                    }
                    break
                default:
                    const bodyAsText = r.body.data as string
                    bodyIsValid = bodyAsText.length > 0
                    if (bodyIsValid) {
                        stored.body = {
                            type: r.body.type,
                            data: bodyAsText
                        }
                    }
                    break
            }
        }
        if (!bodyIsValid) {
            delete stored.body
        }
        if ((stored.headers?.length ?? 0) === 0) {
            delete stored.headers
        } else {
            stored.headers?.forEach(h => delete (h as unknown as any).id)
        }
        if ((stored.queryStringParams?.length ?? 0) === 0) {
            delete stored.queryStringParams
        } else {
            stored.queryStringParams?.forEach(p => delete (p as unknown as any).id)
        }
        return stored
    }
}

export function stateStorageToWorkbook(
    requests: StateStorage<EditableWorkbookRequestEntry>,
    authorizations: StateStorage<EditableWorkbookAuthorization>,
    scenarios: StateStorage<EditableWorkbookScenario>,
    selectedAuthorization: EditableWorkbookAuthorization | undefined,
    selectedScenario: EditableWorkbookScenario | undefined,
): StoredWorkbook {

    return {
        version: 1.0,
        requests: requests.topLevelIDs.map(id => stateStorageToRequestEntry(id, requests)),
        authorizations: authorizations.topLevelIDs.map(id => {
            const result = structuredClone(authorizations.entities[id])
            return result as WorkbookAuthorization
        }),
        scenarios: scenarios.topLevelIDs.map(id => {
            const result = structuredClone(scenarios.entities[id])
            result.variables?.forEach(v => delete (v as unknown as any).id)
            return result
    }),
        settings: {
            selectedAuthorizationId: (selectedAuthorization && selectedAuthorization.id !== NO_AUTHORIZATION)
                ? selectedAuthorization.id : undefined,
            selectedScenarioId: (selectedScenario && selectedScenario.id !== NO_SCENARIO)
                ? selectedScenario.id : undefined,
        }
    }
}
