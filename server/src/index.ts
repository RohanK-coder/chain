import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes.auth";
import chatRoutes from "./routes.chat";

const app = express();
app.use(express.json());

app.use(cors({ origin: true, credentials: true }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/", chatRoutes);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));

app.use((err: any, _req: any, res: any, _next: any) => {
  if (err?.name === "ZodError") {
    return res.status(400).json({ error: "Invalid input", details: err.errors });
  }
  console.error(err);
  return res.status(500).json({ error: "Server error" });
});
