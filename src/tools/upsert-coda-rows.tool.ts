import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers the Coda rows upserting tool to the MCP server
 *
 * @param server The MCP server instance
 */
export function registerUpsertCodaRowsTool(server: McpServer) {
  /**
   * Upserts (inserts or updates) rows in a specified Coda table
   *
   * @param {Object} params - The parameters for the tool
   * @param {string} params.docId - The ID of the Coda document
   * @param {string} params.tableId - The ID of the table to upsert rows in
   * @param {Object[]} params.rows - Array of row data to upsert
   * @param {string} [params.keyColumns] - Optional comma-separated list of column IDs to use as keys
   * @returns {Object} Response containing either the upsert result or an error message
   */
  server.tool(
    "upsert-coda-rows",
    { 
      docId: z.string(),
      tableId: z.string(),
      rows: z.array(z.record(z.any())),
      keyColumns: z.string().optional()
    }, 
    async ({ docId, tableId, rows, keyColumns }) => {
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
        console.log(`Upserting ${rows.length} rows to table ID: ${tableId} in document ID: ${docId}`);
        
        // Construct URL with optional query parameters
        let url = `https://coda.io/apis/v1/docs/${docId}/tables/${tableId}/rows`;
        if (keyColumns) {
          url += `?keyColumns=${encodeURIComponent(keyColumns)}`;
        }
        
        // Call Coda API to upsert rows
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rows }),
        });

        // Handle API errors
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Coda API Error: ${response.status} - ${errorText}`);
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        // Parse and return the data
        const data = await response.json();
        console.log(`Successfully upserted rows to table ${tableId}`);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        // Handle and format any errors
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`Error upserting rows: ${errorMessage}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error upserting rows: ${errorMessage}`,
            },
          ],
        };
      }
    }
  );
}