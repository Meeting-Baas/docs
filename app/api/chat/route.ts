import { openai } from '@ai-sdk/openai';
import {
  experimental_createMCPClient as createMCPClient,
  InvalidToolArgumentsError,
  Message,
  NoSuchToolError,
  smoothStream,
  streamText,
  ToolExecutionError,
} from 'ai';
import { NextRequest } from 'next/server';
import { setApiKeyTool } from '@/lib/ai/tools';

const SYSTEM_PROMPT = 'You are a friendly assistant. Do not use emojis in your responses. Make sure to format code blocks, and add language/title to it. When an information is provided, if possible, try to store it for future reference.';

export async function POST(request: NextRequest) {
  const {
    messages,
    apiKey
  }: {
    messages: Array<Message>;
    apiKey: string;
  } = await request.json();

  try {
    let client = await createMCPClient({
      transport: {
        type: 'sse',
        url: 'https://mcp.meetingbaas.com/sse',
        headers: {
          'x-meeting-baas-api-key': apiKey,
        }
      },
      onUncaughtError: (error) => {
        console.error('MCP Client error:', error);
      },
    });

    const toolSet = await client.tools();
    const tools = { ...toolSet, setApiKey: setApiKeyTool };

    const result = streamText({
      // todo: add models.ts file
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
      system: `${SYSTEM_PROMPT} The user has provided their MeetingBaas API Key, and it is successfully stored. The API Key is: ${apiKey}`,
      messages,
    });

    return result.toDataStreamResponse({
      getErrorMessage: (error) => {
        if (NoSuchToolError.isInstance(error)) {
          return 'The model tried to call a unknown tool.';
        } else if (InvalidToolArgumentsError.isInstance(error)) {
          return 'The model called a tool with invalid arguments.';
        } else if (ToolExecutionError.isInstance(error)) {
          console.log(error);
          return 'An error occurred during tool execution.';
        } else {
          return 'An unknown error occurred.';
        }
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to generate text' });
  }
}
