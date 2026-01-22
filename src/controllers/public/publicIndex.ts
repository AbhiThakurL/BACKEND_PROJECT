import { Request,Response } from "express";
import { HomeDB } from "../../models/HomeIndex";
import mongoose from "mongoose";
import { redis } from "../../config/redius";

const OwnerPublicHomes = async ( request:Request,response:Response) => {

    try {
        
            const { category, state } = request.query;
            const cacheKey = `public:homes:${category || 'all'}:${state || 'all'}`;
            const cachedData = await redis.get(cacheKey)
            
            const matchStage:any = {};
            if (category) matchStage.category = category;
            if (state) matchStage.state = state;
        
            const OwnerHome = await HomeDB.aggregate([
            { $match: matchStage },
        
            {
                $lookup: {
                from: "roomdbs",
                localField: "_id",
                foreignField: "home",
                as: "rooms",
                },
            },
        
            {
                $addFields: {
                roomsCount: { $size: "$rooms" },
                },
            },
        
            {
                $project: {
                address: 1,
                state: 1,
                zip: 1,
                category: 1,
                roomsCount: 1,
                createdAt: 1,
                },
            },
            ]);
        
            if (OwnerHome.length > 0) {
            await redis.set(cacheKey, JSON.stringify(OwnerHome), "EX", 600); 
        }
            return response.status(200).json(OwnerHome);
            
    } catch (error) {

        return response.status(500).json({ message: "Failed to fetch public homes" });
    }
}

const OwnerPublicHomeDetail = async( request:Request,response:Response) => {

    try {
        const { HomeID } = request.params;
    
        if(!mongoose.Types.ObjectId.isValid(HomeID)) return response.status(400).json( { message:"Invalid  Owner HomeID"})

        const cacheKey = `public:home_detail:${HomeID}`;
        const cachedDetail = await redis.get(cacheKey);
        if (cachedDetail) return response.status(200).json(JSON.parse(cachedDetail));
        
        
        
         const OwnerHome = await HomeDB.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(HomeID),
            },
          },
          {
            $lookup: {
              from: "roomdbs",
              localField: "_id",
              foreignField: "home",
              as: "rooms",
            },
          },
          {
            $addFields: {
              roomsCount: { $size: "$rooms" },
            },
          },
          {
            $project: {
              address: 1,
              state: 1,
              zip: 1,
              category: 1,
              roomsCount: 1,
              rooms: {
                name: 1,
                floor: 1,
              },
            },
          },
        ]);
    
        if(!OwnerHome.length) return response.status(404).json({ message:"OwnerHome not Founds ?"})
        
        await redis.set(cacheKey, JSON.stringify(OwnerHome[0]), "EX", 1800);
        
        return response.status(200).json(OwnerHome[0]);
    } catch (error) {
          return response.status(500).json({
         message: "Failed to fetch home details",
    });


        
    }


}



export {
    OwnerPublicHomes,
    OwnerPublicHomeDetail,
    
}