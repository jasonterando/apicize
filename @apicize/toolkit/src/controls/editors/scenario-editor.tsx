import { Typography, Stack, Container, TextField, Grid } from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language';
import React, { useContext } from 'react'
import { useSelector } from "react-redux";
import { NavigationType, WorkbookState } from '../../models/store'
import { EditableNameValuePair } from '../../models/workbook/editable-name-value-pair';
import { NameValueEditor } from './name-value-editor';
import { WorkbookStorageContext } from '../../contexts/workbook-storage-context';
import { EditorTitle } from '../editor-title';

export function ScenarioEditor() {
    const help = useContext(WorkbookStorageContext).help
    const scenario = useContext(WorkbookStorageContext).scenario

    const activeType = useSelector((state: WorkbookState) => state.navigation.activeType)
    const activeID = useSelector((state: WorkbookState) => state.navigation.activeID)
    const name = useSelector((state: WorkbookState) => state.scenario.name)
    const variables = useSelector((state: WorkbookState) => state.scenario.variables)

    React.useEffect(() => {
        if (activeType === NavigationType.Scenario) {
            help.setNextHelpTopic('scenarios')
        }
    }, [activeType])

    if (activeType !== NavigationType.Scenario || !activeID) {
        return null
    }

    const updateName = (name: string) => {
        scenario.setName(activeID, name)
    }

    const updateVariables = (data: EditableNameValuePair[]) => {
        scenario.setVariables(activeID, data)
    }

    return (
        <Stack direction={'column'} className='editor-panel-no-toolbar'>
            <EditorTitle icon={<LanguageIcon />} name={name?.length ?? 0 > 0 ? name : '(Unnamed)'} />
            <Grid container direction={'column'} spacing={3} maxWidth={1000}>
                <Grid item>
                    <TextField
                        id='scenario-name'
                        label='Name'
                        aria-label='name'
                        // size='small'
                        value={name}
                        onChange={e => updateName(e.target.value)}
                        fullWidth
                    />
                </Grid>
                <Grid item>
                    <NameValueEditor values={variables} nameHeader='Variable Name' valueHeader='Value' onUpdate={updateVariables} />
                </Grid>
            </Grid>
        </Stack >
    )
}
