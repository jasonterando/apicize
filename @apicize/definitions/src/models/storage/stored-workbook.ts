import { Workbook } from '../workbook/workbook'

export interface StoredWorkbook extends Workbook {
    version: number
}
