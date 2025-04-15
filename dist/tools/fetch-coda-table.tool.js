"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFetchCodaTableTool = registerFetchCodaTableTool;
const zod_1 = require("zod");
/**
 * Registers the Coda table fetching tool to the MCP server
 *
 * @param server The MCP server instance
 */
function registerFetchCodaTableTool(server) {
    /**
     * Fetches a specific table from a Coda document
     *
     * @param {Object} params - The parameters for the tool
     * @param {string} params.docId - The ID of the Coda document
     * @param {string} params.tableId - The ID of the table to fetch
     * @returns {Object} Response containing either the table data or an error message
     */
    server.tool("fetch-coda-table", {
        docId: zod_1.z.string(),
        tableId: zod_1.z.string()
    }, async ({ docId, tableId }) => {
        // Get API key from environment variables
        const apiKey = process.env.CODA_API_KEY;
        if (!apiKey) {
            console.error("CODA_API_KEY not found in environment variables");
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: CODA_API_KEY not found in environment variables",
                    },
                ],
            };
        }
        try {
            console.log(`Fetching table ID: ${tableId} from document ID: ${docId}`);
            // Call Coda API to fetch the table
            const response = await fetch(`https://coda.io/apis/v1/docs/${docId}/tables/${tableId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            });
            // Handle API errors
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Coda API Error: ${response.status} - ${errorText}`);
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }
            // Parse and return the data
            const data = await response.json();
            console.log(`Successfully fetched table ${tableId} from document ${docId}`);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(data, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            // Handle and format any errors
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error fetching table: ${errorMessage}`);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error fetching table: ${errorMessage}`,
                    },
                ],
            };
        }
    });
}
