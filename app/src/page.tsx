'use client'

import {
  Navigation, RootProvider,
} from '@apicize/toolkit'
import type { } from '@mui/x-tree-view/themeAugmentation';
import { Stack, CssBaseline, ThemeProvider, createTheme, alpha } from '@mui/material'
import { } from '@apicize/toolkit'
import { ApicizeTauriProvider } from './providers/apicize-tauri.provider';
import React from 'react'
import { emit } from '@tauri-apps/api/event'
import "typeface-open-sans"
import Pane from './pane';
import { ClipboardProvider } from './providers/clipboard.provider';
import { ToastProvider } from './providers/toast.provider';
import { ConfirmationProvider } from './providers/confirmation.provider';

export default function Home() {

  const darkTheme = createTheme({
    typography: {
      fontSize: 12,
      fontFamily: "'Open Sans','sans'"
    },
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            minWidth: '120px'
          }
        }
      },
      MuiTreeItem: {
        styleOverrides: {
          root: {
            // There is no way to explicitly set focus in MUI TreeView, so don't use it
            "& > .MuiTreeItem-content.Mui-focused": {
              backgroundColor: alpha("#000", 0)
            },
            "& > .MuiTreeItem-content.Mui-selected": {
              backgroundColor: alpha("#FFF", 0.2)
            }
          }
        }
      },

      MuiIconButton: {
        defaultProps: {
          sx: { padding: '3px' }
        }
      },
      MuiListItemIcon: {
        defaultProps: {
          sx: {
            minWidth: '36px'
          }
        }
      },
      // .css-18ax2bx-MuiInputBase-input-MuiOutlinedInput-input {
      MuiInputBase: {
        styleOverrides: {
          input: {
            "&.code": {
              fontFamily: 'monospace'
            }
          }
        }
      },
      MuiTypography: {
        styleOverrides: {
          h1: {
            fontSize: '1.5rem',
            fontWeight: 'normal',
            marginTop: '0.1rem',
            marginBottom: '1.5rem'
          },
          h2: {
            fontSize: '1.3rem',
            fontWeight: 'normal',
            marginTop: '1.5rem',
            marginBottom: '1.0rem',
          },
          h3: {
            fontSize: '1.1rem',
            fontWeight: 'normal',
            marginTop: '1.5rem',
            marginBottom: '1.0rem',
          }
        }
      }
    },
    palette: {
      mode: 'dark',
    },
  })

  return (
    <RootProvider>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <ToastProvider>
          <ConfirmationProvider>
            <ClipboardProvider>
              <ApicizeTauriProvider>
                <Stack direction='row' sx={{ width: '100%', height: '100vh', display: 'flex', padding: '0' }}>
                  <Navigation
                    triggerNew={() => emit('action', 'new')}
                    triggerOpen={() => emit('action', 'open')}
                    triggerSave={() => emit('action', 'save')}
                    triggerSaveAs={() => emit('action', 'saveAs')}
                  />
                  <Pane />
                </Stack>
              </ApicizeTauriProvider>
            </ClipboardProvider>
          </ConfirmationProvider>
        </ToastProvider>
      </ThemeProvider>
    </RootProvider>
  )
}

