import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import * as dotenv from "dotenv";
// import cors from "cors";
import { registerFetchCodaTablesTools } from "./tools/fetch-coda-tables.tool.js";
import { registerFetchCodaTableTool } from "./tools/fetch-coda-table.tool.js";
import { registerFetchCodaTableColumnsTools } from "./tools/fetch-coda-table-columns.tool.js";
import { registerFetchCodaColumnTool } from "./tools/fetch-coda-column.tool.js";
import { registerFetchCodaRowsTool } from "./tools/fetch-coda-rows.tool.js";
import { registerUpsertCodaRowsTool } from "./tools/upsert-coda-rows.tool.js";
import { registerDeleteCodaRowsTool } from "./tools/delete-coda-rows.tool.js";
import { registerFetchCodaDocsTool } from "./tools/fetch-coda-docs.tool.js";

// Load environment variables
dotenv.config();

const server = new McpServer({
  name: "mcp-coda",
  version: "1.0.0",
});

// Register tools
registerFetchCodaTablesTools(server);
registerFetchCodaTableTool(server);
registerFetchCodaTableColumnsTools(server);
registerFetchCodaColumnTool(server);
registerFetchCodaRowsTool(server);
registerUpsertCodaRowsTool(server);
registerDeleteCodaRowsTool(server);
registerFetchCodaDocsTool(server);

const app = express();

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
    `New SSE connection established, sessionId: ${transport.sessionId}`,
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

const PORT = parseInt(process.env.PORT || "8000", 10);
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`MCP server running at http://${HOST}:${PORT}`);
  console.log("Available endpoints:");
  console.log(`- GET  /sse       - SSE connection endpoint`);
  console.log(`- POST /messages  - Message handling endpoint`);
});
