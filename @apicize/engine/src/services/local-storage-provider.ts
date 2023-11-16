import { OpenedWorkbook, StorageEntry, StorageProvider, StoredWorkbook, Workbook } from '@apicize/definitions'
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

    async openWorkbook(...name: string[]): Promise<OpenedWorkbook | Error> {
        try {
            let fullName = LocalStorageProvider.forceExtension(join(...name))
            const data = (await readFile(fullName)).toString()
            const results = JSON.parse(data) as StoredWorkbook
            // Cursory validation
            if (! (
                Array.isArray(results.tests)
                && Array.isArray(results.authorizations)
                && results.version == 1.0
            )) {
                throw new Error('File does not apear to contain a valid workbook')
            }

            return {
                displayName: LocalStorageProvider.removeExtension(parse(fullName).base),
                fullName,
                workbook: results
            }
        } catch(e) {
            return (e instanceof Error) ? e : new Error(`${e}`)
        }
    }

    async saveWorkbook(workbook: Workbook, ...name: string[]): Promise<StorageEntry | Error> {
        const workbookToSave: StoredWorkbook = {
            version: 1.0,
            ...workbook
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