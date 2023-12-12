import './app.css'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Provider } from 'react-redux'
import { store, ConfirmationServiceProvider, ToastServiceProvider, DndProvider, HTML5Backend } from '@apicize/toolkit'
import { Main } from './main'
import { Events } from './events'

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

export function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={darkTheme}>
        <DndProvider backend={HTML5Backend}>
        <ConfirmationServiceProvider>
          <ToastServiceProvider>
            <CssBaseline />
            <Main />
            <Events />
          </ToastServiceProvider>
        </ConfirmationServiceProvider>
        </DndProvider>
      </ThemeProvider>
    </Provider>
  )
}
