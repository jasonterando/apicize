import { DataGrid } from "@mui/x-data-grid"
import { GenerateIdentifier } from "../../../services/random-identifier-generator"
import { Stack, Typography } from "@mui/material"
import { useExecution } from "../../../contexts/root.context"

export function ResponseHeadersViewer(props: {requestOrGroupId: string, runIndex: number, resultIndex: number}) {
    const execution = useExecution()

    const resultHeaders = execution.getExecutionResultHeaders(props.requestOrGroupId, props.runIndex, props.resultIndex)

    const headers = []
    for (const [name, value] of Object.entries(resultHeaders ?? {})) {
        headers.push({
            id: GenerateIdentifier(),
            name,
            value
        })
    }

    return (
        <Stack direction="column" sx={{ flexGrow: 1 }}>
            <Typography variant='h2' sx={{ marginTop: 0 }} component='div'>Response Headers</Typography>
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

