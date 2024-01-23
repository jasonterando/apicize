import * as React from 'react'
import Box from '@mui/material/Box'
import { useDispatch, useSelector } from 'react-redux'
import { WorkbookState, updateRequest } from '../../../models/store'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-tomorrow.css'
import { Button, FormControl, InputLabel, MenuItem, Select, Stack } from '@mui/material'
import { BodyType, BodyTypes } from '@apicize/common'
import { GenerateIdentifier } from '../../../services/random-identifier-generator'
import { EditableNameValuePair } from '../../../models/workbook/editable-name-value-pair'
import { NameValueEditor } from '../name-value-editor'
import { castEntryAsRequest } from '../../../models/workbook/helpers/editable-workbook-request-helpers'

export function RequestBodyEditor() {
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

  const updateBodyAsText = React.useCallback((val: string | undefined) => {
    // setBodyData(val ?? '')
    dispatch(updateRequest({
      id: requestEntry.id,
      bodyData: val
    }))
  }, [])

  const updateBodyType = React.useCallback((val: BodyType | string) => {
    const newBodyType = (val == "" ? undefined : val as unknown as BodyType) ?? BodyType.Text
    dispatch(updateRequest({
      id: requestEntry.id,
      bodyType: newBodyType
    }))
    checkTypeHeader(newBodyType)
  }, [])

  const checkTypeHeader = (val: BodyType | undefined | null) => {
    let needsContextHeaderUpdate = true
    if (val) {
      const contentTypeHeader = castEntryAsRequest(requestEntry)?.headers?.find(h => h.name === 'Content-Type')
      if (contentTypeHeader) {
        needsContextHeaderUpdate = contentTypeHeader.value.indexOf(val.toLowerCase()) === -1
      }
    }
    setAllowUpdateHeader(needsContextHeaderUpdate)
  }

  const updateTypeHeader = () => {
    let mimeType: string
    switch (bodyType) {
      case BodyType.JSON:
        mimeType = 'application/json'
        break
      case BodyType.XML:
        mimeType = 'application/xml'
        break
      case BodyType.Text:
        mimeType = 'text/plain'
        break
      case BodyType.Form:
        mimeType = 'application/x-www-form-urlencoded'
        break
      default:
        return
    }

    const headers = castEntryAsRequest(requestEntry)?.headers ?? []
    const contentTypeHeader = headers.find(h => h.name === 'Content-Type')
    if (contentTypeHeader) {
      contentTypeHeader.value = mimeType
    } else {
      headers.push({
        id: GenerateIdentifier(),
        name: 'Content-Type',
        value: mimeType
      })
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
      {bodyType == BodyType.Form
        ? <NameValueEditor values={bodyData as EditableNameValuePair[]} nameHeader='Name' valueHeader='Value' onUpdate={onUpdateFormData} />
        : <Box
          sx={{
            width: '100%',
            border: 0
          }}
        >
          <Editor
            autoFocus
            padding={10}
            style={{fontFamily: 'monospace', minHeight: '200px' }}
            value={bodyData as string}
            highlight={code => processHighlight(code)}
            onValueChange={updateBodyAsText}
          />
        </Box>
      }
    </Stack>
  )
}
