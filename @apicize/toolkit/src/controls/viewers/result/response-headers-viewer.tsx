import { useSelector } from "react-redux"
import { WorkbookState } from "../../../models/store"
import { DataGrid } from "@mui/x-data-grid"
import { GenerateIdentifier } from "../../../services/random-identifier-generator"
import { Box, Stack, Typography } from "@mui/material"
import { WorkbookStorageContext } from "../../../contexts/workbook-storage-context"
import { useContext } from "react"

export function ResponseHeadersViewer() {
    const executionId = useSelector((state: WorkbookState) => state.navigation.activeExecutionID)
    if (!executionId) {
        return null
    }

    const execution = useContext(WorkbookStorageContext).execution
    useSelector((state: WorkbookState) => state.execution.resultIndex)
    useSelector((state: WorkbookState) => state.execution.runIndex)

    const headers = []
    for (const [name, value] of Object.entries(execution.getResponseHeaders(executionId) ?? {})) {
        headers.push({
            id: GenerateIdentifier(),
            name,
            value
        })
    }

    return (
        <Stack direction="column" sx={{ flexGrow: 1 }}>
            <Typography variant='h2' sx={{ marginTop: 0 }}>Response Headers</Typography>
            <DataGrid
                rows={headers}
                rowHeight={32}
                sx={{
                    width: '100%',
                    // flexGrow: 1,
                    // height: 'calc(100% - 96px)',
                    // maxHeight: 'calc(100% - 96px)'
                }}
                columns={[
                    { field: 'name', headerName: 'Name', width: 320, editable: false },
                    { field: 'value', headerName: 'Value', flex: 1, editable: false, maxWidth: 1000 },
                ]}
                slots={{}}
                disableColumnFilter
                disableColumnSelector
                disableDensitySelector
            />
        </Stack>
    )
}

