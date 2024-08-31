import { Stack, TextField, Grid, FormControl, InputLabel, MenuItem, Select, IconButton, Typography, SxProps } from '@mui/material'
import SecurityIcon from '@mui/icons-material/Security';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import { ContentDestination } from '../../models/store'
import { EditorTitle } from '../editor-title';
import { WorkbookCertificateType } from '@apicize/lib-typescript';
import { PersistenceEditor } from './persistence-editor';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import { base64Decode, base64Encode } from '../../services/apicize-serializer';
import { useClipboard } from '../../contexts/clipboard.context';
import { useWorkspace } from '../../contexts/root.context';
import { EditableWorkbookCertificate, EditableWorkbookPkcs12Certificate, EditableWorkbookPkcs8PemCertificate } from '../../models/workbook/editable-workbook-certificate';
import { observer } from 'mobx-react-lite';
import { EditableEntityType } from '../../models/workbook/editable-entity-type';

export const CertificateEditor = observer((props: {
    sx: SxProps,
    triggerOpenFile: (destination: ContentDestination, id: string) => {},
    triggerPasteFromClipboard: (destination: ContentDestination, id: string) => {}
}) => {
    const workspace = useWorkspace()
    const clipboardCtx = useClipboard()

    if (workspace.active?.entityType !== EditableEntityType.Certificate || workspace.helpVisible) return null
    const certificate = workspace.active as EditableWorkbookCertificate

    const pkcs8 = certificate as EditableWorkbookPkcs8PemCertificate
    const pkcs12 = certificate as EditableWorkbookPkcs12Certificate

    let pemToView: string = ''
    if (pkcs8.pem && (pkcs8.pem.length > 0)) {
        try {
            pemToView = (new TextDecoder('ascii')).decode(base64Decode(pkcs8.pem))
        } catch {
            pemToView = '(Invalid)'
        }
    }

    let keyToView: string = ''
    if (pkcs8.key) {
        try {
            keyToView = (new TextDecoder('ascii')).decode(base64Decode(pkcs8.key))
        } catch {
            keyToView = '(Invalid)'
        }
    }

    return (
        <Stack direction={'column'} className='editor-panel-no-toolbar' sx={props.sx}>
            <EditorTitle icon={<SecurityIcon />} name={certificate.name?.length ?? 0 > 0 ? certificate.name : '(Unnamed)'} />
            <Grid container direction={'column'} spacing={3} maxWidth={1000}>
                <Grid item>
                    <TextField
                        id='cert-name'
                        label='Name'
                        aria-label='name'
                        // size='small'
                        value={certificate.name}
                        onChange={e => workspace.setCertificateName(e.target.value)}
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
                                value={certificate.type}
                                label='Type'
                                onChange={e => workspace.setCertificateType(e.target.value as
                                    WorkbookCertificateType.PEM | WorkbookCertificateType.PKCS8_PEM | WorkbookCertificateType.PKCS12)}
                            >
                                <MenuItem value={WorkbookCertificateType.PKCS8_PEM}>PKCS 8 (PEM)</MenuItem>
                                <MenuItem value={WorkbookCertificateType.PKCS12}>PKCS 12 (PKCS)</MenuItem>
                                <MenuItem value={WorkbookCertificateType.PEM}>PEM</MenuItem>
                            </Select>
                        </FormControl>
                        <PersistenceEditor onUpdatePersistence={workspace.setCertificatePersistence} persistence={certificate.persistence} />
                    </Stack>
                </Grid>
                {
                    certificate.type === WorkbookCertificateType.PKCS8_PEM
                        ? (
                            <Grid item>
                                <Stack direction={'column'} spacing={3}>
                                    <Stack direction={'row'} spacing={3} position='relative'>
                                        <Typography variant='h6' component='div'>SSL PEM Certificate / Chain</Typography>
                                        <IconButton color='primary' size='medium' aria-label='open-pem' title='Open Certificate PEM File' onClick={() => {
                                            props.triggerOpenFile(ContentDestination.PEM, certificate.id)
                                        }}><FileOpenIcon fontSize='inherit' /></IconButton>
                                        <IconButton color='primary' disabled={!clipboardCtx.hasText} size='medium' aria-label='paste-pem' title='Paste PEM from Clipboard' onClick={() => {
                                            props.triggerPasteFromClipboard(ContentDestination.PEM, certificate.id)
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
                                        <Typography variant='h6' component='div'>SSL Key</Typography>
                                        <IconButton color='primary' size='medium' aria-label='open-key' title='Open Certificate Key File' onClick={() => {
                                            props.triggerOpenFile(ContentDestination.Key, certificate.id)
                                        }}><FileOpenIcon fontSize='inherit' /></IconButton>
                                        <IconButton color='primary' disabled={!clipboardCtx.hasText} size='medium' aria-label='paste-key' title='Paste Key from Clipboard' onClick={() => {
                                            window.alert('fo!')
                                            props.triggerPasteFromClipboard(ContentDestination.Key, certificate.id)
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
                        : certificate.type === WorkbookCertificateType.PKCS12 ? (
                            <Grid item>
                                <Stack direction={'column'} spacing={3}>
                                    <Stack direction={'row'} spacing={3}>
                                        <TextField
                                            id='cert-pfx'
                                            label='PFX'
                                            multiline
                                            inputProps={{ className: "code", readOnly: true }}
                                            rows={8}
                                            value={pkcs12.pfx ? base64Encode(Buffer.from(pkcs12.pfx)) : ''}
                                            fullWidth
                                        />
                                        <IconButton color='primary' size='medium' aria-label='open-pfx' title='Open Certificate PFX File' onClick={() => {
                                            props.triggerOpenFile(ContentDestination.PFX, certificate.id)
                                        }}><FileOpenIcon fontSize='inherit' /></IconButton>
                                    </Stack>
                                    <TextField
                                        id='cert-key'
                                        label='Certificate Key'
                                        inputProps={{ className: "password" }}
                                        value={pkcs12.password}
                                        onChange={e => workspace.setCertificatePassword(e.target.value)}
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
})
