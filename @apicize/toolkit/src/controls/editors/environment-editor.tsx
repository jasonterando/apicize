import { TextField, Grid, Typography, Stack, Button, Box } from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language';
import { useEffect, useState } from 'react'
import { useSelector } from "react-redux";
import { WorkbookState, updateEnvironment } from '../../models/store'
import { useDispatch } from 'react-redux'
import { NameValuePair } from '@apicize/common'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Close'
import '../styles.css'
import React from 'react';
import { DataGrid, GridActionsCellItem, GridColDef, GridEventListener, GridFooterContainer, GridRowEditStopReasons, GridRowId, GridRowModes, GridRowModesModel } from '@mui/x-data-grid';
import { GenerateIdentifier } from '../../services/random-identifier-generator';
import { EditableNameValuePair } from '../../models/workbook/editable-name-value-pair';

const setupEnvVariables = (variables: NameValuePair[] | undefined) =>
    (variables ?? []).map(h => ({
        id: GenerateIdentifier(),
        name: h.name,
        value: h.value
    }))

export function EnvironmentEditor() {
    const dispatch = useDispatch()
    const environment = useSelector((state: WorkbookState) => state.activeEnvironment)

    const [name, setName] = useState<string | undefined>(environment?.name ?? '')
    const [variables, setVariables] = React.useState<EditableNameValuePair[]>(setupEnvVariables(environment?.variables))
    const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({})

    useEffect(() => {
        setName(environment?.name ?? '')
        setVariables(setupEnvVariables(environment?.variables))
    }, [environment])

    if (!environment) {
        return null
    }

    const updateName = (name: string | undefined) => {
        dispatch(updateEnvironment({
            id: environment.id,
            name
        }))
    }

    function EditToolbar() {
        const handleAddClick = () => {
            const id = GenerateIdentifier()

            setVariables([...variables, {
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
                    Add Environment variable
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
        const updatedRows = variables.filter((row) => row.id !== id)
        setVariables(updatedRows)
        dispatch(updateEnvironment({ 
            id: environment.id,
            variables: updatedRows 
        }))
    }

    const handleCancelClick = (id: GridRowId) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        })

        const editedRow = variables.find((row) => row.id === id)
        if (editedRow!.isNew) {
            setVariables(variables.filter((row) => row.id !== id))
        }
    }

    const processRowUpdate = (newRow: EditableNameValuePair) => {
        const updatedRow = { ...newRow, isNew: false }
        const updatedRows = variables.map((row) => (row.id === newRow.id ? updatedRow : row))
        setVariables(updatedRows)
        dispatch(updateEnvironment({ 
            id: environment.id,
            variables: updatedRows 
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

    return (
        <Stack direction={'column'} className='section no-button-column' sx={{ display: 'block', flexGrow: 1 }}>
            <Typography variant='h1'><LanguageIcon /> {name?.length ?? 0 > 0 ? name : '(Unnamed)'}</Typography>
            <Stack direction={'column'} className='section'>
                <Box maxWidth={1000}>
                    <TextField
                        id='env-name'
                        label='Name'
                        aria-label='name'
                        // size='small'
                        value={name}
                        onChange={e => updateName(e.target.value)}
                        fullWidth
                    />
                </Box>
                <Box
                    sx={{
                        marginTop: '24px',
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
                        rows={variables}
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
            </Stack>
        </Stack >
    )
}
