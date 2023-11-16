import { TextField, Grid, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { useEffect, useState } from 'react'
import { updateTest } from '../../../models/store'
import { useDispatch } from 'react-redux'
import { EditableWorkbookTest, Method, Methods } from '@apicize/definitions'

import './test-editor.css'

export function TestParameters(props: { test: EditableWorkbookTest }) {
    const dispatch = useDispatch()

    const [name, setName] = useState<string | undefined>(props.test.name)
    const [url, setURL] = useState<string | undefined>(props.test.url)
    const [method, setMethod] = useState<string | undefined>(props.test.method ?? Method.Get)

    useEffect(() => {
        setName(props.test.name ?? '')
        setURL(props.test.url ?? '')
        setMethod(props.test.method ?? '')
    }, [props.test])

    const updateName = (name: string | undefined) => {
        dispatch(updateTest({
            name
        }))
    }

    const updateURL = (url: string | undefined) => {
        dispatch(updateTest({
            url
        }))
    }

    const updateMethod = (method: string | undefined) => {
        dispatch(updateTest({
            method
        }))
    }

    const methodMenuItems = () => {
        return Methods.map(method => (
            <MenuItem key={method} value={method}>{method}</MenuItem>
        ))
    }

    return (
        <Grid container direction={'column'} spacing={3} maxWidth={1000}>
            <Grid item>
                <TextField
                    id='request-name'
                    label="Name"
                    aria-label='name'
                    // size="small"
                    value={name}
                    onChange={e => updateName(e.target.value)}
                    fullWidth
                />
            </Grid>
            <Grid item>
                <TextField
                    id='request-url'
                    label="URL"
                    aria-label='url'
                    // size="small"
                    value={url}
                    onChange={e => updateURL(e.target.value)}
                    fullWidth
                />
            </Grid>
            <Grid item>
                <FormControl>
                    <InputLabel id='request-method-label-id'>Method</InputLabel>
                    <Select
                        labelId='request-method-label-id'
                        id="request-method"
                        value={method}
                        label="Method"
                        onChange={e => updateMethod(e.target.value)}
                    >
                        {methodMenuItems()}
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
    )
}