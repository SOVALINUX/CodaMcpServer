"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFetchCodaTableColumnsTools = registerFetchCodaTableColumnsTools;
const zod_1 = require("zod");
/**
 * Registers the Coda table columns fetching tool to the MCP server
 *
 * @param server The MCP server instance
 */
function registerFetchCodaTableColumnsTools(server) {
    /**
     * Fetches all columns from a specified Coda table
     *
     * @param {Object} params - The parameters for the tool
     * @param {string} params.docId - The ID of the Coda document
     * @param {string} params.tableId - The ID of the table to fetch columns from
     * @returns {Object} Response containing either the columns data or an error message
     */
    server.tool("fetch-coda-table-columns", {
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
            console.log(`Fetching columns for table ID: ${tableId} in document ID: ${docId}`);
            // Call Coda API to fetch table columns
            const response = await fetch(`https://coda.io/apis/v1/docs/${docId}/tables/${tableId}/columns`, {
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
            console.log(`Successfully fetched ${data.items?.length || 0} columns from table ${tableId}`);
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
            console.error(`Error fetching table columns: ${errorMessage}`);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error fetching table columns: ${errorMessage}`,
                    },
                ],
            };
        }
    });
}
