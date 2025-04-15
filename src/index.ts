import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import * as dotenv from "dotenv";
import { registerFetchCodaTablesTools } from "./tools/fetch-coda-tables.js";

// Load environment variables
dotenv.config();

// Create MCP server instance
const server = new McpServer({
  name: "mcp-coda-api",
  version: "1.0.0",
});

// Register Coda tools
registerFetchCodaTablesTools(server);

// Initialize Express app
const app = express();
app.use(express.json());

// Store active SSE transports
const transports: { [sessionId: string]: SSEServerTransport } = {};

// SSE endpoint for MCP
app.get("/sse", async (_: Request, res: Response) => {
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;
  
  res.on("close", () => {
    console.log(`Connection closed for sessionId: ${transport.sessionId}`);
    delete transports[transport.sessionId];
  });
  
  console.log(`New SSE connection established, sessionId: ${transport.sessionId}`);
  await server.connect(transport);
});

// Message handling endpoint
app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    console.error(`No transport found for sessionId: ${sessionId}`);
    res.status(400).send("No transport found for sessionId");
  }
});

// Server health check endpoint
app.get("/health", (_, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start the server
const PORT = parseInt(process.env.PORT || "8000", 10);
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`MCP server running at http://${HOST}:${PORT}`);
  console.log("Available endpoints:");
  console.log(`- GET  /sse       - SSE connection endpoint`);
  console.log(`- POST /messages  - Message handling endpoint`);
  console.log(`- GET  /health    - Server health check endpoint`);
});
