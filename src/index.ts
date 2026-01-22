import { config } from "dotenv";
import { app } from "./app";
import { databaseConnection } from "./database/index";





const envFile = process.env.NODE_ENV === "development" ? ".env.production" : "env.development" ;


config({ path: envFile})

const startServer = async () => {

    try {
        if(!process.env.PORT) throw new Error("PORT is missing in environment variables");
        const PORT:number = Number(process.env.PORT);
    
        await databaseConnection();
        console.log("Database connected successfully");
    
        app.listen(PORT, () => {
            console.log(` Server running on port ${PORT}`);
        });
    
    } catch (error) {
        console.error("Server Startup Error:", error);
        process.exit(1);
        
    }

}


startServer()




