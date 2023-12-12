import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

export interface ConfirmationOptions {
    // catchOnCancel?: boolean,
    title?: string,
    message?: string,
    okButton?: string,
    defaultToCancel?: boolean,
    cancelButton?: string
}

interface ConfirmationDialogProps extends ConfirmationOptions {
    open: boolean
    onSubmit: () => void
    onClose: () => void
    onClosed: () => void
  }


export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    open,
    title,
    message,
    okButton,
    defaultToCancel,
    cancelButton,
    onSubmit,
    onClose,
    onClosed
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClosed}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description" sx={{minWidth: '400px'}}>
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
            <Button onClick={onSubmit} autoFocus={defaultToCancel !== true}>{okButton}</Button>
                <Button onClick={onClose} autoFocus={defaultToCancel === true}>{cancelButton}</Button>
            </DialogActions>
        </Dialog>
    )
}