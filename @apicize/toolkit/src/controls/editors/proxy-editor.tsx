import { Stack, TextField, Grid, FormControlLabel, Switch, FormControl, FormLabel, Radio, RadioGroup } from '@mui/material'
import AirlineStopsIcon from '@mui/icons-material/AirlineStops';
import React, { useContext } from 'react'
import { useSelector } from "react-redux";
import { NavigationType, WorkbookState } from '../../models/store'
import { WorkspaceContext } from '../../contexts/workspace-context';
import { EditorTitle } from '../editor-title';
import { Persistence } from '@apicize/lib-typescript';
import { PersistenceEditor } from './persistence-editor';

export function ProxyEditor() {
    const help = useContext(WorkspaceContext).help
    const proxy = useContext(WorkspaceContext).proxy

    const activeType = useSelector((state: WorkbookState) => state.navigation.activeType)
    const activeID = useSelector((state: WorkbookState) => state.navigation.activeID)
    const name = useSelector((state: WorkbookState) => state.proxy.name)
    const url = useSelector((state: WorkbookState) => state.proxy.url)
    const persistence = useSelector((state: WorkbookState) => state.proxy.persistence)

    React.useEffect(() => {
        if (activeType === NavigationType.Proxy) {
            help.setNextHelpTopic('proxies')
        }
    }, [activeType])

    if (activeType !== NavigationType.Proxy || !activeID) {
        return null
    }

    const updateName = (name: string) => {
        proxy.setName(activeID, name)
    }

    const updateUrl = (url: string) => {
        proxy.setUrl(activeID, url)
    }

    const updatePersistence = (persistence: Persistence) => {
        proxy.setPersistence(activeID, persistence)
    }


    return (
        <Stack direction={'column'} className='editor-panel-no-toolbar'>
            <EditorTitle icon={<AirlineStopsIcon />} name={name?.length ?? 0 > 0 ? name : '(Unnamed)'} />
            <Grid container direction={'column'} spacing={3} maxWidth={1000}>
                <Grid item>
                    <TextField
                        id='proxy-name'
                        label='Name'
                        aria-label='name'
                        // size='small'
                        value={name}
                        onChange={e => updateName(e.target.value)}
                        fullWidth
                    />
                </Grid>
                <Grid item>
                    <PersistenceEditor onUpdatePersistence={updatePersistence} persistence={persistence} />
                </Grid>
                <Grid item>
                    <TextField
                        id='proxy-url'
                        label='URL'
                        aria-label='url'
                        // size='small'
                        value={url}
                        onChange={e => updateUrl(e.target.value)}
                        fullWidth
                    />
                </Grid>
            </Grid>
        </Stack >
    )
}
