import { Stack, TextField, Grid, SxProps } from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language';
import { NameValueEditor } from './name-value-editor';
import { EditorTitle } from '../editor-title';
import { PersistenceEditor } from './persistence-editor';
import { useWorkspace } from '../../contexts/root.context';
import { observer } from 'mobx-react-lite';
import { EditableEntityType } from '../../models/workbook/editable-entity-type';
import { EditableWorkbookScenario } from '../../models/workbook/editable-workbook-scenario';

export const ScenarioEditor = observer((props: {sx: SxProps}) => {
    const workspace = useWorkspace()
    if (workspace.active?.entityType !== EditableEntityType.Scenario || workspace.helpVisible) return null
    const scenario = workspace.active as EditableWorkbookScenario
    return (
         <Stack direction={'column'} className='editor-panel-no-toolbar' sx={props.sx}>
            <EditorTitle icon={<LanguageIcon />} name={scenario.name.length > 0 ? scenario.name : '(Unnamed)'} />
            <Grid container direction={'column'} spacing={3} maxWidth={1000}>
                <Grid item>
                    <TextField
                        id='scenario-name'
                        label='Name'
                        aria-label='name'
                        // size='small'
                        value={scenario.name}
                        onChange={e => workspace.setName(e.target.value)}
                        error={scenario.nameInvalid}
                        helperText={scenario.nameInvalid ? 'Scenario name is required' : ''}
                        fullWidth
                    />
                </Grid>
                <Grid item>
                    <PersistenceEditor onUpdatePersistence={(e) => workspace.setScenarioPersistence(e)} persistence={scenario.persistence} />
                </Grid>
                <Grid item>
                    <NameValueEditor values={scenario.variables} nameHeader='Variable Name' valueHeader='Value' onUpdate={(e) => workspace.setScenarioVariables(e)} />
                </Grid>
            </Grid>
        </Stack >
    )
})
