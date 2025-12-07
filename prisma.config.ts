// prisma.config.ts
import path from "node:path"
import { defineConfig } from "prisma/config"
import "dotenv/config"

export default defineConfig({
    schema: path.join(__dirname, "prisma/schema.prisma"),
    migrations: {
        seed: "tsx prisma/seed.ts",
    },
})
