import { fileValidation } from './../../utils/multer/cloud.multer';
import {Router} from 'express'
import { authentication, authorization } from '../../middleware/authentication.middleware'
import userService from './user.service'
import * as validators from "./user.validation"
import { validation } from '../../middleware/validation.middleware'
import { TokenEnum } from '../../utils/security/token.security'
import { cloudFileUpload, StorageEnum } from '../../utils/multer/cloud.multer'
import { endpoint } from './user.authorization';
const router= Router()


router.get("/",authentication(),userService.profile)
router.delete("{/:userId}/freeze-account",authentication(),validation(validators.freezeAccount),userService.freezeAccount)
router.delete("/:userId",authorization(endpoint.hardDeleteAccount),validation(validators.hardDelete),userService.hardDeleteAccount)
router.patch("/:userId/restore-account",authorization(endpoint.restoreAccount),validation(validators.restoreAccount),userService.restoreAccount)

router.patch("/profile-image",authentication(),userService.profileImage)
router.patch("/profile-cover-image",authentication(),cloudFileUpload({validation:fileValidation.image,storageApproach:StorageEnum.memory}).array("images",2),userService.profileCoverImage)

router.post("/refresh-token",authentication(TokenEnum.refresh),userService.refreshToken)
router.post("/logout",authentication(),validation(validators.logout),userService.logout)
export default router