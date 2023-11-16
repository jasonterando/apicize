import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export function AlertDialog(props: {
    open: boolean,
    title: string,
    message: string,
    okButton: string,
    defaultToCancel?: boolean,
    cancelButton?: string,
    onClose: (ok: boolean) => void
  }) {

    return (
        <Dialog
            open={props.open}
            onClose={() => props.onClose(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {props.title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {props.message}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => props.onClose(true)} autoFocus={props.defaultToCancel !== true}>{props.okButton}</Button>
                <Button onClick={() => props.onClose(false)} autoFocus={props.defaultToCancel === true}>{props.cancelButton}</Button>
            </DialogActions>
        </Dialog>
    );
}