  'use client'

import {
  ConfirmationServiceProvider, Navigation, workbookStore,
  AuthorizationEditor, EnvironmentEditor, RequestEditor,
} from '@apicize/toolkit'
import { Stack, Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { ToastProvider } from '@apicize/toolkit'
import { WorkbookProvider, registerKeyboardShortcuts } from './providers/workbook-provider';
import { Provider } from 'react-redux';
import React, { useEffect } from 'react'
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
          },
          h2: {
            fontSize: '22px',
            marginTop: '8px',
            marginBottom: '22px'
          },
          h3: {
            fontSize: '20px',
            marginTop: '8px',
            marginBottom: '20px'
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

  useEffect(() => {
    registerKeyboardShortcuts()
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
                <Stack direction='row' sx={{ width: '100%', height: '100vh', display: 'flex', bottom: 0 }}>
                  <Navigation
                    triggerNew={() => emit('new')}
                    triggerOpen={() => emit('open')}
                    triggerSave={() => emit('save')}
                    triggerSaveAs={() => emit('saveAs')}
                  />
                  <Box sx={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'row',
                    flexGrow: 1,
                    bottom: 0
                  }}>
                    <RequestEditor triggerRun={() => emit("run")} triggerCancel={() => emit("cancel")} />
                    <AuthorizationEditor triggerClearToken={() => emit("clearToken")} />
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
