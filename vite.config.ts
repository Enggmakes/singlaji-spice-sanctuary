import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

function cashfreeDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: "cashfree-dev-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const parsedUrl = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
        const pathname = parsedUrl.pathname;
        const action = parsedUrl.searchParams.get("action");

        const isCreateOrder =
          pathname === "/api/cashfree/create-order" ||
          (pathname.includes("cashfree.php") && action === "create-order");
        const isVerifyOrder =
          pathname === "/api/cashfree/verify-order" ||
          (pathname.includes("cashfree.php") && action === "verify-order");

        if (!isCreateOrder && !isVerifyOrder) {
          return next();
        }

        const appId = env.CASHFREE_APP_ID;
        const secretKey = env.CASHFREE_SECRET_KEY;
        const isProd = env.CASHFREE_ENV === "PROD";
        const apiVersion = env.CASHFREE_API_VERSION || "2023-08-01";
        const baseUrl = isProd
          ? "https://api.cashfree.com/pg"
          : "https://sandbox.cashfree.com/pg";

        res.setHeader("Content-Type", "application/json");

        if (!appId || !secretKey) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Cashfree credentials missing in .env" }));
          return;
        }

        const headers: Record<string, string> = {
          "x-client-id": appId,
          "x-client-secret": secretKey,
          "x-api-version": apiVersion,
          "Content-Type": "application/json",
        };

        try {
          if (isCreateOrder) {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk;
            });
            req.on("end", async () => {
              try {
                const response = await fetch(`${baseUrl}/orders`, {
                  method: "POST",
                  headers,
                  body,
                });
                const data = await response.json();
                res.statusCode = response.status;
                res.end(JSON.stringify(data));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err?.message || "Failed to create order" }));
              }
            });
            return;
          }

          if (isVerifyOrder) {
            const orderId = parsedUrl.searchParams.get("order_id");
            if (!orderId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Missing order_id" }));
              return;
            }
            const response = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, {
              method: "GET",
              headers,
            });
            const data = await response.json();
            res.statusCode = response.status;
            res.end(JSON.stringify(data));
            return;
          }
        } catch (error: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error?.message || "Internal server error" }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      allowedHosts: true,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      cashfreeDevPlugin(env),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

