"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
const dotenv = __importStar(require("dotenv"));
const fetch_coda_tables_js_1 = require("./tools/fetch-coda-tables.js");
// Load environment variables
dotenv.config();
// Create MCP server instance
const server = new mcp_js_1.McpServer({
    name: "mcp-coda-api",
    version: "1.0.0",
});
// Register Coda tools
(0, fetch_coda_tables_js_1.registerFetchCodaTablesTools)(server);
// Initialize Express app
const app = (0, express_1.default)();
//app.use(express.json());
// Store active SSE transports
const transports = {};
// SSE endpoint for MCP
app.get("/sse", async (_, res) => {
    const transport = new sse_js_1.SSEServerTransport("/messages", res);
    transports[transport.sessionId] = transport;
    res.on("close", () => {
        console.log(`Connection closed for sessionId: ${transport.sessionId}`);
        delete transports[transport.sessionId];
    });
    console.log(`New SSE connection established, sessionId: ${transport.sessionId}`);
    await server.connect(transport);
});
// Message handling endpoint
app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId;
    const transport = transports[sessionId];
    if (transport) {
        await transport.handlePostMessage(req, res);
    }
    else {
        console.error(`No transport found for sessionId: ${sessionId}`);
        res.status(400).send("No transport found for sessionId");
    }
});
// Server health check endpoint
app.get("/health", (_, res) => {
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
