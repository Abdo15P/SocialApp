import {Router} from 'express'
import { authentication } from '../../middleware/authentication.middleware'
import userService from './user.service'
import * as validators from "./user.validation"
import { validation } from '../../middleware/validation.middleware'
import { TokenEnum } from '../../utils/security/token.security'
const router= Router()


router.get("/",authentication(),userService.profile)

router.post("/refresh-token",authentication(TokenEnum.refresh),userService.refreshToken)
router.post("/logout",authentication(),validation(validators.logout),userService.logout)
export default router