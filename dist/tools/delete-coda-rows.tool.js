"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeleteCodaRowsTool = registerDeleteCodaRowsTool;
const zod_1 = require("zod");
/**
 * Registers the Coda rows deletion tool to the MCP server
 *
 * @param server The MCP server instance
 */
function registerDeleteCodaRowsTool(server) {
    /**
     * Deletes rows from a specified Coda table
     *
     * @param {Object} params - The parameters for the tool
     * @param {string} params.docId - The ID of the Coda document
     * @param {string} params.tableId - The ID of the table to delete rows from
     * @param {string[]} params.rowIds - Array of row IDs to delete
     * @returns {Object} Response containing either the deletion result or an error message
     */
    server.tool("delete-coda-rows", {
        docId: zod_1.z.string(),
        tableId: zod_1.z.string(),
        rowIds: zod_1.z.array(zod_1.z.string())
    }, async ({ docId, tableId, rowIds }) => {
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
            console.log(`Deleting ${rowIds.length} rows from table ID: ${tableId} in document ID: ${docId}`);
            // Call Coda API to delete rows
            const response = await fetch(`https://coda.io/apis/v1/docs/${docId}/tables/${tableId}/rows`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ rowIds }),
            });
            // Handle API errors
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Coda API Error: ${response.status} - ${errorText}`);
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }
            // Parse and return the data
            const data = await response.json();
            console.log(`Successfully deleted rows from table ${tableId}`);
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
            console.error(`Error deleting rows: ${errorMessage}`);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error deleting rows: ${errorMessage}`,
                    },
                ],
            };
        }
    });
}
