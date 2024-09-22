import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { useFeedback } from '@apicize/toolkit'
import { observer } from 'mobx-react-lite'

export const ConfirmationDialog = observer(() => {
    const feedback = useFeedback()
    return (
        <Dialog
            open={feedback.confirmOpen}
            onClose={() => feedback.closeConfirm(false)}
            sx={{ padding: '24px' }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {feedback.confirmOptions.title ?? 'Confirm'}
            </DialogTitle>
            <DialogContent sx={{
                paddingTop: '24px',
                paddingRight: '24px',
                paddingLeft: '24px'
            }}>
                <DialogContentText id="alert-dialog-description" sx={{ minWidth: '400px' }}>
                    {feedback.confirmOptions.message ?? 'Proceed?'}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => feedback.closeConfirm(true)} autoFocus={feedback.confirmOptions.defaultToCancel !== true}>
                    {feedback.confirmOptions.okButton ?? 'Ok'}
                </Button>
                <Button onClick={() => feedback.closeConfirm(false)} autoFocus={feedback.confirmOptions.defaultToCancel === true}>
                    {feedback.confirmOptions.cancelButton ?? 'Cancel'}
                </Button>
            </DialogActions>
        </Dialog>
    )
})