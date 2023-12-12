import { useSelector } from "react-redux"
import { RootState } from "../../../../models/store"
import { DataGrid } from "@mui/x-data-grid"
import { GenerateIdentifier } from "../../../../services/random-identifier-generator"

export function ResponseHeadersViewer() {
    const result = useSelector((state: RootState) => state.activeResult)
    const response = result?.response
    if (! response) {
        return null
    }

    const headers = Object.keys(response.headers).map(h => ({
        id: GenerateIdentifier(),
        name: h,
        value: response.headers[h]
    }))

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

