import { useSelector } from "react-redux"
import { WorkbookState } from "../../../../models/store"
import { DataGrid } from "@mui/x-data-grid"
import { GenerateIdentifier } from "../../../../services/random-identifier-generator"

export function ResponseHeadersViewer() {
    const result = useSelector((state: WorkbookState) => state.activeExecution?.result)
    const response = result?.response
    if (! response) {
        return null
    }

    const headers = []
    for(const [name, value] of Object.entries(response.headers ?? {})) {
        headers.push({
            id: GenerateIdentifier(),
            name,
            value
        })
    }

    return (
        <DataGrid
            rows={headers}
            rowHeight={52}
            sx={{
                width: '100%',
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
    )
}

