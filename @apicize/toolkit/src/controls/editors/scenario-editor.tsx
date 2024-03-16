import { Typography, Stack, Container, TextField, Grid } from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language';
import { useContext } from 'react'
import { useSelector } from "react-redux";
import { WorkbookState } from '../../models/store'
import { EditableNameValuePair } from '../../models/workbook/editable-name-value-pair';
import { NameValueEditor } from './name-value-editor';
import { WorkbookStorageContext } from '../../contexts/workbook-storage-context';

export function ScenarioEditor() {
    const scenario = useContext(WorkbookStorageContext).scenario

    const id = useSelector((state: WorkbookState) => state.scenario.id)
    const name = useSelector((state: WorkbookState) => state.scenario.name)
    const variables = useSelector((state: WorkbookState) => state.scenario.variables)

    if (!id) {
        return null
    }

    const updateName = (name: string) => {
        scenario.setName(id, name)
    }

    const updateVariables = (data: EditableNameValuePair[]) => {
        scenario.setVariables(id, data)
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
