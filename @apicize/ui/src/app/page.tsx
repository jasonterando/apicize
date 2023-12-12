'use client'

import styles from './page.module.css'
import {
  ConfirmationServiceProvider, Provider, ToastServiceProvider, Navigation, store,
  AuthorizationEditor, EnvironmentEditor, RequestGroupEditor, RequestViewer
} from '@apicize/toolkit'
import { RunRequestsFunction, WorkbookRequest, WorkbookAuthorization, WorkbookEnvironment, CancelRequestsFunction } from '@apicize/definitions'
import { Stack, Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material'

export default function Home() {

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
          <ConfirmationServiceProvider>
            <CssBaseline />
            <ToastServiceProvider>
              {/* <CssBaseline /> */}
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
              {/* <Events /> */}
            </ToastServiceProvider>
          </ConfirmationServiceProvider>


          {/* <Greet />
        <div className={styles.description}>
          <p>
            Get started by editing&nbsp;
            <code className={styles.code}>src/app/page.tsx</code>
          </p>
          <div>
            <a
              href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              By{' '}
              <Image
                src="/vercel.svg"
                alt="Vercel Logo"
                className={styles.vercelLogo}
                width={100}
                height={24}
                priority
              />
            </a>
          </div>
        </div>

        <div className={styles.center}>
          <Image
            className={styles.logo}
            src="/next.svg"
            alt="Next.js Logo"
            width={180}
            height={37}
            priority
          />
        </div>

        <div className={styles.grid}>
          <a
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2>
              Docs <span>-&gt;</span>
            </h2>
            <p>Find in-depth information about Next.js features and API.</p>
          </a>

          <a
            href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2>
              Learn <span>-&gt;</span>
            </h2>
            <p>Learn about Next.js in an interactive course with&nbsp;quizzes!</p>
          </a>

          <a
            href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2>
              Templates <span>-&gt;</span>
            </h2>
            <p>Explore starter templates for Next.js.</p>
          </a>

          <a
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2>
              Deploy <span>-&gt;</span>
            </h2>
            <p>
              Instantly deploy your Next.js site to a shareable URL with Vercel.
            </p>
          </a>
        </div> */}
        </ThemeProvider>
      </main>
    </Provider>
  )
}
