import { openai } from '@ai-sdk/openai';
import {
  experimental_createMCPClient,
  InvalidToolArgumentsError,
  Message,
  NoSuchToolError,
  smoothStream,
  streamText,
  ToolExecutionError,
} from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { NextRequest } from 'next/server';
import path from 'path';

// MCP server configuration
const USE_STDIO = process.env.TRANSPORT === 'stdio';
const MCP_PROJECT_ROOT = '/Users/lazrossi/Documents/code/mcp-s/mcp-on-vercel';
const LOCAL_MCP_PATH = path.join(MCP_PROJECT_ROOT, 'dist/api/server.js');
const BAAS_API_KEY = process.env.BAAS_API_KEY;

if (!BAAS_API_KEY) {
  console.warn('Warning: BAAS_API_KEY is not set in environment variables');
}

console.log('MCP Configuration:', {
  USE_STDIO,
  MCP_PROJECT_ROOT,
  LOCAL_MCP_PATH,
  NODE_ENV: process.env.NODE_ENV,
  TRANSPORT: process.env.TRANSPORT,
  HAS_BAAS_API_KEY: !!BAAS_API_KEY,
});

export async function POST(request: NextRequest) {
  const {
    messages,
  }: {
    messages: Array<Message>;
  } = await request.json();

  try {
    if (USE_STDIO && !BAAS_API_KEY) {
      throw new Error('BAAS_API_KEY is required for local MCP server');
    }

    // Initialize MCP client using the Vercel AI SDK
    const client = USE_STDIO
      ? await experimental_createMCPClient({
          transport: new Experimental_StdioMCPTransport({
            command: 'node',
            args: [LOCAL_MCP_PATH],
            cwd: MCP_PROJECT_ROOT,
            env: {
              ...process.env,
              NODE_ENV: 'development',
              DEBUG: 'mcp:*',
              TRANSPORT: 'stdio',
              BAAS_API_KEY: BAAS_API_KEY || '', // TypeScript safety
            },
          }),
        })
      : await experimental_createMCPClient({
          transport: {
            type: 'sse',
            url:
              process.env.NODE_ENV === 'development'
                ? 'http://localhost:3000/sse'
                : 'https://baas-mcp.vercel.app/sse',
          },
        });

    const tools = await client.tools();
    console.log('Available tools:', tools);

    const result = streamText({
      model: openai('gpt-4o-mini'),
      tools,
      maxSteps: 10,
      experimental_transform: [
        smoothStream({
          chunking: 'word',
        }),
      ],
      onStepFinish: async ({ toolResults }) => {
        console.log(`Step Results: ${JSON.stringify(toolResults, null, 2)}`);
      },
      onFinish: async () => {
        client.close();
      },
      onError: async () => {
        client.close();
      },
      system:
        'You are a friendly assistant. Do not use emojis in your responses. Make sure to format code blocks, and add language/title to it',
      messages,
    });

    return result.toDataStreamResponse({
      getErrorMessage: (error) => {
        if (NoSuchToolError.isInstance(error)) {
          const toolName = error.toolName || 'unknown';
          const tools = Array.isArray(error.availableTools)
            ? error.availableTools.join(', ')
            : 'none';
          return `Tool Error: The model attempted to call a tool that doesn't exist. Tool name: "${toolName}". Available tools: ${tools}`;
        } else if (InvalidToolArgumentsError.isInstance(error)) {
          const toolName = error.name || 'unknown';
          const details = error.message || 'No additional details available';
          return `Tool Argument Error: Invalid arguments provided to tool "${toolName}". Details: ${details}`;
        } else if (ToolExecutionError.isInstance(error)) {
          console.error('Tool Execution Error:', error);
          const toolName = error.name || 'unknown';
          const errorMessage = error.message || 'No error message available';
          return `Tool Execution Error: Failed to execute tool "${toolName}". Error message: ${errorMessage}`;
        } else {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('Unknown Error:', error);
          return `An unexpected error occurred: ${errorMessage}`;
        }
      },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return Response.json({ error: 'Failed to generate text' });
  }
}
