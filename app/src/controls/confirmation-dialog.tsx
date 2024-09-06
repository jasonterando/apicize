import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { ConfirmationOptions } from '@apicize/toolkit'

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
            sx={{ padding: '24px' }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {title}
            </DialogTitle>
            <DialogContent sx={{
                paddingTop: '24px',
                paddingRight: '24px',
                paddingLeft: '24px'
            }}>
                <DialogContentText id="alert-dialog-description" sx={{ minWidth: '400px' }}>
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