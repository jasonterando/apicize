import { OpenedWorkbook } from '../models/storage/opened-workbook';
import { StorageEntry } from '../models/storage/storage-entry';
import { StoredWorkbook } from '../models/storage/stored-workbook';
import { Workbook } from '../models/workbook/workbook';

export interface StorageProvider {
    listWorkbooks(path: string): Promise<StorageEntry[] | Error>;
    openWorkbook(...name: string[]): Promise<OpenedWorkbook | Error>;
    saveWorkbook(workbook: Workbook, ...name: string[]): Promise<StorageEntry | Error>
}