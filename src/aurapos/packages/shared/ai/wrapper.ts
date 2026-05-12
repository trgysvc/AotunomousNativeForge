import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';

export class DeepSeekWrapper {
  private baseURL: string;
  private apiKey: string | undefined;
  private httpsAgent: HttpsAgent;
  private httpAgent: HttpAgent;

  constructor(baseURL?: string, apiKey?: string) {
    this.baseURL = baseURL ?? 'https://api.deepseek.com/v1';
    this.apiKey = apiKey ?? process.env.DEEPSEEK_API_KEY;
    const keepAliveOptions = { keepAlive: true };
    this.httpsAgent = new HttpsAgent(keepAliveOptions);
    this.httpAgent = new HttpAgent(keepAliveOptions);
  }

  private getAgent(url: URL): HttpAgent | HttpsAgent {
    return url.protocol === 'https:' ? this.httpsAgent : this.httpAgent;
  }

  async chatCompletion(
    messages: Array<{ role: string; content: string }>,
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      [key: string]: unknown;
    } = {}
  ): Promise<unknown> {
    const url = new URL('/chat/completions', this.baseURL);
    const body = {
      messages,
      ...options,
      model: options.model ?? 'deepseek-chat',
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1000,
    };

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify(body),
      agent: this.getAgent(url),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }
}