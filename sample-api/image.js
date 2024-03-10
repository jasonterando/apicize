const { raw } = require('body-parser')
const jimp = require('jimp')
const express = require('express')
const router = express.Router()

const setupImage = () => {
    async function rotate(degress, req, res) {
        try {
            const ctype = req.get('Content-Type')
            if (!(ctype?.length ?? 0) > 0) {
                throw new Error('Content-Type header is required')
            }
            const image = await jimp.read(req.body)
            const result = await image.rotate(degress).getBufferAsync(ctype)
            res.setHeader('Content-Type', ctype)
            res.send(result)
        } catch (e) {
            res.statusCode = 400
            res.send(JSON.stringify({
                message: e.message
            }))
        }
    }

    router.use(
        express.raw({
            type: 'image/*',
            limit: '100mb'
        })
    )

    router.post('/right', async (req, res) => {
        await rotate(90, req, res)
    })

    router.post('/flip', async (req, res) => {
        await rotate(180, req, res)
    })

    router.post('/left', async (req, res) => {
        await rotate(270, req, res)
    })

    return router
}

module.exports = setupImage