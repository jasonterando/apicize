import './dialogs.css'
import { AppBar, Button, Dialog, Divider, Grid, IconButton, List, ListItem, ListItemButton, ListItemText, Slide, Stack, TextField, Toolbar, Typography } from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import CloseIcon from '@mui/icons-material/Close';
import React, { useEffect, useRef, useState } from "react";
import { StorageEntry } from "@apicize/definitions";
import DeleteIcon from '@mui/icons-material/DeleteOutlined'

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

/**
 * Rudimentary file dialog because Electron can't seem to fix file dialog on Linux
 * @param props 
 * @returns 
 */
export function FileDialog(props: {
  open: boolean,
  title: string,
  okButton: string,
  directory: string,
  fileName?: string,
  mustExist: boolean,
  onOk: (...name: string[]) => Promise<void>,
  onDelete: (entry: StorageEntry) => Promise<boolean>,
  onClose: () => void,
  onListFiles: (directory: string) => Promise<StorageEntry[]>
}) {

  const [disableOk, setDisableOk] = useState(true)
  const [fileName, setFileName] = useState<string>('')
  const [files, setFiles] = useState<StorageEntry[]>([])

  useEffect(() => {
    if (props.open) {
      (async () => {
        const files = await props.onListFiles(props.directory)
        setFiles(files)
      })()
    }
  }, [props.directory, props.open])

  const fmt = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short',
    timeStyle: 'short'
  })

  const validateFileName = (newFileName: string) => {
    let isValid = newFileName.length > 0 && ! /[\<\>\:\"\/\\\|\?\*]/.test(newFileName)
    if (isValid && props.mustExist) {
      isValid = files.find(w => w.displayName === newFileName) !== undefined
    }
    setDisableOk(!isValid)
  }

  const updateFileName = (newFileName: string) => {
    setFileName(newFileName)
    validateFileName(newFileName)
    inputRef.current?.focus()
  }

  const deleteFile = async (entry: StorageEntry) => {
    if (await props.onDelete(entry)) {
      const files = await props.onListFiles(props.directory)
      setFiles(files)
    }
  }

  const ok = async () => {
    await props.onOk(props.directory, fileName)
  }

  const inputRef = useRef<HTMLInputElement>(null);
  let ctr = 0
  return (
    <Dialog
      fullScreen
      className='dialog'
      open={props.open}
      onClose={props.onClose}
      TransitionComponent={Transition}

    >
      <Stack display='flex' height='100%'>
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={props.onClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              {props.title}
            </Typography>
          </Toolbar>
        </AppBar>
        <Stack className='dialog-contents' display='flex' flex='auto'>
          <TextField
            autoFocus
            label="Workbook Name"
            aria-label="Workbook Name"
            fullWidth
            inputRef={inputRef}
            value={fileName}
            onChange={e => {
              validateFileName(e.target.value)
              setFileName(e.target.value)
            }}
            onKeyDown={e => {
              if ((!(e.ctrlKey || e.altKey || e.shiftKey)) && e.key == 'Enter') {
                ok()
              }
            }}
          />
          <Grid container spacing={4} marginTop='0.5em'>
            {
              files.map(w => (
                <Grid item xs={2} key={++ctr}>
                  <IconButton sx={{ float: 'right', position: 'relative', zIndex: '100', color: 'black' }} onClick={async () => await deleteFile(w)}>
                    <DeleteIcon />
                  </IconButton>
                  <Button variant="contained" fullWidth
                    style={{ textTransform: 'none', justifyContent: 'left', textAlign: 'left', display: 'block', position: 'relative', top: '-44px' }}
                    onClick={_ => updateFileName(w.displayName)}
                    onDoubleClick={_ => {
                      updateFileName(w.displayName)
                      ok()
                    }}
                  >
                    <div className='filename'>{w.displayName}</div>
                    <div className='filedate'>{fmt.format(w.updatedAt)}</div>
                  </Button>
                </Grid>
              ))
            }
          </Grid>
        </Stack>
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <Typography sx={{ ml: 2, flex: 1, marginLeft: 0 }} component="div">
              Working Directory: {props.directory}
            </Typography>
            <Button variant="contained" color='success' disabled={disableOk} onClick={ok}>
              {props.okButton}
            </Button>
            <Button variant="outlined" sx={{ marginLeft: '1em' }} onClick={props.onClose}>
              Cancel
            </Button>
          </Toolbar>
        </AppBar>
      </Stack>
    </Dialog>
  )
}