import * as React from 'react'
import Box from '@mui/material/Box'
import { ContentDestination } from '../../../models/store'
import { Button, FormControl, IconButton, InputLabel, MenuItem, Select, Stack } from '@mui/material'
import { GenerateIdentifier } from '../../../services/random-identifier-generator'
import { EditableNameValuePair } from '../../../models/workbook/editable-name-value-pair'
import { NameValueEditor } from '../name-value-editor'
import FileOpenIcon from '@mui/icons-material/FileOpen'
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';

import AceEditor from "react-ace"
import "ace-builds/src-noconflict/mode-json"
import "ace-builds/src-noconflict/mode-xml"
import "ace-builds/src-noconflict/theme-monokai"
import "ace-builds/src-noconflict/ext-language_tools"
import { WorkbookBodyType, WorkbookBodyTypes } from '@apicize/lib-typescript'
import { useRequestEditor } from '../../../contexts/editors/request-editor-context'

export function RequestBodyEditor(props: {
  triggerOpenFile: (destination: ContentDestination, id: string) => {},
  triggerPasteFromClipboard: (destination: ContentDestination, id: string) => {}
}) {
  const requestCtx = useRequestEditor()

  const headerDoesNotMatchType = (bodyType: WorkbookBodyType | undefined | null) => {
    let needsContextHeaderUpdate = true
    let mimeType = getBodyTypeMimeType(bodyType)
    const contentTypeHeader = requestCtx.headers?.find(h => h.name === 'Content-Type')
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

  const [allowUpdateHeader, setAllowUpdateHeader] = React.useState<boolean>(headerDoesNotMatchType(requestCtx.bodyType))

  const updateBodyType = (val: WorkbookBodyType | string) => {
    const newBodyType = (val == "" ? undefined : val as unknown as WorkbookBodyType) ?? WorkbookBodyType.Text
    requestCtx.changeBodyType(newBodyType)
    setAllowUpdateHeader(headerDoesNotMatchType(newBodyType))
  }

  const updateBodyAsText = (value: string | undefined) => {
    requestCtx.changeBodyData(value ?? '')
  }

  const updateBodyAsFormData = (data: EditableNameValuePair[]) => {
    requestCtx.changeBodyData(data)
  }

  const updateTypeHeader = () => {
    const mimeType = getBodyTypeMimeType(requestCtx.bodyType)
    let newHeaders = requestCtx.headers ? structuredClone(requestCtx.headers) : []
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
    requestCtx.changeHeaders(newHeaders)
  }

  const bodyTypeMenuItems = () => {
    return WorkbookBodyTypes.map(bodyType => (
      <MenuItem key={bodyType} value={bodyType}>{bodyType}</MenuItem>
    ))
  }

  let mode

  switch (requestCtx.bodyType) {
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
            value={requestCtx.bodyType}
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
      {requestCtx.bodyType == WorkbookBodyType.None
        ? <></>
        : requestCtx.bodyType == WorkbookBodyType.Form
          ? <NameValueEditor values={requestCtx.bodyData as EditableNameValuePair[]} nameHeader='Name' valueHeader='Value' onUpdate={updateBodyAsFormData} />
          : requestCtx.bodyType == WorkbookBodyType.Raw
            ? <Stack
              direction='row'
              sx={{
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #444!important',
                width: 'fit-content',
              }}
            >
              <IconButton aria-label='from-file' title='Load Body from File' onClick={() => props.triggerOpenFile(ContentDestination.BodyBinary, requestCtx.id)} sx={{ marginRight: '4px' }}>
                <FileOpenIcon />
              </IconButton>
              <IconButton aria-label='from-clipboard' title='Paste Body from Clipboard' onClick={() => props.triggerPasteFromClipboard(ContentDestination.BodyBinary, requestCtx.id)} sx={{ marginRight: '4px' }}>
                <ContentPasteGoIcon />
              </IconButton>
              <Box padding='10px'>{requestCtx.bodyData ? requestCtx.bodyData.length.toLocaleString() + ' Bytes' : '(None)'}</Box>
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
              value={requestCtx.bodyData as string}
            />
      }
    </Stack>
  )
}
