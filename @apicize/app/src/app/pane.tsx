import { AuthorizationEditor, HelpPanel, RequestEditor, ScenarioEditor, WorkbookState } from "@apicize/toolkit";
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
                triggerSetBodyFromFile={() => emit('action', 'bodyFromFile')}
            />
            <AuthorizationEditor triggerClearToken={() => {
                emit('action', 'clearToken')
            }
            } />
            <ScenarioEditor />
        </Box>
}