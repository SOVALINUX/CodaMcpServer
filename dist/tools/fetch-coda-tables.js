"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFetchCodaTablesTools = registerFetchCodaTablesTools;
const zod_1 = require("zod");
/**
 * Registers the Coda tables fetching tool to the MCP server
 *
 * @param server The MCP server instance
 */
function registerFetchCodaTablesTools(server) {
    /**
     * Fetches all tables from a specified Coda document
     *
     * @param {Object} params - The parameters for the tool
     * @param {string} params.docId - The ID of the Coda document to fetch tables from
     * @returns {Object} Response containing either the tables data or an error message
     */
    server.tool("fetch-coda-tables", { docId: zod_1.z.string() }, async ({ docId }) => {
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
            console.log(`Fetching tables for document ID: ${docId}`);
            // Call Coda API to fetch tables
            const response = await fetch(`https://coda.io/apis/v1/docs/${docId}/tables`, {
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
            console.log(`Successfully fetched ${data.items?.length || 0} tables from document ${docId}`);
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
            console.error(`Error fetching tables: ${errorMessage}`);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error fetching tables: ${errorMessage}`,
                    },
                ],
            };
        }
    });
}
