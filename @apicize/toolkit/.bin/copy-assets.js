const fs = require('node:fs/promises');
(async () => {
    await Promise.all([
        fs.copyFile('./src/controls/context/test-context.css', './dist/controls/context/test-context.css'),
        fs.copyFile('./src/controls/editors/authorization/authorization-editor.css', './dist/controls/editors/authorization/authorization-editor.css'),
        fs.copyFile('./src/controls/editors/test/test-editor.css', './dist/controls/editors/test/test-editor.css'),
        fs.copyFile('./src/dialogs/dialogs.css', './dist/dialogs/dialogs.css')
    ])
})();

