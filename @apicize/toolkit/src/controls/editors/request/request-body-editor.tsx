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

export function RequestBodyEditor() {
  const dispatch = useDispatch()

  const request = useSelector((state: WorkbookState) => state.activeRequest)
  const [body, setBody] = React.useState<BodyInit | undefined>(request?.body)
  const [bodyType, setBodyType] = React.useState<BodyType | undefined>(request?.bodyType ?? BodyType.Text)
  const [allowUpdateHeader, setAllowUpdateHeader] = React.useState<boolean>(false)

  React.useEffect(() => {
    setBody(request?.body)
    const useBodyType = request?.bodyType ?? BodyType.Text
    setBodyType(useBodyType)
    checkTypeHeader(useBodyType)
  }, [request])

  if(! request) {
    return null
  }

  const updateBody = React.useCallback((val: string | undefined) => {
    setBody(val)
    dispatch(updateRequest({
      id: request.id,
      body: val
    }))
  }, [])

  const updateBodyType = React.useCallback((val: BodyType | string) => {
    const bodyType = val == "" ? undefined : val as unknown as BodyType
    setBodyType(bodyType)
    dispatch(updateRequest({
      id: request.id,
      bodyType: bodyType ?? null
    }))
    checkTypeHeader(bodyType)
  }, [])

  const checkTypeHeader = (val: BodyType | undefined | null) => {
    let needsContextHeaderUpdate = true
    if (val) {
      const contentTypeHeader = request.headers?.find(h => h.name === 'Content-Type')
      if (contentTypeHeader) {
        needsContextHeaderUpdate = contentTypeHeader.value.indexOf(val.toLowerCase()) === -1
      }
    }
    setAllowUpdateHeader(needsContextHeaderUpdate)
  }

  const updateTypeHeader = () => {
    let mimeType: string
    switch(bodyType) {
      case BodyType.JSON:
        mimeType = 'application/json'
        break
      case BodyType.XML:
        mimeType = 'application/xml'
        break
      case BodyType.Text:
        mimeType = 'text/plain'
        break
      default:
        return
    }

    const headers = request.headers ?? []
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
      id: request.id,
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
      <Box
        sx={{
          width: '100%',
          border: 0
        }}
      >
        <Editor
          autoFocus
          padding={10}
          className='code-editor'
          value={body?.toString() ?? ""}
          highlight={code => processHighlight(code)}
          onValueChange={updateBody}
        />
      </Box>
    </Stack>
  )
}
