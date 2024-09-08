import {
    base64Encode,
    AuthorizationEditor, CertificateEditor, HelpPanel,
    ProxyEditor, RequestEditor, ScenarioEditor,
} from "@apicize/toolkit";
import { emit } from "@tauri-apps/api/event";

import { extname, join, resourceDir } from '@tauri-apps/api/path';
import { exists, readFile, readTextFile } from "@tauri-apps/plugin-fs"


const retrieveHelpTopic = async (showTopic: string): Promise<string> => {
  const helpFile = await join(await resourceDir(), 'help', `${showTopic}.md`)
  if (await exists(helpFile)) {
      let text = await readTextFile(helpFile)

      const helpDir = await join(await resourceDir(), 'help', 'images')

      // This is cheesy, but I can't think of another way to inject images from the React client
      let imageLink
      do {
          imageLink = text.match(/\:image\[(.*)\]/)
          if (imageLink && imageLink.length > 0 && imageLink.index) {
              const imageFile = await join(helpDir, imageLink[1])
              let replaceWith = ''
              try {
                  const data = await readFile(imageFile)
                  const ext = await extname(imageFile)
                  replaceWith = `![](data:image/${ext};base64,${base64Encode(data)})`
              } catch (e) {
                  console.error(`${e} - unable to load ${imageFile}`)
              }
              text = `${text.substring(0, imageLink.index)}${replaceWith}${text.substring(imageLink.index + imageLink[0].length)}`
          }
      } while (imageLink && imageLink.length > 0)
      
      return text
  } else {
      throw new Error(`Help topic "${showTopic}" not found`)
  }  
}

/**
 * This is the main pane (view) where help, viewers and editors are shown
 * @returns View displaying either help ro viewers/editors
 */
const Pane = (() =>
    <>
        <HelpPanel onRenderTopic={retrieveHelpTopic}/>
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
    </>
)

export default Pane