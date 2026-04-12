import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadEnv } from "vite";

/** Ensures ADMIN_PASSWORD matches .env / .env.local on disk (Vite loadEnv alone can miss or clash with the shell). */
function applyAdminPasswordFromEnvFiles(cwd: string) {
  for (const name of [".env", ".env.local"]) {
    const full = path.join(cwd, name);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (key !== "ADMIN_PASSWORD") continue;
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env.ADMIN_PASSWORD = val;
    }
  }
}

function patchResponse(res: ServerResponse) {
  const r = res as ServerResponse & {
    status: (code: number) => { json: (obj: unknown) => void };
  };
  r.status = (code: number) => {
    res.statusCode = code;
    return {
      json: (obj: unknown) => {
        if (!res.headersSent) {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(obj));
        }
      },
    };
  };
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return undefined;
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

function moduleUrl(relativeFromRoot: string) {
  return pathToFileURL(path.join(process.cwd(), relativeFromRoot)).href;
}

export function devApiPlugin(): Plugin {
  return {
    name: "dev-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api")) return next();

        const pathname = url.split("?")[0] || "";
        const mode = server.config.mode || "development";
        const env = loadEnv(mode, process.cwd(), ["ADMIN_", "BLOB_", "CMS_", "VITE_"]);
        Object.assign(process.env, env);
        applyAdminPasswordFromEnvFiles(process.cwd());

        patchResponse(res);

        const method = req.method || "GET";
        const reqAny = req as IncomingMessage & {
          body?: unknown;
          query?: Record<string, string>;
        };

        try {
          if (pathname === "/api/admin/login" && method === "POST") {
            reqAny.body = await readJsonBody(req);
            const mod = await import(moduleUrl("api/admin/login.js"));
            await mod.default(req, res);
            return;
          }
          if (pathname === "/api/admin/logout" && method === "POST") {
            const mod = await import(moduleUrl("api/admin/logout.js"));
            await mod.default(req, res);
            return;
          }
          if (pathname === "/api/admin/session" && method === "GET") {
            const mod = await import(moduleUrl("api/admin/session.js"));
            await mod.default(req, res);
            return;
          }
          if (pathname === "/api/cms/upload" && method === "POST") {
            reqAny.body = await readJsonBody(req);
            const mod = await import(moduleUrl("api/cms/upload.js"));
            await mod.default(req, res);
            return;
          }
          const cmsMatch = /^\/api\/cms\/([^/]+)$/.exec(pathname);
          if (cmsMatch) {
            reqAny.query = { section: cmsMatch[1] };
            if (method === "PUT") {
              reqAny.body = await readJsonBody(req);
            }
            const mod = await import(moduleUrl("api/cms/[section].js"));
            await mod.default(req, res);
            return;
          }
        } catch (e) {
          console.error("[dev-api]", e);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Internal server error" }));
          }
          return;
        }

        if (!res.headersSent) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Not found" }));
        }
      });
    },
  };
}
