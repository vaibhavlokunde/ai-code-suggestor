import * as vscode from 'vscode';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

export function activate(context: vscode.ExtensionContext) {
  const provider: vscode.InlineCompletionItemProvider = {
    provideInlineCompletionItems: async (document, position, context, token) => {
      const linePrefix = document.lineAt(position).text.substr(0, position.character);
      if (!linePrefix.trim()) return [];

      const prompt = document.getText(
        new vscode.Range(new vscode.Position(0, 0), position)
      );

      try {
        const response = await getAISuggestion(prompt);
        if (!response) return [];

        return [
          {
            insertText: response,
            range: new vscode.Range(position, position),
          },
        ];
      } catch (error) {
        console.error(error);
        return [];
      }
    },
  };

  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      { pattern: '**' },
      provider
    )
  );
}

async function getAISuggestion(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  const response = await axios.post(apiUrl, {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are an assistant that helps write code.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 50,
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data.choices?.[0]?.message?.content?.trim() || null;
}

export function deactivate() {}
