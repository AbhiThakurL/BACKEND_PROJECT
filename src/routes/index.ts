import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { OwnerHomes, OwnerRooms, OwnerProfile } from "../controllers";
import { HomeLists, SingleHomeDetail, HomeDelete, HomeUpdate } from "../controllers/Home/HomeIndex";
import { OwnerDeleteRoom, OwnerUpdateRoom } from "../controllers/Room/RoomIndex";
import { OwnerPublicHomes, OwnerPublicHomeDetail } from "../controllers/public/publicIndex";

const indexRoutes = Router();

// --- 1. Owner Profile (Dashboard) ---
indexRoutes.get("/me", verifyJWT, OwnerProfile);

// --- 2. Home Management (Private) ---
// Rename: /OwnerHomesLists -> /homes
indexRoutes.get("/homes", verifyJWT, HomeLists);

// Rename: /OwnerHome -> /homes
indexRoutes.post("/homes", verifyJWT, OwnerHomes);

// URL Param consistent rakhein: :HomeID
indexRoutes.get("/homes/:HomeID", verifyJWT, SingleHomeDetail);
indexRoutes.put("/homes/:HomeID", verifyJWT, HomeUpdate);
indexRoutes.delete("/homes/:HomeID", verifyJWT, HomeDelete);

// --- 3. Room Management (Private) ---
// Path ko nested rakhein taaki pata chale kis ghar mein room ban raha hai
indexRoutes.post("/homes/:OwnerHomeID/rooms", verifyJWT, OwnerRooms);
// Individual Room actions
indexRoutes.put("/rooms/:RoomID", verifyJWT, OwnerUpdateRoom);
indexRoutes.delete("/rooms/:RoomID", verifyJWT, OwnerDeleteRoom);

// --- 4. Public Access (No Auth) ---
// Rename: /publicHome -> /public/homes
indexRoutes.get("/public/homes", OwnerPublicHomes);

// Rename: /PublicHomeDetails -> /public/homes/:HomeID
indexRoutes.get("/public/homes/:HomeID", OwnerPublicHomeDetail);

export { indexRoutes };