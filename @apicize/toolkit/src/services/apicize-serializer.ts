import { StoredGlobalSettings, WorkbookBodyType, Workspace, IndexedNestedRequests, Identifiable, Selection, WorkbookAuthorization, WorkbookCertificate, WorkbookScenario, WorkbookProxy, WorkbookCertificateType } from "@apicize/lib-typescript";
import { GenerateIdentifier } from "./random-identifier-generator";
import { EditableWorkbookAuthorization } from "../models/workbook/editable-workbook-authorization";
import { EditableWorkbookScenario } from "../models/workbook/editable-workbook-scenario";
import { IndexedEntities } from '@apicize/lib-typescript/src/models/indexed-entities'
import { Editable } from "../models/editable";
import { Hierarchical } from "../models/hierarchical";
import { EditableWorkbookRequest } from "../models/workbook/editable-workbook-request";
import { EditableNameValuePair } from "../models/workbook/editable-name-value-pair";
import { EditableWorkbookRequestEntry } from "../models/workbook/editable-workbook-request-entry";
import { EditableWorkspace } from "../models/workbook/editable-workspace";
import { EditableWorkbookProxy } from "../models/workbook/editable-workbook-proxy";
import { DEFAULT_SELECTION, NO_SELECTION } from "../models/store";
import { EditableWorkbookCertificate } from "../models/workbook/editable-workbook-certificate";

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Use a lookup table to find the index.
const lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
}

export function base64Encode(bytes: Uint8Array): string {
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

export function base64Decode(base64: string): Uint8Array {
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

    return bytes;
}


function toStateStorage<S extends Identifiable, E extends S  | Editable | Hierarchical<S>>(
    index: IndexedEntities<S>,
    callback: (item: E) => void
): IndexedEntities<E> {
    for(const v of Object.values(index.entities)) {
        callback(v as unknown as E)
    }
    return index as unknown as IndexedEntities<E>
}

/**
 * Strip editable artifacts from indexed entries and re-typecast response
 * @param item 
 * @returns 
 */
function stateIndexToStorage<S extends Identifiable, E extends S | Editable | Hierarchical<S>>(
    index: IndexedEntities<E>,
    process?: (entity: E) => void
): IndexedEntities<S> {
    const cloned = structuredClone(index)
    for(const entity of Object.values<E & Editable>(cloned.entities)) {
        delete entity['dirty']
        delete entity['invalid']
        if (process) {
            process(entity)
        }
    }
    return cloned as IndexedEntities<S>
}


export function newStateStorage(): EditableWorkspace {
    return {
        requests: { entities: {}, topLevelIds: [] },
        scenarios: { entities: {}, topLevelIds: [] },
        authorizations: { entities: {}, topLevelIds: [] },
        certificates: { entities: {}, topLevelIds: [] },
        proxies: { entities: {}, topLevelIds: [] },
        selectedScenario: NO_SELECTION,
        selectedAuthorization: NO_SELECTION,
        selectedCertificate: NO_SELECTION,
        selectedProxy: NO_SELECTION,
    }
}

export function workspaceToState(workspace: Workspace): EditableWorkspace {
    for (const scenario of Object.values(workspace.scenarios.entities)) {
        scenario.variables?.forEach(v => {
            const v1 = v as EditableNameValuePair    
            v1.id = v1.id ?? GenerateIdentifier()
        })
    }
    
    for (const request of Object.values(workspace.requests.entities)) {
        const r = request as EditableWorkbookRequest
        r.id = r.id ?? GenerateIdentifier()
        r.headers?.forEach(h => h.id = h.id ?? GenerateIdentifier())
        r.queryStringParams?.forEach(p => p.id = p.id ?? GenerateIdentifier())
        if (r.body && r.body.data) {
            switch (r.body.type) {
                case WorkbookBodyType.Form:
                    (r.body.data as EditableNameValuePair[])
                        .forEach(h => h.id = h.id ?? GenerateIdentifier())
                    break
                case WorkbookBodyType.JSON:
                    if (r.body.data) {
                        r.body.data = JSON.stringify(r.body.data)
                    }
                    break
                case WorkbookBodyType.Raw:
                    if (typeof r.body.data === 'string') {
                        r.body.data = Array.from(base64Decode(r.body.data))
                    }
                    break
            }
        } else {
            r.body = {
                type: WorkbookBodyType.None
            }
        }
    }

    for (const certificate of Object.values(workspace.certificates.entities)) {
        const c = certificate as any
        if (c['pem']) {
            c['pem'] = Array.from(base64Decode(c['pem']))
        }
        if (c['key']) {
            c['key'] = Array.from(base64Decode(c['key']))
        }
        if (c['pfx']) {
            c['pfx'] = Array.from(base64Decode(c['pfx']))
        }
    }

    return workspace as EditableWorkspace
}

export function editableToNameValuePair(pair: EditableNameValuePair) {
    return {
        name: pair.name,
        value: pair.value,
        disabled: pair.disabled
    }
}

export function stateRequestsToStorage(index: IndexedNestedRequests<EditableWorkbookRequestEntry>) {
    const cloned = structuredClone(index)
    for(const entity of Object.values(cloned.entities)) {
        const stored = entity as EditableWorkbookRequest
        delete stored.dirty
        delete stored.invalid
        let bodyIsValid = false
        if (stored.body?.data) {
            switch (stored.body?.type) {
                case WorkbookBodyType.Form:
                    const bodyAsForm = stored.body.data as EditableNameValuePair[]
                    bodyIsValid = bodyAsForm.length > 0
                    if (bodyIsValid) {
                        stored.body = {
                            type: WorkbookBodyType.Form,
                            data: bodyAsForm.map(editableToNameValuePair)
                        }
                    }
                    break
                case WorkbookBodyType.JSON:
                    try {
                        stored.body = {
                            type: stored.body.type,
                            data: JSON.parse(stored.body.data)
                        }
                        bodyIsValid = true
                    } catch {
                        bodyIsValid = false
                    }
                    break
                case WorkbookBodyType.Raw:
                    if (Array.isArray(stored.body.data)) {
                        const data = stored.body.data
                        bodyIsValid = data.length > 0
                        if (bodyIsValid) {
                            stored.body = {
                                type: WorkbookBodyType.Raw,
                                data: base64Encode(Uint8Array.from(data))
                            }
                        }
                    } else {
                        bodyIsValid = false
                    }
                    break
                default:
                    const bodyAsText = stored.body.data as string
                    bodyIsValid = bodyAsText.length > 0
                    if (bodyIsValid) {
                        stored.body = {
                            type: stored.body.type,
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
    }
    return cloned
}

export function stateToWorkspace(
    requests: IndexedEntities<EditableWorkbookRequestEntry>,
    scenarios: IndexedEntities<EditableWorkbookScenario>,
    authorizations: IndexedEntities<EditableWorkbookAuthorization>,
    certificates: IndexedEntities<EditableWorkbookCertificate>,
    proxies: IndexedEntities<EditableWorkbookProxy>,
    selectedScenario: Selection,
    selectedAuthorization: Selection,
    selectedCertificate: Selection,
    selectedProxy: Selection,
): Workspace {
    const result = {
        version: 1.0,
        requests: stateRequestsToStorage(requests),
        scenarios: stateIndexToStorage<WorkbookScenario, EditableWorkbookScenario>(scenarios),
        authorizations: stateIndexToStorage<WorkbookAuthorization, EditableWorkbookAuthorization>(authorizations),
        certificates: stateIndexToStorage<WorkbookCertificate, EditableWorkbookCertificate>(certificates, (c) => {
            const c1 = c as any
            switch (c.type) {
                case WorkbookCertificateType.PKCS12:
                    c1['pfx'] = c1['pfx'] ? base64Encode(Uint8Array.from(c1['pfx'])) : undefined
                    delete c1['pem']
                    delete c1['key']
                    break
                case WorkbookCertificateType.PKCS8_PEM:
                    c1['pem'] = c1['pem'] ? base64Encode(Uint8Array.from(c1['pem'])) : undefined
                    c1['key'] = c1['key'] ? base64Encode(Uint8Array.from(c1['key'])) : undefined
                    delete c1['pfx']
                    delete c1['password']
                    break
                case WorkbookCertificateType.PEM:
                    c1['pem'] = c1['pem'] ? base64Encode(Uint8Array.from(c1['pem'])) : undefined
                    delete c1['pfx']
                    delete c1['key']
                    delete c1['password']
                    break
                }
        }),
        proxies: stateIndexToStorage<WorkbookProxy, EditableWorkbookProxy>(proxies),
        selectedScenario: (selectedScenario === DEFAULT_SELECTION) ? undefined : selectedScenario,
        selectedAuthorization: (selectedAuthorization === DEFAULT_SELECTION) ? undefined : selectedAuthorization,
        selectedCertificate: (selectedCertificate === DEFAULT_SELECTION) ? undefined : selectedCertificate,
        selectedProxy: (selectedProxy === DEFAULT_SELECTION) ? undefined : selectedProxy,
    }
    return result
}


export function stateToGlobalSettingsStorage(
    workbookDirectory: string,
    lastWorkbookFileName: string | undefined,
): StoredGlobalSettings {
    return {
        workbookDirectory,
        lastWorkbookFileName,
    }
}
