import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import * as dotenv from "dotenv";
import { registerFetchCodaTablesTools } from "./tools/fetch-coda-tables.tool.js";

// Load environment variables
dotenv.config();

const server = new McpServer({
  name: "mcp-coda",
  version: "1.0.0",
});

// Register tools
registerFetchCodaTablesTools(server);

const app = express();
app.use(express.json());

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports: { [sessionId: string]: SSEServerTransport } = {};

app.get("/sse", async (_: Request, res: Response) => {
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  console.log(
    `New SSE connection established, sessionId: ${transport.sessionId}`
  );
  await server.connect(transport);
});

app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No transport found for sessionId");
  }
});

app.get("/health", (_, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MCP server running at http://localhost:${PORT}`);
});
