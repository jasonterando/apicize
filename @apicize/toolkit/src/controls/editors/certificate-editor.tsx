import { Stack, TextField, Grid, FormControl, InputLabel, MenuItem, Select, IconButton, Typography, SxProps } from '@mui/material'
import SecurityIcon from '@mui/icons-material/Security';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import { ContentDestination } from '../../models/store'
import { EditorTitle } from '../editor-title';
import { WorkbookCertificateType } from '@apicize/lib-typescript';
import { PersistenceEditor } from './persistence-editor';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import { base64Decode, base64Encode } from '../../services/apicize-serializer';
import { useClipboard } from '../../contexts/clipboard-context';
import { useCertificateEditor } from '../../contexts/editors/certificate-editor-context';

export function CertificateEditor(props: {
    sx: SxProps,
    triggerOpenFile: (destination: ContentDestination, id: string) => {},
    triggerPasteFromClipboard: (destination: ContentDestination, id: string) => {}
}) {
    const certificateCtx = useCertificateEditor()
    const clipboardCtx = useClipboard()

    let pemToView: string = ''
    if (certificateCtx.pem && (certificateCtx.pem.length > 0)) {
        try {
            pemToView = (new TextDecoder('ascii')).decode(base64Decode(certificateCtx.pem))
        } catch {
            pemToView = '(Invalid)'
        }
    }

    let keyToView: string = ''
    if (certificateCtx.key) {
        try {
            keyToView = (new TextDecoder('ascii')).decode(base64Decode(certificateCtx.key))
        } catch {
            keyToView = '(Invalid)'
        }
    }

    return (
        <Stack direction={'column'} className='editor-panel-no-toolbar' sx={props.sx}>
            <EditorTitle icon={<SecurityIcon />} name={certificateCtx.name?.length ?? 0 > 0 ? certificateCtx.name : '(Unnamed)'} />
            <Grid container direction={'column'} spacing={3} maxWidth={1000}>
                <Grid item>
                    <TextField
                        id='cert-name'
                        label='Name'
                        aria-label='name'
                        // size='small'
                        value={certificateCtx.name}
                        onChange={e => certificateCtx.changeName(e.target.value)}
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
                                value={certificateCtx.type}
                                label='Type'
                                onChange={e => certificateCtx.changeType(e.target.value as WorkbookCertificateType)}
                            >
                                <MenuItem value={WorkbookCertificateType.PKCS8_PEM}>PKCS 8 (PEM)</MenuItem>
                                <MenuItem value={WorkbookCertificateType.PKCS12}>PKCS 12 (PKCS)</MenuItem>
                                <MenuItem value={WorkbookCertificateType.PEM}>PEM</MenuItem>
                            </Select>
                        </FormControl>
                        <PersistenceEditor onUpdatePersistence={certificateCtx.changePersistence} persistence={certificateCtx.persistence} />
                    </Stack>
                </Grid>
                {
                    certificateCtx.type === WorkbookCertificateType.PKCS8_PEM
                        ? (
                            <Grid item>
                                <Stack direction={'column'} spacing={3}>
                                    <Stack direction={'row'} spacing={3} position='relative'>
                                        <Typography variant='h6'>SSL PEM Certificate / Chain</Typography>
                                        <IconButton color='primary' size='medium' aria-label='open-pem' title='Open Certificate PEM File' onClick={() => {
                                            props.triggerOpenFile(ContentDestination.PEM, certificateCtx.id)
                                        }}><FileOpenIcon fontSize='inherit' /></IconButton>
                                        <IconButton color='primary' disabled={! clipboardCtx.hasText} size='medium' aria-label='paste-pem' title='Paste PEM from Clipboard' onClick={() => {
                                            props.triggerPasteFromClipboard(ContentDestination.PEM, certificateCtx.id)
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
                                            props.triggerOpenFile(ContentDestination.Key, certificateCtx.id)
                                        }}><FileOpenIcon fontSize='inherit' /></IconButton>
                                        <IconButton color='primary' disabled={!clipboardCtx.hasText} size='medium' aria-label='paste-key' title='Paste Key from Clipboard' onClick={() => {
                                            window.alert('fo!')
                                            props.triggerPasteFromClipboard(ContentDestination.Key, certificateCtx.id)
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
                        : certificateCtx.type === WorkbookCertificateType.PKCS12 ? (
                            <Grid item>
                                <Stack direction={'column'} spacing={3}>
                                    <Stack direction={'row'} spacing={3}>
                                        <TextField
                                            id='cert-pfx'
                                            label='PFX'
                                            multiline
                                            inputProps={{ className: "code", readOnly: true }}
                                            rows={8}
                                            value={certificateCtx.pfx ? base64Encode(Buffer.from(certificateCtx.pfx)) : ''}
                                            fullWidth
                                        />
                                        <IconButton color='primary' size='medium' aria-label='open-pfx' title='Open Certificate PFX File' onClick={() => {
                                            props.triggerOpenFile(ContentDestination.PFX, certificateCtx.id)
                                        }}><FileOpenIcon fontSize='inherit' /></IconButton>
                                    </Stack>
                                    <TextField
                                        id='cert-key'
                                        label='Certificate Key'
                                        inputProps={{ className: "password" }}
                                        value={certificateCtx.password}
                                        onChange={e => certificateCtx.changePassword(e.target.value)}
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
