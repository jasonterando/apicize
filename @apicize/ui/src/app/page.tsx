'use client'

import {
  ConfirmationServiceProvider, Navigation, store,
  AuthorizationEditor, EnvironmentEditor, RequestGroupEditor, RequestViewer, Provider
} from '@apicize/toolkit'
import { RunRequestsFunction, WorkbookRequest, WorkbookAuthorization, WorkbookEnvironment, CancelRequestsFunction } from '@apicize/definitions'
import { Stack, Box, CssBaseline, ThemeProvider, createTheme, Button } from '@mui/material'
import { appConfigDir, appDataDir } from '@tauri-apps/api/path';
import { register } from '@tauri-apps/api/globalShortcut';
import { emit } from '@tauri-apps/api/event'
import { ToastProvider } from '@apicize/toolkit'
import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { OpenWorkbookServiceProvider } from './services/open-workbook-service';
import { TestControl } from './test';

let _configDirectory: string | undefined = undefined
let _dataDirectory: string | undefined = undefined

export default function Home() {

  const getConfigDirectory = async (): Promise<string> => {
    return _configDirectory ??= await appConfigDir()
  }

  const getDataDirectory = async (): Promise<string> => {
    return _dataDirectory ??= await appDataDir()
  }


  const runRequests: RunRequestsFunction = (requests: WorkbookRequest[], authorization: WorkbookAuthorization, environment: WorkbookEnvironment) => {
    console.log('runRequests')
    return Promise.resolve([])
  }
  // window.apicize.runRequests(requests, authorization, environment)

  const cancelRequests: CancelRequestsFunction = (ids: string[]) =>
    console.log('cancelRequets')
  // window.apicize.cancelRequests(ids)


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
    <Provider store={store}>
      {/* <main className={styles.main}> */}
      <main>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <ToastProvider>
            <OpenWorkbookServiceProvider>
              <ConfirmationServiceProvider>
                <Stack direction='row' sx={{ width: '100%', height: '100vh', display: 'flex' }}>
                  <Navigation />
                  <Box sx={{
                    height: '100vh',
                    display: 'flex',
                    flexGrow: 1
                  }}>
                    <RequestViewer runRequests={runRequests} cancelRequests={cancelRequests} />
                    <RequestGroupEditor />
                    <AuthorizationEditor />
                    <EnvironmentEditor />
                  </Box>
                </Stack>
              </ConfirmationServiceProvider>
            </OpenWorkbookServiceProvider>
          </ToastProvider>
        </ThemeProvider>
      </main>
    </Provider>
  )
}
