import * as React from 'react'
import Box from '@mui/material/Box'
import { useSelector } from 'react-redux'
import { ContentDestination, WorkbookState } from '../../../models/store'
import { Button, FormControl, IconButton, InputLabel, MenuItem, Select, Stack } from '@mui/material'
import { GenerateIdentifier } from '../../../services/random-identifier-generator'
import { EditableNameValuePair } from '../../../models/workbook/editable-name-value-pair'
import { NameValueEditor } from '../name-value-editor'
import FileOpenIcon from '@mui/icons-material/FileOpen'
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import { useContext } from 'react'
import { WorkspaceContext } from '../../../contexts/workspace-context'

import AceEditor from "react-ace"
import "ace-builds/src-noconflict/mode-json"
import "ace-builds/src-noconflict/mode-xml"
import "ace-builds/src-noconflict/theme-monokai"
import "ace-builds/src-noconflict/ext-language_tools"
import { WorkbookBodyType, WorkbookBodyTypes } from '@apicize/lib-typescript'

export function RequestBodyEditor(props: {
  triggerOpenFile: (destination: ContentDestination, id: string) => {},
  triggerPasteFromClipboard: (destination: ContentDestination, id: string) => {}
}) {
  const context = useContext(WorkspaceContext)
  const request = context.request

  const headerDoesNotMatchType = (bodyType: WorkbookBodyType | undefined | null) => {
    let needsContextHeaderUpdate = true
    let mimeType = getBodyTypeMimeType(bodyType)
    const contentTypeHeader = headers?.find(h => h.name === 'Content-Type')
    if (contentTypeHeader) {
      needsContextHeaderUpdate = contentTypeHeader.value !== mimeType
    } else {
      needsContextHeaderUpdate = mimeType.length !== 0
    }
    return needsContextHeaderUpdate
  }

  const getBodyTypeMimeType = (bodyType: WorkbookBodyType | undefined | null) => {
    switch (bodyType) {
      case WorkbookBodyType.None:
        return ''
      case WorkbookBodyType.JSON:
        return 'application/json'
      case WorkbookBodyType.XML:
        return 'application/xml'
      case WorkbookBodyType.Text:
        return 'text/plain'
      case WorkbookBodyType.Form:
        return 'application/x-www-form-urlencoded'
      default:
        return 'application/octet-stream'
    }
  }

  const id = useSelector((state: WorkbookState) => state.request.id)
  const headers = useSelector((state: WorkbookState) => state.request.headers)
  const bodyType = useSelector((state: WorkbookState) => state.request.bodyType)
  const bodyData = useSelector((state: WorkbookState) => state.request.bodyData)

  const [allowUpdateHeader, setAllowUpdateHeader] = React.useState<boolean>(headerDoesNotMatchType(bodyType))

  if (!id) {
    return null
  }

  const updateBodyType = (val: WorkbookBodyType | string) => {
    const newBodyType = (val == "" ? undefined : val as unknown as WorkbookBodyType) ?? WorkbookBodyType.Text
    request.setBodyType(id, newBodyType)
    setAllowUpdateHeader(headerDoesNotMatchType(newBodyType))
  }

  const updateBodyAsText = (val: string | undefined) => {
    request.setBodyData(id, val)
  }

  const updateBodyAsFormData = (data: EditableNameValuePair[]) => {
    request.setBodyData(id, data)
  }

  const updateTypeHeader = () => {
    const mimeType = getBodyTypeMimeType(bodyType)
    let newHeaders = headers ? structuredClone(headers) : []
    const contentTypeHeader = newHeaders.find(h => h.name === 'Content-Type')
    if (contentTypeHeader) {
      if (mimeType.length === 0) {
        newHeaders = newHeaders.filter(h => h.name !== 'Content-Type')
      } else {
        contentTypeHeader.value = mimeType

      }
    } else {
      if (mimeType.length > 0) {
        newHeaders.push({
          id: GenerateIdentifier(),
          name: 'Content-Type',
          value: mimeType
        })
      }
    }
    setAllowUpdateHeader(false)
    request.setHeaders(id, headers)
  }

  const bodyTypeMenuItems = () => {
    return WorkbookBodyTypes.map(bodyType => (
      <MenuItem key={bodyType} value={bodyType}>{bodyType}</MenuItem>
    ))
  }

  let mode

  switch (bodyType) {
    case WorkbookBodyType.JSON:
      mode = 'json'
      break
    case WorkbookBodyType.XML:
      mode = 'xml'
      break
  }

  return (
    <Stack direction='column' spacing={3}>
      <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
        <FormControl>
          <InputLabel id='request-method-label-id'>Body Content Type</InputLabel>
          <Select
            labelId='request-method-label-id'
            id="request-method"
            value={bodyType}
            label="Body Content Type"
            sx={{
              width: "10em"
            }}
            onChange={e => updateBodyType(e.target.value)}
          >
            {bodyTypeMenuItems()}
          </Select>
        </FormControl>
        <Button disabled={!allowUpdateHeader} onClick={updateTypeHeader}>Update Content-Type Header</Button>
      </Stack>
      {bodyType == WorkbookBodyType.None
        ? <></>
        : bodyType == WorkbookBodyType.Form
          ? <NameValueEditor values={bodyData as EditableNameValuePair[]} nameHeader='Name' valueHeader='Value' onUpdate={updateBodyAsFormData} />
          : bodyType == WorkbookBodyType.Raw
            ? <Stack
              direction='row'
              sx={{
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #444!important',
                width: 'fit-content',
              }}
            >
              <IconButton aria-label='from-file' title='Load Body from File' onClick={() => props.triggerOpenFile(ContentDestination.BodyBinary, id)} sx={{ marginRight: '4px' }}>
                <FileOpenIcon />
              </IconButton>
              <IconButton aria-label='from-clipboard' title='Paste Body from Clipboard' onClick={() => props.triggerPasteFromClipboard(ContentDestination.BodyBinary, id)} sx={{ marginRight: '4px' }}>
                <ContentPasteGoIcon />
              </IconButton>
              <Box padding='10px'>{bodyData ? bodyData.length.toLocaleString() + ' Bytes' : '(None)'}</Box>
            </Stack>
            :
            <AceEditor
              mode={mode}
              theme='monokai'
              fontSize='1rem'
              lineHeight='1rem'
              width='100%'
              height='10rem'
              showGutter={true}
              showPrintMargin={false}
              tabSize={3}
              setOptions={{
                useWorker: false,
                foldStyle: "markbegin",
                displayIndentGuides: true,
                enableAutoIndent: true,
                fixedWidthGutter: true,
                showLineNumbers: true,
              }}
              onChange={updateBodyAsText}
              name='code-editor'
              value={bodyData as string}
            />
      }
    </Stack>
  )
}
