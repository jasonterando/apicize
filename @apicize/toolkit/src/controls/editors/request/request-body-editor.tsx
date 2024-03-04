import * as React from 'react'
import Box from '@mui/material/Box'
import { useDispatch, useSelector } from 'react-redux'
import { WorkbookState, updateRequest } from '../../../models/store'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-tomorrow.css'
import { Button, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextareaAutosize } from '@mui/material'
import { BodyType, BodyTypes } from '@apicize/lib-typescript'
import { GenerateIdentifier } from '../../../services/random-identifier-generator'
import { EditableNameValuePair } from '../../../models/workbook/editable-name-value-pair'
import { NameValueEditor } from '../name-value-editor'
import FileOpenIcon from '@mui/icons-material/FileOpen'
import { castEntryAsRequest } from '../../../models/workbook/helpers/editable-workbook-request-helpers'

export function RequestBodyEditor(props: { triggerSetBodyFromFile: () => void }) {
  const dispatch = useDispatch()

  const requestEntry = useSelector((state: WorkbookState) => state.activeRequestEntry)
  const [bodyType, setBodyType] = React.useState(castEntryAsRequest(requestEntry)?.body?.type ?? BodyType.Text)
  const [bodyData, setBodyData] = React.useState(castEntryAsRequest(requestEntry)?.body?.data ?? '')
  const [allowUpdateHeader, setAllowUpdateHeader] = React.useState<boolean>(false)

  React.useEffect(() => {
    const useBodyType = castEntryAsRequest(requestEntry)?.body?.type ?? BodyType.Text
    setBodyType(useBodyType)
    setBodyData(castEntryAsRequest(requestEntry)?.body?.data ?? '')
    checkTypeHeader(useBodyType)
    // console.log(`Body type: ${useBodyType}`)
  }, [requestEntry])

  if (!requestEntry) {
    return null
  }

  const updateBodyAsText = (val: string | undefined) => {
    setBodyData(val ?? '')
    dispatch(updateRequest({
      id: requestEntry.id,
      bodyData: val
    }))
  }

  const updateBodyType = (val: BodyType | string) => {
    const newBodyType = (val == "" ? undefined : val as unknown as BodyType) ?? BodyType.Text
    dispatch(updateRequest({
      id: requestEntry.id,
      bodyType: newBodyType
    }))
    checkTypeHeader(newBodyType)
  }

  const checkTypeHeader = (bodyType: BodyType | undefined | null) => {
    let needsContextHeaderUpdate = true
    let mimeType = getBodyTypeMimeType(bodyType)
    const contentTypeHeader = castEntryAsRequest(requestEntry)?.headers?.find(h => h.name === 'Content-Type')
    if (contentTypeHeader) {
      needsContextHeaderUpdate = contentTypeHeader.value !== mimeType
    } else {
      needsContextHeaderUpdate = mimeType.length !== 0
    }
    setAllowUpdateHeader(needsContextHeaderUpdate)
  }

  const getBodyTypeMimeType = (bodyType: BodyType | undefined | null) => {
    switch (bodyType) {
      case BodyType.None:
        return ''
      case BodyType.JSON:
        return 'application/json'
      case BodyType.XML:
        return 'application/xml'
      case BodyType.Text:
        return 'text/plain'
      case BodyType.Form:
        return 'application/x-www-form-urlencoded'
      default:
        return 'application/octet-stream'
    }
  }

  const updateTypeHeader = () => {
    const mimeType = getBodyTypeMimeType(bodyType)
    const requestHeaders = castEntryAsRequest(requestEntry)?.headers
    let headers = requestHeaders ? structuredClone(requestHeaders) : []
    const contentTypeHeader = headers.find(h => h.name === 'Content-Type')
    if (contentTypeHeader) {
      if (mimeType.length === 0) {
        headers = headers.filter(h => h.name !== 'Content-Type')
      } else {
        contentTypeHeader.value = mimeType

      }
    } else {
      if (mimeType.length > 0) {
        headers.push({
          id: GenerateIdentifier(),
          name: 'Content-Type',
          value: mimeType
        })
      }
    }
    setAllowUpdateHeader(false)
    dispatch(updateRequest({
      id: requestEntry.id,
      headers
    }))
  }

  const bodyTypeMenuItems = () => {
    return BodyTypes.map(bodyType => (
      <MenuItem key={bodyType} value={bodyType}>{bodyType}</MenuItem>
    ))
  }

  const processHighlight = (code: string) => {
    switch (bodyType) {
      case BodyType.JSON:
        return highlight(code, languages.json, 'json')
      case BodyType.XML:
        return highlight(code, languages.markup, 'xml')
      default:
        return highlight(code, {}, 'text')
    }
  }

  const onUpdateFormData = (data: EditableNameValuePair[]) => {
    dispatch(updateRequest({
      id: requestEntry.id,
      bodyData: data
    }))
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
      {bodyType == BodyType.None
        ? <></>
        : bodyType == BodyType.Form
          ? <NameValueEditor values={bodyData as EditableNameValuePair[]} nameHeader='Name' valueHeader='Value' onUpdate={onUpdateFormData} />
          : bodyType == BodyType.Raw
            ? <Stack
              direction='row'
              sx={{
                borderRadius: '4px',
                overflow: 'auto',
                border: '1px solid #444!important',
              }}
            >
              <IconButton aria-label='from-file' title='Set Body from File' onClick={() => props.triggerSetBodyFromFile()} sx={{ marginRight: '4px' }}>
                <FileOpenIcon />
              </IconButton>
              <Box padding='10px'>{bodyData.length.toLocaleString()} Bytes</Box>
            </Stack>
            :
            <TextareaAutosize
              autoFocus
              maxRows={20}
              style={{
                borderStyle: 'solid',
                borderWidth: '1px',
                borderLeftColor: '#444',
                borderRightColor: '#444',
                borderTopColor: '#444',
                borderBottomColor: '#444',
                borderRadius: '4px',
                  fontFamily: 'monospace',
                fontSize: '12pt',
                outline: 'none',
                minHeight: '10vh',
                padding: '10px',
                width: '100%',
                color: '#FFFFFF',
                backgroundColor: '#202020',
                overflow: 'auto'
              }}
              value={bodyData}
              onChange={(e) => updateBodyAsText(e.target.value)} />
        // <Editor
        // autoFocus
        // padding={10}
        // style={{ fontFamily: 'monospace', minHeight: '140px' }}
        // value={bodyData.toString()}
        // highlight={code => processHighlight(code)}
        // onValueChange={updateBodyAsText}
        // />
      }
    </Stack>
  )
}
