import {
    AuthorizationEditor, CertificateEditor, HelpPanel,
    ProxyEditor, RequestEditor, ScenarioEditor,
    useFileOperations,
} from "@apicize/toolkit";
import { emit } from "@tauri-apps/api/event";


/**
 * This is the main pane (view) where help, viewers and editors are shown
 * @returns View displaying either help ro viewers/editors
 */
const Pane = (() => {
    const fileOps = useFileOperations()

    return (<>
        <HelpPanel onRenderTopic={(topic) => fileOps.retrieveHelpTopic(topic)} />
        <RequestEditor
            sx={{ display: 'block', flexGrow: 1 }}
        />
        <ScenarioEditor
            sx={{ display: 'block', flexGrow: 1 }}
        />
        <AuthorizationEditor
            sx={{ display: 'block', flexGrow: 1 }}
            triggerClearToken={() => {
                emit('action', 'clearToken')
            }} />
        <CertificateEditor
            sx={{ display: 'block', flexGrow: 1 }}
        />
        <ProxyEditor
            sx={{ display: 'block', flexGrow: 1 }}
        />
    </>)
})

export default Pane