import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Connect } from "vite";
import react from "@vitejs/plugin-react";

const repoRoot = path.resolve(__dirname, "../..");
const avatarsDir = path.join(repoRoot, "packages/assets/avatars");

function serveAvatars(): {
  name: string;
  configureServer(server: { middlewares: Connect.Server }): void;
} {
  return {
    name: "serve-avatar-svgs",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/avatars/")) return next();
        const rel = decodeURIComponent(url.slice("/avatars/".length).split("?")[0] ?? "");
        const file = path.normalize(path.join(avatarsDir, rel));
        if (!file.startsWith(avatarsDir + path.sep) && file !== avatarsDir) {
          res.statusCode = 403;
          res.end("Forbidden");
          return;
        }
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }
        res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=60");
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveAvatars()],
  resolve: {
    alias: {
      "@1lap/avatar-core": path.join(repoRoot, "packages/core/src/index.ts"),
      "@1lap/avatar-react": path.join(repoRoot, "packages/react/src/index.ts"),
    },
  },
  server: {
    fs: { allow: [repoRoot] },
  },
});
