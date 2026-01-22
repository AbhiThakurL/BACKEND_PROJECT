import { 
    ownerRegister,
    LoginOwner,
    LogoutOwner,
    RefreshAccessToken,
    changeCurrentPassword,
    OwnerAccountDelete } from "../../controllers/auth/registerControllers";
import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware";

const RegisterRoutes = Router()


RegisterRoutes.post("/register",ownerRegister);
RegisterRoutes.post("/refresh-token",RefreshAccessToken)
RegisterRoutes.post("/login",LoginOwner);
RegisterRoutes.post("/logout",verifyJWT,LogoutOwner);
RegisterRoutes.post("/change-Password",verifyJWT,changeCurrentPassword);
RegisterRoutes.delete("/delete-account",verifyJWT,OwnerAccountDelete);





export {
    RegisterRoutes,
}
