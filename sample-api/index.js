(async () => {
    const express = require('express')
    const setupQuote = require('./quote')
    const setupImage = require('./image')
    
    const app = express()
    app.use(await setupQuote())
    app.use(setupImage())
    app.listen(8080)
})().catch((e) => {
    console.error(`${e}`)
})

