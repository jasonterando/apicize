import { AuthorizationEditor, CertificateEditor, ContentDestination, HelpPanel, ProxyEditor, RequestEditor, ScenarioEditor, WorkbookState } from "@apicize/toolkit";
import { Box } from "@mui/system";
import { emit } from "@tauri-apps/api/event";
import { useSelector } from "react-redux";

export default function Pane() {
    let showHelp = useSelector((state: WorkbookState) => state.help.showHelp)
    let helpState = useSelector((state: WorkbookState) => state.help)

    const copyHelpState = structuredClone(helpState)
    delete (copyHelpState as any)['helpText']

    return showHelp
        ? <HelpPanel showHelp={(topic) => emit('help', topic)} hideHelp={() => emit('help', '\nclose')} />
        : <Box sx={{
            // height: '100vh',
            display: 'flex',
            flexDirection: 'row',
            flexGrow: 1,
        }}>
            <RequestEditor
                triggerRun={() => emit('action', 'run')}
                triggerCancel={() => emit('action', 'cancel')}
                triggerCopyTextToClipboard={(text?: string) => {
                    emit('copyText', text)
                }}
                triggerCopyImageToClipboard={(base64?: string) => {
                    emit('copyImage', base64)
                }}
                triggerOpenFile={(destination: ContentDestination, id: string) => emit('openFile', {destination, id})}
                triggerPasteFromClipboard={(destination: ContentDestination, id: string) => emit('pasteFromClipboard', {destination, id})} 
            />
            <AuthorizationEditor triggerClearToken={() => {
                emit('action', 'clearToken')
            }
            } />
            <ScenarioEditor />
            <ProxyEditor />
            <CertificateEditor
                triggerOpenFile={(destination: ContentDestination, id: string) => emit('openFile', {destination, id})} 
                triggerPasteFromClipboard={(destination: ContentDestination, id: string) => emit('pasteFromClipboard', {destination, id})} 
            />
        </Box>
}