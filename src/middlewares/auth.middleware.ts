import { Owner } from "../models/OwnerIndex";
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../config/redius";

interface AccessTokenPayload extends JwtPayload {
  _id: string;
}

export const verifyJWT = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const token = request.cookies?.accessToken || request.header("Authorization")?.replace("Bearer ", "");


    if (!token) {
      return response.status(401).json({ message: "Unauthorized request" });
    }

    
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    
    if(isBlacklisted) return response.status(401).json({ message: "Token is no longer valid. Please login again. "})

    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as AccessTokenPayload;

    const owner = await Owner.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    console.log(owner)

    if (!owner) {
      return response.status(401).json({ message: "Invalid access token" });
    }

    request.owner = owner;
    next();
  } catch (error) {

    if(error instanceof jwt.TokenExpiredError) return response.status(401).json({ message: "Token expired", expired: true }); 

    return response.status(401).json({ message: "Invalid access token" });
  }
};
