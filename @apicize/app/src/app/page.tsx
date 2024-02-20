'use client'

import {
  ConfirmationServiceProvider, Navigation, workbookStore,
  AuthorizationEditor, ScenarioEditor, RequestEditor,
} from '@apicize/toolkit'
import type { } from '@mui/x-tree-view/themeAugmentation';
import { Stack, Box, CssBaseline, ThemeProvider, createTheme, alpha } from '@mui/material'
import { ToastProvider } from '@apicize/toolkit'
import { WorkbookProvider } from './providers/workbook-provider';
import { Provider } from 'react-redux';
import React, { useEffect } from 'react'
import { emit } from '@tauri-apps/api/event'
import "typeface-open-sans"

export default function Home() {
  const darkTheme = createTheme({
    typography: {
      fontFamily: [
        'Open Sans',
        'sans',
      ].join(','),
    },
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
            fontSize: '26px',
            fontWeight: 'normal',
            marginTop: '8px',
            marginBottom: '26px'
          },
          h2: {
            fontSize: '22px',
            fontWeight: 'normal',
            marginTop: '8px',
            marginBottom: '22px',
            paddingTop: '4px',
          },
          h3: {
            fontSize: '18px',
            fontWeight: 'normal',
            marginTop: '8px',
            marginBottom: '18px',
            paddingTop: '4px',
          }
        }
      }
    },
    palette: {
      mode: 'dark',
    },
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
                <Stack direction='row' sx={{ width: '100%', height: '100vh', display: 'flex', padding: '0' }}>
                  <Navigation
                    triggerNew={() => emit('action', 'new')}
                    triggerOpen={() => emit('action', 'open')}
                    triggerSave={() => emit('action', 'save')}
                    triggerSaveAs={() => emit('action', 'saveAs')}
                  />
                  <Box sx={{
                    // height: '100vh',
                    display: 'flex',
                    flexDirection: 'row',
                    flexGrow: 1,
                  }}>
                    <RequestEditor
                      triggerRun={() => emit('action', 'run')}
                      triggerCancel={() => emit('action', 'cancel')}
                      triggerCopyTextToClipboard={(text?: string) => {
                        emit("copyText", text)
                      }}
                      triggerCopyImageToClipboard={(base64?: string) => {
                        emit("copyImage", base64)
                      }}
                    />
                    <AuthorizationEditor triggerClearToken={() => emit("clearToken")} />
                    <ScenarioEditor />
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
