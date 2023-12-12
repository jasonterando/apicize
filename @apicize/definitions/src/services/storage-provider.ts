import { OpenedWorkbook } from '../models/storage/opened-workbook';
import { StateStorage } from '../models/storage/state-storage';
import { StorageEntry } from '../models/storage/storage-entry';
import { StoredWorkbook } from '../models/storage/stored-workbook';
import { EditableWorkbookAuthorization } from '../models/workbook/editable/editable-workbook-authorization';
import { EditableWorkbookEnvironment } from '../models/workbook/editable/editable-workbook-environment';
import { EditableWorkbookRequestItem } from '../models/workbook/editable/helpers/editable-workbook-request-helpers';

export interface StorageProvider {
    listWorkbooks(path: string): Promise<StorageEntry[] | Error>;
    openWorkbook(...name: string[]): Promise<OpenedWorkbook | Error>;
    saveWorkbook(
        requests: StateStorage<EditableWorkbookRequestItem>,
        authorizations: StateStorage<EditableWorkbookAuthorization>,
        environments: StateStorage<EditableWorkbookEnvironment>,
        ...name: string[]): Promise<StorageEntry | Error>
}