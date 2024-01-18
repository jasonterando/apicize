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
import { NameValueEditor } from './name-value-editor';

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

    const onUpdate = (data: EditableNameValuePair[]) => {
        setVariables(data)
        dispatch(updateEnvironment({
          id: environment.id,
          variables: data
        }))
      }
    
    
    return (
        <Stack direction={'column'} className='section no-button-column' sx={{ display: 'block', flexGrow: 1 }}>
            <Typography variant='h1'><LanguageIcon /> {name?.length ?? 0 > 0 ? name : '(Unnamed)'}</Typography>
            <NameValueEditor values={environment.variables} nameHeader='Header' valueHeader='Value' onUpdate={onUpdate} />
        </Stack >
    )
}
