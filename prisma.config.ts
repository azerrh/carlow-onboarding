import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Prisma lit ce fichier : charge .env puis .env.local (comme Next.js)
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
