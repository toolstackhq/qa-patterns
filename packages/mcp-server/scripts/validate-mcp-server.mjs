import path from "node:path";
import process from "node:process";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const EXPECTED_TOOLS = [
  "list_templates",
  "describe_template",
  "scaffold_template",
  "validate_project",
  "get_next_steps"
];

async function main() {
  const client = new Client({
    name: "qa-patterns-mcp-validator",
    version: "1.0.0"
  });

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.resolve("src/index.mjs")],
    cwd: process.cwd(),
    stderr: "pipe"
  });

  let stderr = "";
  transport.stderr?.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await client.connect(transport);
    const result = await client.listTools();
    const toolNames = result.tools.map((tool) => tool.name);
    const missingTools = EXPECTED_TOOLS.filter((tool) => !toolNames.includes(tool));

    if (missingTools.length > 0) {
      throw new Error(`Missing expected MCP tools: ${missingTools.join(", ")}`);
    }

    console.log(
      JSON.stringify(
        {
          success: true,
          tools: toolNames,
          stderr: stderr.trim()
        },
        null,
        2
      )
    );
  } finally {
    await client.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exit(1);
});
