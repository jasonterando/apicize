(async () => {
    const { open } = require('sqlite')
    const sqlite3 = require('sqlite3')
    const express = require('express')
    const morgan = require('morgan')
    
    const db = await open({
        filename: ':memory:',
        driver: sqlite3.Database
    })

    await db.run('CREATE TABLE quotes (id INTEGER PRIMARY KEY AUTOINCREMENT, author TEXT NOT NULL, quote TEXT NOT NULL)')
    await db.run('INSERT INTO quotes (id, author, quote) VALUES (1, "Mark Twain", "Politicians and diapers must be changed often, and for the same reason.")')

    const app = express()

    morgan.token('body', (req, res) => JSON.stringify(req.body));
    app.use(morgan(':method :url :status :response-time ms - :res[content-length] :body - :req[content-length]'));

    // app.use(morgan('dev'));
    // app.use(express.json())
    app.use(
        express.json({
          limit: '5mb',
          verify: (req, res, buf) => {
            req.rawBody = buf.toString();
            console.log(`Raw body: ${req.rawBody}`)
          },
        })
      );
      

    app.get('/quote', async (req, res) => {
        const results = await db.get('SELECT id, author, quote FROM quotes')
        res.set({'Content-Type': 'application/json'})
        res.send(JSON.stringify(results))
    })


    app.get('/quote/:id', async (req, res) => {
        let results = await db.get('SELECT id, author, quote FROM quotes WHERE id=?', req.params.id)
        if (! results) {
            results = {
                message: 'Not Found'
            }
            res.statusCode = 404
        }
        res.set({'Content-Type': 'application/json'})
        res.send(JSON.stringify(results))
    })

    app.put('/quote/:id', async (req, res) => {
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
        } catch(e) {
            res.statusCode = 400
            response = {
                message: e.message
            }
        }

        res.set({'Content-Type': 'application/json'})
        res.send(JSON.stringify(response))
    })

    app.listen(8080)
})().catch((e) => {
    console.error(`${e}`)
})
