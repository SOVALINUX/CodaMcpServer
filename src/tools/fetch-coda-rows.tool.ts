import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers the Coda rows fetching tool to the MCP server
 *
 * @param server The MCP server instance
 */
export function registerFetchCodaRowsTool(server: McpServer) {
  /**
   * Fetches rows from a specified Coda table
   *
   * @param {Object} params - The parameters for the tool
   * @param {string} params.docId - The ID of the Coda document
   * @param {string} params.tableId - The ID of the table to fetch rows from
   * @param {number} [params.limit] - Optional limit on the number of rows to return
   * @param {string} [params.query] - Optional query string to filter rows
   * @returns {Object} Response containing either the rows data or an error message
   */
  server.tool(
    "fetch-coda-rows",
    { 
      docId: z.string(),
      tableId: z.string(),
      limit: z.number().optional(),
      query: z.string().optional()
    }, 
    async ({ docId, tableId, limit, query }) => {
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
        console.log(`Fetching rows from table ID: ${tableId} in document ID: ${docId}`);
        
        // Construct URL with optional query parameters
        let url = `https://coda.io/apis/v1/docs/${docId}/tables/${tableId}/rows`;
        const queryParams = new URLSearchParams();
        
        if (limit) {
          queryParams.append('limit', limit.toString());
        }
        
        if (query) {
          queryParams.append('query', query);
        }
        
        const queryString = queryParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
        
        // Call Coda API to fetch rows
        const response = await fetch(url, {
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
        console.log(`Successfully fetched ${data.items?.length || 0} rows from table ${tableId}`);
        
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
        console.error(`Error fetching rows: ${errorMessage}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error fetching rows: ${errorMessage}`,
            },
          ],
        };
      }
    }
  );
}