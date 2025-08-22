import authService from "./auth.service";
import { Router } from "express";
import * as validators from './auth.validation'
import {validation} from '../../middleware/validation.middleware'
const router= Router()

router.post("/signup",validation(validators.signup),authService.signup)
router.post("/login",authService.login)

export default router