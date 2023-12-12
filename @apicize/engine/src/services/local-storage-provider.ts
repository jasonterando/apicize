import { EditableWorkbookAuthorization, EditableWorkbookEnvironment, EditableWorkbookRequestGroup, EditableWorkbookRequestItem, OpenedWorkbook, StateStorage, StorageEntry, StorageProvider, StoredWorkbook,
    WorkbookAuthorization, WorkbookEnvironment, WorkbookRequest, WorkbookRequestGroup, isGroup } from '@apicize/definitions'
import { EditableWorkbookAuthorizationToAuthorization } from '@apicize/definitions/dist/models/workbook/editable/editable-workbook-authorization'
import { EditableWorkbookEnvironmentToEnvironment } from '@apicize/definitions/dist/models/workbook/editable/editable-workbook-environment'
import { EditableWorkbookRequest, EditableWorkbookRequestToRequest } from '@apicize/definitions/dist/models/workbook/editable/editable-workbook-request'
import { EditableWorkbookRequestGroupToRequestGroup } from '@apicize/definitions/dist/models/workbook/editable/editable-workbook-request-group'
import { readdir, readFile, writeFile, stat } from 'fs/promises'
import { join, parse } from 'path'

/**
 * This class manages local storage for workbooks
 */
export class LocalStorageProvider implements StorageProvider {
    public static readonly Suffix = '.apicz.json'

    private static forceExtension(name: string) {
        return name.endsWith(LocalStorageProvider.Suffix)
            ? name
            : name + LocalStorageProvider.Suffix
    }

    private static removeExtension(name: string) {
        return name.endsWith(LocalStorageProvider.Suffix)
            ? name.substring(0, name.length - LocalStorageProvider.Suffix.length)
            : name
    }

    async listWorkbooks(path: string): Promise<StorageEntry[] | Error> {
        try {
            if (! path?.length ?? 0 > 0) {
                path = '.'
            }
            const files = await readdir(path)
            return (await Promise.all(files
                .filter(f => f.endsWith(LocalStorageProvider.Suffix))
                .map(async f => {
                    const stats = await stat(join(path, f))
                    const fullName = join(path, f)
                    return {
                        displayName: LocalStorageProvider.removeExtension(parse(fullName).base),
                        fullName,
                        updatedAt: stats.mtime
                    }
                })))
                .sort((f1, f2) => {
                    let i = f2.updatedAt.getTime() - f1.updatedAt.getTime()
                    if (i === 0) {
                        i = f1.displayName.localeCompare(f2.displayName)
                    }
                    return i
                })
        } catch (e) {
            return (e instanceof Error) ? e : new Error(`${e}`)
        }
    }

    /**
     * Reads workbook information from the file specified by ...name
     * @param name portions of file name to join together
     * @returns opened workbook information
     */
    async openWorkbook(...name: string[]): Promise<OpenedWorkbook | Error> {
        try {
            let fullName = LocalStorageProvider.forceExtension(join(...name))
            const data = (await readFile(fullName)).toString()
            const results = JSON.parse(data) as StoredWorkbook
            // Cursory validation
            if (! (
                typeof results.requests == 'object'
                && typeof results.authorizations == 'object'
                && typeof results.environments  == 'object'
                && results.version == 1.0
            )) {
                throw new Error('File does not apear to contain a valid workbook')
            }

            // Make sure IDs are saved in each entity
            for(const [id, request] of Object.entries(results.requests.entities)) {
                request.id = id
            }
            for(const [id, auth] of Object.entries(results.authorizations.entities)) {
                auth.id = id
            }
            for(const [id, env] of Object.entries(results.environments.entities)) {
                env.id = id
            }

            return {
                displayName: LocalStorageProvider.removeExtension(parse(fullName).base),
                fullName,
                requests: results.requests,
                authorizations: results.authorizations,
                environments: results.environments
            }
        } catch(e) {
            return (e instanceof Error) ? e : new Error(`${e}`)
        }
    }

    /**
     * Save workbook data to file specified by ...name
     * @param requests 
     * @param authorizations 
     * @param environments 
     * @param name 
     * @returns 
     */
    async saveWorkbook(
        requests: StateStorage<EditableWorkbookRequestItem>,
        authorizations: StateStorage<EditableWorkbookAuthorization>,
        environments: StateStorage<EditableWorkbookEnvironment>,
        ...name: string[]): Promise<StorageEntry | Error> {
        
        const requestEntities: {[id: string]: WorkbookRequest | WorkbookRequestGroup} = {}
        for(const id of Object.keys(requests.entities)) {
            const request = requests.entities[id]
            requestEntities[id] = isGroup(id, requests)
                ? EditableWorkbookRequestGroupToRequestGroup(request as EditableWorkbookRequestGroup)
                : EditableWorkbookRequestToRequest(request as EditableWorkbookRequest)
        }

        const authorizationEntities: {[id: string]: WorkbookAuthorization} = {}
        for(const id of Object.keys(authorizations.entities)) {
            authorizationEntities[id] = EditableWorkbookAuthorizationToAuthorization(authorizations.entities[id])
        }

        const environmentEntities: {[id: string]: WorkbookEnvironment} = {}
        for(const id of Object.keys(environments.entities)) {
            environmentEntities[id] = EditableWorkbookEnvironmentToEnvironment(environments.entities[id])
        }
        const workbookToSave: StoredWorkbook = {
            version: 1.0,
            requests: {
                entities: requestEntities,
                allIDs: requests.allIDs,
                childIDs: requests.childIDs
            },
            authorizations: {
                entities: authorizationEntities,
                allIDs: authorizations.allIDs
            },
            environments: {
                entities: environmentEntities,
                allIDs: environments.allIDs
            }
        }
        let fullName = join(...name)
        if (! fullName.endsWith(LocalStorageProvider.Suffix)) {
            fullName += LocalStorageProvider.Suffix
        }
        try {
            await writeFile(fullName, JSON.stringify(workbookToSave))
            return {
                displayName: LocalStorageProvider.removeExtension(parse(fullName).base),
                fullName,
                updatedAt: new Date()
            }
        } catch (e) {
            return (e instanceof Error) ? e : new Error(`${e}`)
        }
    }
}