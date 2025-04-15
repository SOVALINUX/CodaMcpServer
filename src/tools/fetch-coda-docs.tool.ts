import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers the Coda documents fetching tool to the MCP server
 *
 * @param server The MCP server instance
 */
export function registerFetchCodaDocsTool(server: McpServer) {
  /**
   * Fetches all available Coda documents
   *
   * @param {Object} params - The parameters for the tool
   * @param {boolean} [params.isOwner] - Optional filter for documents owned by the user
   * @param {number} [params.limit] - Optional limit on the number of documents to return
   * @returns {Object} Response containing either the documents data or an error message
   */
  server.tool(
    "fetch-coda-docs",
    { 
      isOwner: z.boolean().optional(),
      limit: z.number().optional()
    }, 
    async ({ isOwner, limit }) => {
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
        console.log("Fetching Coda documents");
        
        // Construct URL with optional query parameters
        let url = "https://coda.io/apis/v1/docs";
        const queryParams = new URLSearchParams();
        
        if (isOwner !== undefined) {
          queryParams.append('isOwner', isOwner.toString());
        }
        
        if (limit) {
          queryParams.append('limit', limit.toString());
        }
        
        const queryString = queryParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
        
        // Call Coda API to fetch documents
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
        console.log(`Successfully fetched ${data.items?.length || 0} documents`);
        
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
        console.error(`Error fetching documents: ${errorMessage}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error fetching documents: ${errorMessage}`,
            },
          ],
        };
      }
    }
  );
}