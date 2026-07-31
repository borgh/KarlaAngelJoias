import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { nanoid } from 'nanoid'
import { requireAuth, requirePermission } from '../auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    cb(null, `${nanoid()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new Error('Tipo de arquivo não suportado. Use JPG, PNG, WEBP, GIF ou SVG.'))
    }
    cb(null, true)
  },
})

export const uploadRouter = Router()

uploadRouter.post(
  '/',
  requireAuth,
  requirePermission('canCreate'),
  (req, res) => {
    upload.single('file')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message })
      if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' })
      res.status(201).json({ url: `/uploads/${req.file.filename}` })
    })
  }
)
