(async () => {
    const express = require('express')
    const setupQuote = require('./quote')
    
    const app = express()
    app.use(await setupQuote())
    app.listen(8080)
})().catch((e) => {
    console.error(`${e}`)
})

