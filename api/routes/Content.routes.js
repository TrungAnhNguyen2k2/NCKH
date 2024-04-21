import express from 'express'

const router = express.Router()
import {
  getContents,
  getContent,
  getTotalSourceHaveNewContent,
  getOutstanding,
  updateContent,
  updateMultilContent,
  deleteContent,
} from '../controllers/Content.controller.js'
import {authenticate} from '../controllers/User.controller.js'

router.get('/', authenticate(), getContents)
router.get('/totalSource/dashboard', authenticate(), getTotalSourceHaveNewContent)
router.get('/outstanding', authenticate(), getOutstanding)
router.get('/:id', authenticate(), getContent)
router.put('/:id', authenticate(), updateContent)
router.put('/', authenticate(), updateMultilContent)
router.delete('/:id', authenticate(), deleteContent)

export default router
