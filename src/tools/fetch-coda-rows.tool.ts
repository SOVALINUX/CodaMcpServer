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
    "Fetch rows from a Coda table with optional filters, sorting, and formatting.",
    { 
      docId: z
        .string()
        .describe("The ID of the Coda document (e.g., doc_abcd1234)."),
      tableId: z
        .string()
        .describe("The ID of the Coda table (e.g., grid_xyz9876)."),
      limit: z
        .number()
        .int()
        .positive()
        .max(500)
        .optional()
        .describe("Maximum number of results to return."),
      query: z
        .string()
        .optional()
        .describe(
          "Filter expression as <column_id_or_name>:<value>. Quote names and string values (e.g., \"My Column\":\"groceries\")."
        ),
      sortBy: z
        .enum(["createdAt", "updatedAt", "natural"])
        .optional()
        .describe(
          "Sort order of rows. 'natural' implies visibleOnly=true and cannot be used with visibleOnly=false."
        ),
      useColumnNames: z
        .boolean()
        .optional()
        .describe(
          "Return column names instead of column IDs in the output. Fragile if columns are renamed, but handy when only read w/o further edit is required."
        ),
      valueFormat: z
        .enum(["simple", "rich"]) 
        .optional()
        .describe("The format that cell values are returned as."),
      visibleOnly: z
        .boolean()
        .optional()
        .describe("If true, returns only visible rows and columns for the table.")
    }, 
    async ({ docId, tableId, limit, query, sortBy, useColumnNames, valueFormat, visibleOnly }) => {
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

        // sortBy validation and mapping
        if (sortBy) {
          const apiSortValue =
            sortBy === "createdAt" ? "createdAt" :
            sortBy === "updatedAt" ? "updatedAt" :
            "natural";

          // If natural is requested, enforce visibleOnly=true as per API rules
          if (apiSortValue === "natural") {
            if (visibleOnly === false) {
              throw new Error("Invalid parameters: sortBy=natural implies visibleOnly=true; do not set visibleOnly=false.");
            }
            // If not explicitly set, force visibleOnly to true to avoid server-side Bad Request
            visibleOnly = true;
          }

          queryParams.append('sortBy', apiSortValue);
        }

        if (typeof useColumnNames === 'boolean') {
          queryParams.append('useColumnNames', String(useColumnNames));
        }

        if (valueFormat) {
          queryParams.append('valueFormat', valueFormat);
        }

        if (typeof visibleOnly === 'boolean') {
          queryParams.append('visibleOnly', String(visibleOnly));
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