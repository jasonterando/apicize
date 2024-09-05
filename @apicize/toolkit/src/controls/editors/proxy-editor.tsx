import { Stack, TextField, Grid, SxProps } from '@mui/material'
import AirlineStopsIcon from '@mui/icons-material/AirlineStops';
import { EditorTitle } from '../editor-title';
import { PersistenceEditor } from './persistence-editor';
import { useWorkspace } from '../../contexts/root.context';
import { observer } from 'mobx-react-lite';
import { EditableEntityType } from '../../models/workbook/editable-entity-type';
import { EditableWorkbookProxy } from '../../models/workbook/editable-workbook-proxy';

export const ProxyEditor = observer((props: {
    sx: SxProps
}) => {
    const workspace = useWorkspace()
    if (workspace.active?.entityType !== EditableEntityType.Proxy || workspace.helpVisible) return null
    const proxy = workspace.active as EditableWorkbookProxy
    return (
        <Stack direction={'column'} className='editor-panel-no-toolbar' sx={props.sx}>
            <EditorTitle icon={<AirlineStopsIcon />} name={proxy.name.length > 0 ? proxy.name : '(Unnamed)'} />
            <Grid container direction={'column'} spacing={3} maxWidth={1000}>
                <Grid item>
                    <TextField
                        id='proxy-name'
                        label='Name'
                        aria-label='name'
                        // size='small'
                        value={proxy.name}
                        onChange={e => workspace.setProxyName(e.target.value)}
                        error={proxy.nameInvalid}
                        helperText={proxy.nameInvalid ? 'Proxy name is required' : ''}
                        fullWidth
                    />
                </Grid>
                <Grid item>
                    <PersistenceEditor onUpdatePersistence={workspace.setProxyPersistence} persistence={proxy.persistence} />
                </Grid>
                <Grid item>
                    <TextField
                        id='proxy-url'
                        label='URL'
                        aria-label='url'
                        // size='small'
                        value={proxy.url}
                        onChange={e => workspace.setProxyUrl(e.target.value)}
                        error={proxy.urlInvalid}
                        helperText={proxy.urlInvalid ? 'URL must include http/https/socks5 protocol prefix and address' : ''}
                        fullWidth
                    />
                </Grid>
            </Grid>
        </Stack >
    )
})
