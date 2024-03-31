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
    await db.run('INSERT INTO quotes (id, author, quote) VALUES (1, "Mark Twain", "Politicians and diapers must be changed often, and for the same reason.")')

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
            res.send(JSON.stringify({message: 'Invalid or missing API key'}))

        }
    );

    router.get('/quote', async (req, res) => {
        const results = await db.get('SELECT id, author, quote FROM quotes')
        res.set({ 'Content-Type': 'application/json' })
        res.send(JSON.stringify(results))
    })

    router.get('/quote/:id', async (req, res) => {
        let results = await db.get('SELECT id, author, quote FROM quotes WHERE id=?', req.params.id)
        if (!results) {
            results = {
                message: 'Not Found'
            }
            res.statusCode = 404
        }
        res.set({ 'Content-Type': 'application/json' })
        res.send(JSON.stringify(results))
    })

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

    return router
}

module.exports = setupQuote