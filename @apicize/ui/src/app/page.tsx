  'use client'

import {
  ConfirmationServiceProvider, Navigation, workbookStore,
  AuthorizationEditor, EnvironmentEditor, RequestGroupEditor, RequestViewer, defaultWorkbookState,
} from '@apicize/toolkit'
import { WorkbookRequest, WorkbookAuthorization, WorkbookEnvironment } from '@apicize/common'
import { Stack, Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { ToastProvider } from '@apicize/toolkit'
import { WorkbookProvider } from './providers/workbook-provider';
import { Provider } from 'react-redux';
import React from 'react'
import { emit } from '@tauri-apps/api/event'

export default function Home() {
  const darkTheme = createTheme({
    components: {
      // MuiOutlinedInput: {
      //   styleOverrides: {
      //     root: {
      //       "& .MuiOutlinedInput-notchedOutline": {
      //         border: `5px solid green`,
      //       },
      //       "&.Mui-focused": {
      //         "& .MuiOutlinedInput-notchedOutline": {
      //           border: `5px dotted red`,
      //         },
      //       }
      //     },
      //   }
      // },

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
      // MuiListItemButton: {
      //   defaultProps: {
      //     sx: {
      //       paddingTop: '2px',
      //       paddingBottom: '2px'
      //     }
      //   },
      //   styleOverrides: {
      //     root: {
      //       sx: {
      //         paddingTop: '2px',
      //         paddingBottom: '2px'
      //         }
      //     }
      //   }
      // },
      // MuiFormControlLabel: {
      //   defaultProps: {
      //     sx: {paddingLeft: '0', marginLeft: '0' }
      //   },
      //   styleOverrides: {
      //     label: {
      //       minWidth: '120px'
      //     }
      //   }
      // },
      // MuiOutlinedInput: {
      //   styleOverrides: {
      //     input: {
      //       padding: '4px 8px'
      //     }
      //   }
      // },
      // MuiTextField: {
      //   defaultProps: {

      //     sx: {marginLeft: '14px'}
      //   }
      // },
      MuiTypography: {
        styleOverrides: {
          h1: {
            fontSize: '24px',
            marginTop: '8px',
            marginBottom: '24px'
          }
        }
      }
    },
    palette: {
      mode: 'dark',
    },
    // typography: {
    //   fontSize: 14
    // },
    // spacing: 1
  })


  return (
    <Provider store={workbookStore}>
      {/* <main className={styles.main}> */}
      <main>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <ToastProvider>
            <ConfirmationServiceProvider>
              <WorkbookProvider>
                <Stack direction='row' sx={{ width: '100%', height: '100vh', display: 'flex' }}>
                  <Navigation
                    triggerNew={() => emit('new')}
                    triggerOpen={() => emit('open')}
                    triggerSave={() => emit('save')}
                    triggerSaveAs={() => emit('saveAs')}
                  />
                  <Box sx={{
                    height: '100vh',
                    display: 'flex',
                    flexGrow: 1
                  }}>
                    <RequestViewer triggerRun={() => emit("run")} />
                    <RequestGroupEditor />
                    <AuthorizationEditor />
                    <EnvironmentEditor />
                  </Box>
                </Stack>
              </WorkbookProvider>
            </ConfirmationServiceProvider>
          </ToastProvider>
        </ThemeProvider>
      </main>
    </Provider>
  )
}
