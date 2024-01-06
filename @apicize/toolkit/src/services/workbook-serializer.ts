import { StoredWorkbook, WorkbookAuthorization, WorkbookEnvironment, WorkbookRequest, WorkbookRequestGroup } from "@apicize/common";
import { GenerateIdentifier } from "./random-identifier-generator";
import { EditableWorkbookAuthorization } from "../models/workbook/editable-workbook-authorization";
import { EditableWorkbookEnvironment } from "../models/workbook/editable-workbook-environment";
import { EditableWorkbookRequestItem } from "../models/workbook/editable-workbook-request-item";
import { StateStorage } from '../models/state-storage'
import { Editable } from "../models/editable";
import { Hierarchical } from "../models/hierarchical";
import { EditableWorkbookRequest } from "../models/workbook/editable-workbook-request";

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
                const r = request as EditableWorkbookRequest
                r.headers?.forEach(h => h.id = GenerateIdentifier())
                r.queryStringParams?.forEach(p => p.id = GenerateIdentifier())
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
            processor?: (entity: E) => void
            ): S[] => {
            const process = (ids: string[]): S[] =>
                ids?.map(id => {
                    const entity = structuredClone(storage.entities[id])
                    if (processor) processor(entity)
                    const childIDs = storage.childIDs ? storage.childIDs[id] : undefined
                    const children = childIDs === undefined
                        ? undefined
                        : process(childIDs)

                    const editable = entity as any
                    delete editable['id']
                    delete editable['dirty']
                    if (children) {
                        editable.children = children
                    }
                    return entity as S
                }) ?? []

            return process(storage.topLevelIDs)
        }

        return {
            version: 1.0,
            requests: toHierarchical<(WorkbookRequest | WorkbookRequestGroup), EditableWorkbookRequestItem>(requests, (request) => {
                const r = request as EditableWorkbookRequest
                r.headers?.forEach(h => h.id = undefined as unknown as string)
                r.queryStringParams?.forEach(p => p.id = undefined as unknown as string)
            }),
            authorizations: toHierarchical<WorkbookAuthorization, EditableWorkbookAuthorization>(authorizations),
            environments: toHierarchical<WorkbookEnvironment, EditableWorkbookEnvironment>(environments)
        }
    }
}