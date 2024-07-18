import { Stack, TextField, Grid, FormControlLabel, Switch, FormControl, FormLabel, Radio, RadioGroup, InputLabel, MenuItem, Select } from '@mui/material'
import SecurityIcon from '@mui/icons-material/Security';
import React, { useContext } from 'react'
import { useSelector } from "react-redux";
import { NavigationType, WorkbookState } from '../../models/store'
import { WorkspaceContext } from '../../contexts/workspace-context';
import { EditorTitle } from '../editor-title';
import { Persistence, WorkbookCertificateType } from '@apicize/lib-typescript';
import { PersistenceEditor } from './persistence-editor';

export function CertificateEditor() {
    const help = useContext(WorkspaceContext).help
    const certificate = useContext(WorkspaceContext).certificate

    const activeType = useSelector((state: WorkbookState) => state.navigation.activeType)
    const activeID = useSelector((state: WorkbookState) => state.navigation.activeID)
    const name = useSelector((state: WorkbookState) => state.certificate.name)
    const type = useSelector((state: WorkbookState) => state.certificate.type)
    const pem = useSelector((state: WorkbookState) => state.certificate.pem)
    const key = useSelector((state: WorkbookState) => state.certificate.key)
    const der = useSelector((state: WorkbookState) => state.certificate.der)
    const password = useSelector((state: WorkbookState) => state.certificate.password)
    const persistence = useSelector((state: WorkbookState) => state.proxy.persistence)

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

    const updatePem = (value: string) => {
        certificate.setPem(activeID, value)
    }

    const updateKey = (value: string | undefined) => {
        certificate.setKey(activeID, value)
    }

    const updateDer = (value: any) => {
        certificate.setDer(activeID, value)
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
                                <MenuItem value={WorkbookCertificateType.PKCS8}>PKCS 8 (PEM)</MenuItem>
                                <MenuItem value={WorkbookCertificateType.PKCS12}>PKCS 12 (PKCS)</MenuItem>
                            </Select>
                        </FormControl>
                        <PersistenceEditor onUpdatePersistence={updatePersistence} persistence={persistence} />
                    </Stack>
                </Grid>
                {
                    type === WorkbookCertificateType.PKCS8
                        ? (
                            <Grid item>
                                <Stack direction={'column'} spacing={3}>
                                    <TextField
                                        id='cert-pem'
                                        label='PEM'
                                        multiline
                                        inputProps={{ className: "code" }}
                                        rows={8}
                                        value={pem}
                                        onChange={e => updatePem(e.target.value)}
                                        fullWidth
                                    />
                                    <TextField
                                        id='cert-key'
                                        label='Certificate Key'
                                        multiline
                                        inputProps={{ className: "code" }}
                                        rows={8}
                                        value={key}
                                        onChange={e => updateKey(e.target.value)}
                                        fullWidth
                                    />
                                </Stack>
                            </Grid>
                        )
                        : (
                            <Grid item>
                                Testing PKCS12
                            </Grid>
                        )
                }
            </Grid>
        </Stack >
    )
}
