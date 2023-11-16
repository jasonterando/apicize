import * as React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Close'
import {
  GridRowModesModel,
  GridRowModes,
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridEventListener,
  GridRowId,
  GridRowEditStopReasons,
  GridValidRowModel,
  GridFooterContainer,
} from '@mui/x-data-grid'
import { EditableWorkbookTest, RequestNameValuePair } from '@apicize/definitions'
import { useDispatch, useSelector } from 'react-redux'
import { updateTest } from '../../../models/store'
import { GenerateIdentifier } from '../../../services/random-identifier-generator'

/**
 * Track query string parameters being edited in list
 */
interface EditableRequestQueryString extends RequestNameValuePair {
  id: string;
  isNew?: boolean;
}

const setupRequestQueryStrings = (queryStringParams: RequestNameValuePair[] | undefined) =>
  (queryStringParams ?? []).map(h => ({
    id: GenerateIdentifier(),
    name: h.name,
    value: h.value
  }))

export function TestQueryString( props: { test: EditableWorkbookTest }) {
  const dispatch = useDispatch()
  const [requestQueryString, setRequestQueryString] = React.useState<EditableRequestQueryString[]>(setupRequestQueryStrings(props.test?.queryStringParams))
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({})

  React.useEffect(() => {
    setRequestQueryString(setupRequestQueryStrings(props.test.queryStringParams))
  }, [props.test])

  function EditToolbar() {
    const handleAddClick = () => {
      const id = GenerateIdentifier()

      setRequestQueryString([...requestQueryString, {
        id,
        name: '',
        value: '',
        isNew: true
      }])

      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.Edit, fieldToFocus: 'name' }
      })
    }

    return (
      <GridFooterContainer>
        <Button color="primary" startIcon={<AddIcon />} onClick={handleAddClick}>
          Add Query String Parameter
        </Button>
      </GridFooterContainer>
    )
  }


  const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true
    }
  }

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } })
  }

  const handleSaveClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } })
  }

  const handleDeleteClick = (id: GridRowId) => () => {
    const updatedRows = requestQueryString.filter((row) => row.id !== id)
    setRequestQueryString(updatedRows)
    dispatch(updateTest({ queryString: updatedRows }))
  }

  const handleCancelClick = (id: GridRowId) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    })

    const editedRow = requestQueryString.find((row) => row.id === id)
    if (editedRow!.isNew) {
      setRequestQueryString(requestQueryString.filter((row) => row.id !== id))
    }
  }

  const processRowUpdate = (newRow: EditableRequestQueryString) => {
    const updatedRow = { ...newRow, isNew: false }
    const updatedRows = requestQueryString.map((row) => (row.id === newRow.id ? updatedRow : row))
    setRequestQueryString(updatedRows)
    dispatch(updateTest({ queryString: updatedRows }))
    return updatedRow
  }

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel)
  }

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 240, editable: true },
    { field: 'value', headerName: 'Value', flex: 1, editable: true, sortable: false },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      cellClassName: 'actions',
      getActions: ({ id }) => {
        const isInEditMode = id ? rowModesModel[id]?.mode === GridRowModes.Edit : GridRowModes.View

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<SaveIcon />}
              label="Save"
              sx={{
                color: 'primary.main',
              }}
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ]
        }

        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
        ]
      },
    },
  ]

  // const rows: GridValidRowModel[] = [];
  return (
    <Box
      sx={{
        width: '100%',
        '& .actions': {
          color: 'text.secondary',
        },
        '& .textPrimary': {
          color: 'text.primary',
        },
      }}
    >
      <DataGrid
        autoHeight
        rows={requestQueryString}
        columns={columns}
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
        slots={{
          footer: EditToolbar,
        }}
        // // slotProps={{
        //   toolbar: { setRows: setRowHeaders, setRowModesModel },
        // }}
        disableColumnFilter
        disableColumnSelector
        disableDensitySelector
      />
    </Box>
  )
}