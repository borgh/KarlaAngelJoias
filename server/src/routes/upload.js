import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { nanoid } from 'nanoid'
import { spawn } from 'node:child_process'
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

// -----------------------------------------------------------------
// Vídeo de produto. O arquivo original (qualquer formato de celular,
// inclusive .mov/HEVC do iPhone, que o Chrome não toca) é convertido
// pelo ffmpeg para MP4 H.264 de até 1280px, leve e com "faststart"
// (começa a tocar antes de baixar tudo), e ganha uma capa .jpg.
// -----------------------------------------------------------------
const VIDEO_EXT = new Set(['.mp4', '.mov', '.m4v', '.webm', '.3gp', '.avi', '.mkv'])
const MAX_VIDEO_MB = 150

const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `tmp-${nanoid()}${path.extname(file.originalname).toLowerCase() || '.mp4'}`),
  }),
  limits: { fileSize: MAX_VIDEO_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (file.mimetype.startsWith('video/') || VIDEO_EXT.has(ext)) return cb(null, true)
    cb(new Error('Envie um arquivo de vídeo (MP4, MOV, WEBM…).'))
  },
})

function runFfmpeg(args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args])
    let stderr = ''
    proc.stderr.on('data', (d) => (stderr += d.toString()))
    const timer = setTimeout(() => proc.kill('SIGKILL'), timeoutMs)
    proc.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
    proc.on('close', (code) => {
      clearTimeout(timer)
      code === 0 ? resolve() : reject(new Error(stderr.trim().split('\n').pop() || `ffmpeg saiu com código ${code}`))
    })
  })
}

uploadRouter.post('/video', requireAuth, requirePermission('canCreate'), (req, res) => {
  videoUpload.single('file')(req, res, async (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? `Vídeo muito grande (máximo ${MAX_VIDEO_MB} MB).` : err.message
      return res.status(400).json({ error: msg })
    }
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' })

    const src = req.file.path
    const id = nanoid()
    const out = path.join(UPLOAD_DIR, `${id}.mp4`)
    const poster = path.join(UPLOAD_DIR, `${id}.jpg`)
    try {
      await runFfmpeg(
        [
          '-i', src,
          '-vf', "scale='if(gte(iw,ih),min(1280,iw),-2)':'if(gte(iw,ih),-2,min(1280,ih))'",
          '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-pix_fmt', 'yuv420p',
          '-c:a', 'aac', '-b:a', '96k',
          '-movflags', '+faststart',
          '-t', '180',
          out,
        ],
        5 * 60_000
      )
      await runFfmpeg(['-ss', '0.5', '-i', out, '-frames:v', '1', '-q:v', '3', poster], 60_000).catch(() =>
        runFfmpeg(['-i', out, '-frames:v', '1', '-q:v', '3', poster], 60_000)
      )
      res.status(201).json({ url: `/uploads/${id}.mp4`, poster: fs.existsSync(poster) ? `/uploads/${id}.jpg` : '' })
    } catch (e) {
      console.error('Falha ao converter vídeo:', e.message)
      fs.rmSync(out, { force: true })
      fs.rmSync(poster, { force: true })
      res.status(400).json({ error: 'Não foi possível processar esse vídeo. Tente outro arquivo ou um vídeo mais curto.' })
    } finally {
      fs.rmSync(src, { force: true })
    }
  })
})
