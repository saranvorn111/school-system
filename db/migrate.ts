import { migrate } from "drizzle-orm/mysql2/migrator";
import { db } from "./index";

migrate(db, { migrationsFolder: "./db/migrations" })
  .then(() => {
    console.log("✓ migrations applied");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
