const fs = require('node:fs/promises');

(async () => {
    await fs.mkdir('./dist/controls/context', {recursive:true})
    await fs.mkdir('./dist/controls/navigation', {recursive:true})
    
    await fs.mkdir('./dist/dialogs', {recursive:true})
    await fs.copyFile('./src/controls/styles.css', './dist/controls/styles.css')
    await fs.copyFile('./src/dialogs/dialogs.css', './dist/dialogs/dialogs.css')
    await fs.copyFile('./src/controls/navigation/navigation.css', './dist/controls/navigation/navigation.css')
})();
