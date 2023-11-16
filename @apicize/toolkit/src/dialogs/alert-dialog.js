"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertDialog = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const Button_1 = __importDefault(require("@mui/material/Button"));
const Dialog_1 = __importDefault(require("@mui/material/Dialog"));
const DialogActions_1 = __importDefault(require("@mui/material/DialogActions"));
const DialogContent_1 = __importDefault(require("@mui/material/DialogContent"));
const DialogContentText_1 = __importDefault(require("@mui/material/DialogContentText"));
const DialogTitle_1 = __importDefault(require("@mui/material/DialogTitle"));
function AlertDialog(props) {
    return ((0, jsx_runtime_1.jsxs)(Dialog_1.default, { open: props.open, onClose: () => props.onClose(false), "aria-labelledby": "alert-dialog-title", "aria-describedby": "alert-dialog-description", children: [(0, jsx_runtime_1.jsx)(DialogTitle_1.default, { id: "alert-dialog-title", children: props.title }), (0, jsx_runtime_1.jsx)(DialogContent_1.default, { children: (0, jsx_runtime_1.jsx)(DialogContentText_1.default, { id: "alert-dialog-description", children: props.message }) }), (0, jsx_runtime_1.jsxs)(DialogActions_1.default, { children: [(0, jsx_runtime_1.jsx)(Button_1.default, { onClick: () => props.onClose(true), autoFocus: props.defaultToCancel !== true, children: props.okButton }), (0, jsx_runtime_1.jsx)(Button_1.default, { onClick: () => props.onClose(false), autoFocus: props.defaultToCancel === true, children: props.cancelButton })] })] }));
}
exports.AlertDialog = AlertDialog;
//# sourceMappingURL=alert-dialog.js.map