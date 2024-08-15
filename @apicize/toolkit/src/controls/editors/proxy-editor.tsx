import { Stack, TextField, Grid, SxProps } from '@mui/material'
import AirlineStopsIcon from '@mui/icons-material/AirlineStops';
import { EditorTitle } from '../editor-title';
import { PersistenceEditor } from './persistence-editor';
import { useProxyEditor } from '../../contexts/editors/proxy-editor-context';

export function ProxyEditor(props: {
    sx: SxProps,
}) {
    const proxyCtx = useProxyEditor()

    return (
        <Stack direction={'column'} className='editor-panel-no-toolbar' sx={props.sx}>
            <EditorTitle icon={<AirlineStopsIcon />} name={proxyCtx.name.length > 0 ? proxyCtx.name : '(Unnamed)'} />
            <Grid container direction={'column'} spacing={3} maxWidth={1000}>
                <Grid item>
                    <TextField
                        id='proxy-name'
                        label='Name'
                        aria-label='name'
                        // size='small'
                        value={proxyCtx.name}
                        onChange={e => proxyCtx.changeName(e.target.value)}
                        fullWidth
                    />
                </Grid>
                <Grid item>
                    <PersistenceEditor onUpdatePersistence={proxyCtx.changePersistence} persistence={proxyCtx.persistence} />
                </Grid>
                <Grid item>
                    <TextField
                        id='proxy-url'
                        label='URL'
                        aria-label='url'
                        // size='small'
                        value={proxyCtx.url}
                        onChange={e => proxyCtx.changeUrl(e.target.value)}
                        fullWidth
                    />
                </Grid>
            </Grid>
        </Stack >
    )
}
