import {
    AuthorizationEditor, AuthorizationEditorProvider, CertificateEditor, CertificateEditorProvider, ContentDestination, FakeProvider, FakeViewer, HelpPanel,
    ProxyEditor, ProxyEditorProvider, RequestEditor, RequestEditorProvider, ScenarioEditor, ScenarioEditorProvider,
    useHelp,
    useNavigationState,
} from "@apicize/toolkit";
import { Box } from "@mui/system";
import { emit } from "@tauri-apps/api/event";

/**
 * This is the main pane (view) where help, viewers and editors are shown
 * @returns View displaying either help ro viewers/editors
 */
export default function Pane() {

    const navState = useNavigationState()

    const helpCtx = useHelp()
    return helpCtx.showHelp
        ? <HelpPanel showHelp={(topic) => emit('help', topic)} hideHelp={() => emit('help', '\nclose')} />
        : <>
            <RequestEditorProvider>
                <RequestEditor
                    sx={{ display: 'block', flexGrow: 1 }}
                    triggerRun={() => emit('action', 'run')}
                    triggerCancel={() => emit('action', 'cancel')}
                    triggerCopyTextToClipboard={(text?: string) => {
                        emit('copyText', text)
                    }}
                    triggerCopyImageToClipboard={(base64?: string) => {
                        emit('copyImage', base64)
                    }}
                    triggerOpenFile={(destination: ContentDestination, id: string) => emit('openFile', { destination, id })}
                    triggerPasteFromClipboard={(destination: ContentDestination, id: string) => emit('pasteFromClipboard', { destination, id })}
                />
            </RequestEditorProvider>
            <ScenarioEditorProvider>
                <ScenarioEditor
                    sx={{ display: 'block', flexGrow: 1 }}
                />
            </ScenarioEditorProvider>
            <AuthorizationEditorProvider>
                <AuthorizationEditor
                    sx={{ display: 'block', flexGrow: 1 }}
                    triggerClearToken={() => {
                        emit('action', 'clearToken')
                    }} />
            </AuthorizationEditorProvider>
            <CertificateEditorProvider>
                <CertificateEditor
                    sx={{ display: 'block', flexGrow: 1 }}
                    triggerOpenFile={(destination: ContentDestination, id: string) => emit('openFile', { destination, id })}
                    triggerPasteFromClipboard={(destination: ContentDestination, id: string) => emit('pasteFromClipboard', { destination, id })}
                />
            </CertificateEditorProvider>

            <ProxyEditorProvider>
                <ProxyEditor
                    sx={{ display: 'block', flexGrow: 1 }}
                />
            </ProxyEditorProvider>
        </>
}