import { StoredWorkbook } from "./stored-workbook";

export interface OpenedWorkbook {
    displayName: string,
    fullName: string,
    workbook: StoredWorkbook    
}