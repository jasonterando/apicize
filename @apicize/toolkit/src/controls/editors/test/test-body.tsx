import * as React from 'react'
import Box from '@mui/material/Box'
import { useDispatch } from 'react-redux'
import { updateTest } from '../../../models/store'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-tomorrow.css'
import { BodyType, BodyTypes, RequestNameValuePair } from '@apicize/definitions/dist/models/test-request'
import { Button, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material'
import { EditableWorkbookTest } from '@apicize/definitions'

export function TestBody(props: { test: EditableWorkbookTest }) {
  const dispatch = useDispatch()
  const [body, setBody] = React.useState<BodyInit | undefined>(props.test.body)
  const [bodyType, setBodyType] = React.useState<BodyType | undefined>(props.test.bodyType ?? BodyType.Text)
  const [allowUpdateHeader, setAllowUpdateHeader] = React.useState<boolean>(false)

  React.useEffect(() => {
    setBody(props.test.body)
    const useBodyType = props.test.bodyType ?? BodyType.Text
    setBodyType(useBodyType)
    checkTypeHeader(useBodyType)
  }, [props.test])

  const updateBody = React.useCallback((val: string | undefined) => {
    setBody(val)
    dispatch(updateTest({
      body: val
    }))
  }, [])

  const updateBodyType = React.useCallback((val: BodyType | string) => {
    const bodyType = val == "" ? undefined : val as unknown as BodyType
    setBodyType(bodyType)
    dispatch(updateTest({
      bodyType: bodyType ?? null
    }))
    checkTypeHeader(bodyType)
  }, [])

  const checkTypeHeader = (val: BodyType | undefined | null) => {
    let needsContextHeaderUpdate = true
    if (val) {
      const contentTypeHeader = props.test.headers?.find(h => h.name === 'Content-Type')
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

    const headers = props.test.headers ?? []
    const contentTypeHeader = headers.find(h => h.name === 'Content-Type')
    if (contentTypeHeader) {
      contentTypeHeader.value = mimeType
    } else {
      headers.push({
        name: 'Content-Type',
        value: mimeType
      })
    }
    setAllowUpdateHeader(false)
    dispatch(updateTest({
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
    <Stack direction='column' maxWidth={1000} spacing={3}>
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
          textareaClassName='code-editor'
          value={body?.toString() ?? ""}
          style={{
            height: '400px',
            fontFamily: 'monospace'
          }}
          highlight={code => processHighlight(code)}
          onValueChange={updateBody}
        />
      </Box>
    </Stack>
  )
}
