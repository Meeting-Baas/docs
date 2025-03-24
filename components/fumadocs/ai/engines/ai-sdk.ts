import type { Engine, MessageRecord } from '@/components/fumadocs/ai/context';
import { processChatResponse } from '@/lib/ai/process-chat-response';
import { generateId } from 'ai';
import type { Message, ToolCall, } from "ai";

// TODO: Decide the best method for handling API key input and storage:
// Option 1: Use the `getApiKey` tool call to prompt the user for their API key. (similar to generative ui)
// - This shows a UI for input, writes the key to localStorage, and appends a message to the chat history.
// - However, the tool call itself returns a blank response like "getting key", which doesn't make much sense semantically.
// - This seems like the better option because it's a one-shot flow that's more user-friendly and doesn't require the client to handle the key. But, as we can't use react components in the AI engine, it'll be a bit more complex to implement.
//
// Option 2: Use the `setApiKey` tool call to set the API key directly from the engine.
// - The AI asks the user for the API key, then checks for the tool call on the client side to set it in localStorage.
// - This feels messier: it's an extra tool call that just says "setting key" on the server, but the client handles it by checking for this tool call and then saving the key.
// - It's not really a one-shot flow and feels kind of lazy or clunky.
// 
// Figure out which method is more reliable, clean, and user-friendly in the context of the current architecture.
// UPDATE: I'm going with option 2 for now, as it's simpler to implement and doesn't require any UI components in the AI engine.
// If we need to change this later, we can refactor it to use the `getApiKey` tool call instead.

export async function createAiSdkEngine(): Promise<Engine> {
  let messages: Message[] = [];
  let controller: AbortController | null = null;
  let apiKey: string | null = null;

  async function fetchStream(
    userMessages: Message[],
    onUpdate?: (full: string) => void,
    onEnd?: (full: string) => void,
  ) {
    apiKey = localStorage.getItem('meetingbaas-api-key');
    controller = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: userMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          apiKey: apiKey || '',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let textContent = '';

      const onToolCall = async (props: { toolCall: ToolCall<string, unknown> }) => {
        const { toolCall: tool } = props;
        if (tool.toolName === 'setApiKey') {
          const parameters = tool.args as { apiKey: string };
          apiKey = parameters?.apiKey;

          localStorage.setItem('meetingbaas-api-key', apiKey);
        }
      };

      if (response.body) {
        await processChatResponse({
          stream: response.body,
          update: (chunk) => {
            textContent = chunk.message.content;
            onUpdate?.(textContent);
          },
          lastMessage: {
            ...messages[messages.length - 1],
            parts: []
          },
          onToolCall: onToolCall,
          onFinish({ message, finishReason }) {
            onEnd?.(message?.content || '');
            // console.log('chat', finishReason);
          },
          generateId,
        });
      } else {
        throw new Error('Response body is null');
      }

      return textContent;
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error in AI stream:', error);
        const errorMessage =
          'Sorry, an error occurred while generating a response.';
        onEnd?.(errorMessage);
        return errorMessage;
      }
      return '';
    }
  }

  return {
    async prompt(text, onUpdate, onEnd) {
      messages.push({
        id: generateId(),
        role: 'user',
        content: text,
      });

      const response = await fetchStream(messages, onUpdate, onEnd);
      messages.push({
        id: generateId(),
        role: 'assistant',
        content: response,
      });
    },
    async regenerateLast(onUpdate, onEnd) {
      const last = messages.at(-1);
      if (!last || last.role === 'user') {
        return;
      }

      messages.pop();

      const response = await fetchStream(messages, onUpdate, onEnd);
      messages.push({
        id: generateId(),
        role: 'assistant',
        content: response,
      });
    },
    getHistory() {
      return messages as MessageRecord[];
    },
    clearHistory() {
      messages = [];
    },
    abortAnswer() {
      controller?.abort();
    },
  };
}
