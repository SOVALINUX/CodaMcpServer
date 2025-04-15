"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFetchCodaColumnTool = registerFetchCodaColumnTool;
const zod_1 = require("zod");
/**
 * Registers the Coda column fetching tool to the MCP server
 *
 * @param server The MCP server instance
 */
function registerFetchCodaColumnTool(server) {
    /**
     * Fetches a specific column from a Coda table
     *
     * @param {Object} params - The parameters for the tool
     * @param {string} params.docId - The ID of the Coda document
     * @param {string} params.tableId - The ID of the table
     * @param {string} params.columnId - The ID of the column to fetch
     * @returns {Object} Response containing either the column data or an error message
     */
    server.tool("fetch-coda-column", {
        docId: zod_1.z.string(),
        tableId: zod_1.z.string(),
        columnId: zod_1.z.string()
    }, async ({ docId, tableId, columnId }) => {
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
            console.log(`Fetching column ID: ${columnId} from table ID: ${tableId} in document ID: ${docId}`);
            // Call Coda API to fetch the column
            const response = await fetch(`https://coda.io/apis/v1/docs/${docId}/tables/${tableId}/columns/${columnId}`, {
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
            console.log(`Successfully fetched column ${columnId} from table ${tableId}`);
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
            console.error(`Error fetching column: ${errorMessage}`);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error fetching column: ${errorMessage}`,
                    },
                ],
            };
        }
    });
}
