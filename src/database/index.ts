import mongoose from "mongoose";

const databaseConnection = async ():Promise<void> => {

 try {
       const DATABASE_URL:string = process.env.DATABASE_PATH || "mongodb://localhost:27017/testing";
       const database = await mongoose.connect(DATABASE_URL);

       console.log(`Database Connected : ${database.connection.host}`)
       
 } catch (error) {
    console.error("Database Connection Failed : " ,error)
    process.exit(1)
}
}

export {
    databaseConnection
}