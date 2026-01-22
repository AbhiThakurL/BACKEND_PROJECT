# 1️⃣ Base image
FROM node:18-alpine

# 2️⃣ App working directory
WORKDIR /app

# 3️⃣ Package files copy karo
COPY package*.json ./

# 4️⃣ Dependencies install karo
RUN npm install

# 5️⃣ Source code copy karo
COPY . .

# 6️⃣ App port expose karo
EXPOSE 3000

# 7️⃣ Start command
CMD ["npm", "run", "prod"]
