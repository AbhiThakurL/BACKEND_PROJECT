import express from "express";
import cors from "cors";
import { RegisterRoutes } from "./routes/auth/register";
import { indexRoutes } from "./routes";
import cookieParser from "cookie-parser";


const app = express()



// MiddlewareFunction
app.use(express.json());
app.use(express.urlencoded({ extended:true ,  limit:"16kb" }));
app.use(cors({origin:process.env.ORIGIN_PATH ,credentials:true}));
app.use(cookieParser());


// Routes 
app.use("/api/v1",RegisterRoutes);
app.use("/api/v2",indexRoutes);







export {
    app
}





