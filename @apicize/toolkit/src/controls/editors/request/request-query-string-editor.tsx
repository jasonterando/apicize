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
import { EditableNameValuePair, EditableWorkbookRequest, NameValuePair } from '@apicize/definitions'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, updateRequest } from '../../../models/store'
import { GenerateIdentifier } from '../../../services/random-identifier-generator'

const setupRequestQueryStrings = (queryStringParams: NameValuePair[] | undefined) =>
  (queryStringParams ?? []).map(h => ({
    id: GenerateIdentifier(),
    name: h.name,
    value: h.value
  }))

export function RequestQueryStringEditor() {
  const dispatch = useDispatch()

  const request = useSelector((state: RootState) => state.activeRequest)
  const [requestQueryString, setRequestQueryString] = React.useState<EditableNameValuePair[]>(setupRequestQueryStrings(request?.queryStringParams))
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({})

  React.useEffect(() => {
    setRequestQueryString(setupRequestQueryStrings(request?.queryStringParams))
  }, [request])

  if(! request) {
    return null
  }

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
    dispatch(updateRequest({
      id: request.id,
      queryString: updatedRows 
    }))
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

  const processRowUpdate = (newRow: EditableNameValuePair) => {
    const updatedRow = { ...newRow, isNew: false }
    const updatedRows = requestQueryString.map((row) => (row.id === newRow.id ? updatedRow : row))
    setRequestQueryString(updatedRows)
    dispatch(updateRequest({ 
      id: request.id,
      queryString: updatedRows 
    }))
    return updatedRow
  }

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel)
  }

  const columns: GridColDef[] = [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      headerAlign: 'left',
      width: 110,
      align: 'left',
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
    { field: 'name', headerName: 'Name', width: 320, editable: true },
    { field: 'value', headerName: 'Value', flex: 1, editable: true, sortable: false },
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