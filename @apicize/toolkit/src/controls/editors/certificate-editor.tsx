import { Stack, TextField, Grid, FormControl, InputLabel, MenuItem, Select, Button, IconButton, FormLabel, Typography } from '@mui/material'
import SecurityIcon from '@mui/icons-material/Security';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import React, { useContext, useState } from 'react'
import { useSelector } from "react-redux";
import { ContentDestination, NavigationType, WorkbookState } from '../../models/store'
import { WorkspaceContext } from '../../contexts/workspace-context';
import { EditorTitle } from '../editor-title';
import { Persistence, WorkbookCertificateType } from '@apicize/lib-typescript';
import { PersistenceEditor } from './persistence-editor';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import { base64Decode, base64Encode } from '../../services/apicize-serializer';

export function CertificateEditor(props: {
    triggerOpenFile: (destination: ContentDestination, id: string) => {},
    triggerPasteFromClipboard: (destination: ContentDestination, id: string) => {}
}) {
    const help = useContext(WorkspaceContext).help
    const certificate = useContext(WorkspaceContext).certificate

    const activeType = useSelector((state: WorkbookState) => state.navigation.activeType)
    const activeID = useSelector((state: WorkbookState) => state.navigation.activeID)
    const name = useSelector((state: WorkbookState) => state.certificate.name)
    const type = useSelector((state: WorkbookState) => state.certificate.type)
    const pem = useSelector((state: WorkbookState) => state.certificate.pem)
    const key = useSelector((state: WorkbookState) => state.certificate.key)
    const pfx = useSelector((state: WorkbookState) => state.certificate.pfx)
    const password = useSelector((state: WorkbookState) => state.certificate.password)
    const persistence = useSelector((state: WorkbookState) => state.certificate.persistence)
    const clipboardHasText = useSelector((state: WorkbookState) => state.clipboard.hasText)

    React.useEffect(() => {
        if (activeType === NavigationType.Certificate) {
            help.setNextHelpTopic('certificates')
        }
    }, [activeType])

    if (activeType !== NavigationType.Certificate || !activeID) {
        return null
    }

    const updateName = (name: string) => {
        certificate.setName(activeID, name)
    }

    const updatePersistence = (persistence: Persistence) => {
        certificate.setPersistence(activeID, persistence)
    }

    const updateType = (type: string) => {
        certificate.setType(activeID, type as WorkbookCertificateType)
    }

    const updatePassword = (value: any) => {
        certificate.setPassword(activeID, value)
    }

    let pemToView: string = ''
    if (pem && (pem.length > 0)) {
        try {
            pemToView = (new TextDecoder('ascii')).decode(base64Decode(pem))
        } catch {
            pemToView = '(Invalid)'
        }
    }

    let keyToView: string = ''
    if (key) {
        try {
            keyToView = (new TextDecoder('ascii')).decode(base64Decode(key))
        } catch {
            keyToView = '(Invalid)'
        }
    }

    return (
        <Stack direction={'column'} className='editor-panel-no-toolbar'>
            <EditorTitle icon={<SecurityIcon />} name={name?.length ?? 0 > 0 ? name : '(Unnamed)'} />
            <Grid container direction={'column'} spacing={3} maxWidth={1000}>
                <Grid item>
                    <TextField
                        id='cert-name'
                        label='Name'
                        aria-label='name'
                        // size='small'
                        value={name}
                        onChange={e => updateName(e.target.value)}
                        fullWidth
                    />
                </Grid>
                <Grid item>
                    <Stack direction={'row'} spacing={'2em'}>
                        <FormControl>
                            <InputLabel id='cert-type-label-id'>Type</InputLabel>
                            <Select
                                labelId='cert-type-label-id'
                                id='cert-type'
                                value={type}
                                label='Type'
                                onChange={e => updateType(e.target.value)}
                            >
                                <MenuItem value={WorkbookCertificateType.PKCS8_PEM}>PKCS 8 (PEM)</MenuItem>
                                <MenuItem value={WorkbookCertificateType.PKCS12}>PKCS 12 (PKCS)</MenuItem>
                                <MenuItem value={WorkbookCertificateType.PEM}>PEM</MenuItem>
                            </Select>
                        </FormControl>
                        <PersistenceEditor onUpdatePersistence={updatePersistence} persistence={persistence} />
                    </Stack>
                </Grid>
                {
                    type === WorkbookCertificateType.PKCS8_PEM
                        ? (
                            <Grid item>
                                <Stack direction={'column'} spacing={3}>
                                    <Stack direction={'row'} spacing={3} position='relative'>
                                        <Typography variant='h6'>SSL PEM Certificate / Chain</Typography>
                                        <IconButton color='primary' size='medium' aria-label='open-pem' title='Open Certificate PEM File' onClick={() => {
                                            props.triggerOpenFile(ContentDestination.PEM, activeID)
                                        }}><FileOpenIcon fontSize='inherit' /></IconButton>
                                        <IconButton color='primary' disabled={!clipboardHasText} size='medium' aria-label='paste-pem' title='Paste PEM from Clipboard' onClick={() => {
                                            props.triggerPasteFromClipboard(ContentDestination.PEM, activeID)
                                        }}><ContentPasteGoIcon fontSize='inherit' /></IconButton>
                                    </Stack>
                                    <TextField
                                        id='cert-pem'
                                        label='PEM'
                                        multiline
                                        inputProps={{ className: "code", readOnly: true }}
                                        rows={8}
                                        value={pemToView}
                                        fullWidth
                                    />
                                    <Stack direction={'row'} spacing={3} position='relative'>
                                        <Typography variant='h6'>SSL Key</Typography>
                                        <IconButton color='primary' size='medium' aria-label='open-key' title='Open Certificate Key File' onClick={() => {
                                            props.triggerOpenFile(ContentDestination.Key, activeID)
                                        }}><FileOpenIcon fontSize='inherit' /></IconButton>
                                        <IconButton color='primary' disabled={!clipboardHasText} size='medium' aria-label='paste-key' title='Paste Key from Clipboard' onClick={() => {
                                            window.alert('fo!')
                                            props.triggerPasteFromClipboard(ContentDestination.Key, activeID)
                                        }}><ContentPasteGoIcon fontSize='inherit' /></IconButton>
                                    </Stack>
                                    <TextField
                                        id='cert-key'
                                        label='Certificate Key'
                                        multiline
                                        inputProps={{ className: "code", readOnly: true }}
                                        rows={8}
                                        value={keyToView}
                                        fullWidth
                                    />
                                </Stack>
                            </Grid>
                        )
                        : type === WorkbookCertificateType.PKCS12 ? (
                            <Grid item>
                                <Stack direction={'column'} spacing={3}>
                                    <Stack direction={'row'} spacing={3}>
                                        <TextField
                                            id='cert-pfx'
                                            label='PFX'
                                            multiline
                                            inputProps={{ className: "code", readOnly: true }}
                                            rows={8}
                                            value={pfx ? base64Encode(Buffer.from(pfx)) : ''}
                                            fullWidth
                                        />
                                        <IconButton color='primary' size='medium' aria-label='open-pfx' title='Open Certificate PFX File' onClick={() => {
                                            props.triggerOpenFile(ContentDestination.PFX, activeID)
                                        }}><FileOpenIcon fontSize='inherit' /></IconButton>
                                    </Stack>
                                    <TextField
                                        id='cert-key'
                                        label='Certificate Key'
                                        inputProps={{ className: "password" }}
                                        value={password}
                                        onChange={e => updatePassword(e.target.value)}
                                        fullWidth
                                    />
                                </Stack>
                            </Grid>
                        ) : (
                            <Grid item>
                                <Stack direction={'column'} spacing={3}>
                                    <Stack direction={'row'} spacing={3}>
                                        <TextField
                                            id='cert-pem'
                                            label='PEM'
                                            multiline
                                            inputProps={{ className: "code", readOnly: true }}
                                            rows={8}
                                            value={pemToView}
                                            fullWidth
                                        />
                                    </Stack>
                                </Stack>
                            </Grid>
                        )
                }
            </Grid>
        </Stack >
    )
}
