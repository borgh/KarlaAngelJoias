import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { authRouter } from './routes/auth.js'
import { productsRouter } from './routes/products.js'
import { categoriesRouter } from './routes/categories.js'
import { contentRouter } from './routes/content.js'
import { carouselRouter } from './routes/carousels.js'
import { usersRouter } from './routes/users.js'
import { uploadRouter, UPLOAD_DIR } from './routes/upload.js'
import { settingsRouter } from './routes/settings.js'
import { pushRouter } from './routes/push.js'
import { ensureVapidKeys } from './services/notify.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 4000

const app = express()
app.set('trust proxy', 1)

// CORS: em produção, o site público e o admin acessam a API através do
// proxy interno do próprio Nginx de cada domínio (mesma origem), então
// isso serve principalmente para desenvolvimento local (portas diferentes).
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174').split(',')
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d' }))

// Rate limit simples e sem dependências para a rota de login.
const loginAttempts = new Map()
app.use('/api/auth/login', (req, res, next) => {
  const key = req.ip
  const entry = loginAttempts.get(key) || { count: 0, resetAt: Date.now() + 15 * 60 * 1000 }
  if (Date.now() > entry.resetAt) {
    entry.count = 0
    entry.resetAt = Date.now() + 15 * 60 * 1000
  }
  entry.count += 1
  loginAttempts.set(key, entry)
  if (entry.count > 20) {
    return res.status(429).json({ error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' })
  }
  next()
})

app.get('/up', (req, res) => res.status(200).send('ok'))

app.use('/api/auth', authRouter)
app.use('/api/products', productsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/site-content', contentRouter)
app.use('/api/carousels', carouselRouter)
app.use('/api/users', usersRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/push', pushRouter)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Erro interno.' })
})

ensureVapidKeys()

app.listen(PORT, () => {
  console.log(`API Karla Angel Joias rodando na porta ${PORT}`)
})
