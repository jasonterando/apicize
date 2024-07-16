const setupQuote = async () => {
    const { open } = require('sqlite')
    const sqlite3 = require('sqlite3')
    const express = require('express')
    const router = express.Router()

    const db = await open({
        filename: ':memory:',
        driver: sqlite3.Database
    })

    await db.run('CREATE TABLE quotes (id INTEGER PRIMARY KEY AUTOINCREMENT, author TEXT NOT NULL, quote TEXT NOT NULL)')

    router.use(
        express.json({
            limit: '5mb',
            verify: (req, res, buf) => {
                req.rawBody = buf.toString();
            },
        }),
        (req, res, next) => {
            const key = req.header('x-api-key')
            if (key === '12345') {
                next()
                return
            }
            res.statusCode = 401
            res.send(JSON.stringify({ message: 'Invalid or missing API key' }))

        }
    );

    /**
     * Create a quote
     */
    router.post('/quote', async (req, res) => {
        let statusCode = 500
        let response
        try {
            const data = req.body
            const author = data.author
            const quote = data.quote
            if ((author?.length ?? 0) < 1) {
                res.statusCode = 400
                throw new Error('"author" is required')
            }
            if ((quote?.length ?? 0) < 1) {
                res.statusCode = 400
                throw new Error('"quote" is required')
            }

            const r = await db.run('INSERT INTO quotes (author, quote) VALUES (?, ?)', [author, quote])
            response = { id: r.lastID }
            statusCode = 200
        } catch (e) {
            response = {
                message: e.message
            }
        }
        res.statusCode = statusCode
        res.set({ 'Content-Type': 'application/json' })
        res.send(JSON.stringify(response))
    })

    /**
     * Retrieve list of quotes
     */
    router.get('/quote', async (req, res) => {
        const results = await db.get('SELECT id, author, quote FROM quotes')
        res.set({ 'Content-Type': 'application/json' })
        res.send(JSON.stringify(results))
    })

    /**
     * Retrieve specific quote
     */
    router.get('/quote/:id', async (req, res) => {
        let statusCode = 200
        let results = await db.get('SELECT id, author, quote FROM quotes WHERE id=?', req.params.id)
        if (!results) {
            results = {
                message: 'Not Found'
            }
            statusCode = 404
        }
        res.set({ 'Content-Type': 'application/json' })
        res.statusCode = statusCode
        res.send(JSON.stringify(results))
    })

    /**
     * Update quote
     */
    router.put('/quote/:id', async (req, res) => {
        let response
        try {
            const body = req.body
            if (body) {
                const fields = []
                const values = []
                if (body.author) {
                    fields.push('author')
                    values.push(body.author.toString())
                }
                if (body.quote) {
                    fields.push('quote')
                    values.push(body.quote.toString())
                }

                if (fields.length === 0) {
                    throw new Error('Update information is invalid')
                }

                const sql = `UPDATE quotes SET ${fields.map(f => f + '=?').join(', ')} WHERE id=?`
                values.push(req.params.id)
                response = await db.run(sql, values)
            } else {
                throw new Error('No update information in body')
            }
        } catch (e) {
            res.statusCode = 400
            response = {
                message: e.message
            }
        }

        res.set({ 'Content-Type': 'application/json' })
        res.send(JSON.stringify(response))
    })


    /**
     * Delete quote quote
     */
    router.delete('/quote/:id', async (req, res) => {
        let statusCode = 200
        let results
        try {
            results = await db.get('DELETE FROM quotes WHERE id=?', req.params.id)
        } catch (e) {
            statusCode = 500
            results = {
                message: `${e}`
            }
        }
        res.statusCode = statusCode
        res.set({ 'Content-Type': 'application/json' })
        res.send(JSON.stringify(results))
    })

    return router
}

module.exports = setupQuote