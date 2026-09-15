import { copyFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "packages", "react", "src", "avatar-builder.css");
const dest = join(root, "packages", "react", "dist", "avatar-builder.css");
mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log("Copied avatar-builder.css to dist/");
