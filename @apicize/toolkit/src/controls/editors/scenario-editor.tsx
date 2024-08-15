import { Stack, TextField, Grid, SxProps } from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language';
import { NameValueEditor } from './name-value-editor';
import { EditorTitle } from '../editor-title';
import { PersistenceEditor } from './persistence-editor';
import { useScenarioEditor } from '../../contexts/editors/scenario-editor-context';

export function ScenarioEditor(props: {sx: SxProps}) {
    const scenarioCtx = useScenarioEditor()

    return (
        <Stack direction={'column'} className='editor-panel-no-toolbar' sx={props.sx}>
            <EditorTitle icon={<LanguageIcon />} name={scenarioCtx.name.length > 0 ? scenarioCtx.name : '(Unnamed)'} />
            <Grid container direction={'column'} spacing={3} maxWidth={1000}>
                <Grid item>
                    <TextField
                        id='scenario-name'
                        label='Name'
                        aria-label='name'
                        // size='small'
                        value={scenarioCtx.name}
                        onChange={e => scenarioCtx.changeName(e.target.value)}
                        fullWidth
                    />
                </Grid>
                <Grid item>
                    <PersistenceEditor onUpdatePersistence={scenarioCtx.changePersistence} persistence={scenarioCtx.persistence} />
                </Grid>
                <Grid item>
                    <NameValueEditor values={scenarioCtx.variables} nameHeader='Variable Name' valueHeader='Value' onUpdate={scenarioCtx.changeVariables} />
                </Grid>
            </Grid>
        </Stack >
    )
}
