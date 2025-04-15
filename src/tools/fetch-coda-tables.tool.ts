import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers the Coda tables fetching tool to the MCP server
 *
 * @param server The MCP server instance
 */
export function registerFetchCodaTablesTools(server: McpServer) {
  /**
   * Fetches all tables from a specified Coda document
   *
   * @param {Object} params - The parameters for the tool
   * @param {string} params.docId - The ID of the Coda document to fetch tables from
   * @returns {Object} Response containing either the tables data or an error message
   */
  server.tool("fetch-coda-tables", { docId: z.string() }, async ({ docId }) => {
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
      console.log(`Using API key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);
      
      // Call Coda API to fetch tables
      const url = `https://coda.io/apis/v1/docs/${docId}/tables`;
      console.log(`Making request to: ${url}`);
      
      const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };
      console.log(`Headers: ${JSON.stringify(headers, (k, v) => k === 'Authorization' ? `Bearer ${apiKey.substring(0, 5)}...` : v)}`);
      
      const response = await fetch(url, {
        method: "GET",
        headers: headers,
      });

      // Handle API errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Coda API Error: ${response.status} - ${errorText}`);
        console.error(`Response headers: ${JSON.stringify(Object.fromEntries([...response.headers]))}`);
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
    } catch (error: unknown) {
      // Handle and format any errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
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
