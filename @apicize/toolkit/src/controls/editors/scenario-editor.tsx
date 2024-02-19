import { Typography, Stack, Container, TextField, Grid } from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language';
import { useEffect, useState } from 'react'
import { useSelector } from "react-redux";
import { WorkbookState, updateScenario } from '../../models/store'
import { useDispatch } from 'react-redux'
import { NameValuePair } from '@apicize/lib-typescript'
import React from 'react';
import { GenerateIdentifier } from '../../services/random-identifier-generator';
import { EditableNameValuePair } from '../../models/workbook/editable-name-value-pair';
import { NameValueEditor } from './name-value-editor';

const setupVariables = (variables: NameValuePair[] | undefined) =>
    (variables ?? []).map(h => ({
        id: GenerateIdentifier(),
        name: h.name,
        value: h.value
    }))

export function ScenarioEditor() {
    const dispatch = useDispatch()
    const scenario = useSelector((state: WorkbookState) => state.activeScenario)

    const [name, setName] = useState<string | undefined>(scenario?.name ?? '')
    const [variables, setVariables] = React.useState<EditableNameValuePair[]>(setupVariables(scenario?.variables))

    useEffect(() => {
        setName(scenario?.name ?? '')
        setVariables(setupVariables(scenario?.variables))
    }, [scenario])

    if (!scenario) {
        return null
    }

    const updateName = (name: string) => {
        setName(name)
        dispatch(updateScenario({
            id: scenario.id,
            name
        }))
    }

    const updateVariables = (data: EditableNameValuePair[]) => {
        setVariables(data)
        dispatch(updateScenario({
            id: scenario.id,
            variables: data
        }))
    }

    return (
        <Container sx={{ marginLeft: 0 }}>
            <Stack direction={'column'} sx={{ display: 'block', flexGrow: 1 }}>
                <Typography variant='h1'><LanguageIcon /> {name?.length ?? 0 > 0 ? name : '(Unnamed)'}</Typography>
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
                        <NameValueEditor values={variables} nameHeader='Header' valueHeader='Value' onUpdate={updateVariables} />
                    </Grid>
                </Grid>
            </Stack >
        </Container>
    )
}
