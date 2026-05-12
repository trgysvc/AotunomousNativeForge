export class DeepSeekWrapper {
  private apiKey: string | undefined;
  private baseUrl: string;
  private model: string;

  constructor(options: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  } = {}) {
    this.apiKey = options.apiKey ?? process.env.DEEPSEEK_API_KEY;
    this.baseUrl = options.baseUrl ?? process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com';
    this.model = options.model ?? process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';
  }

  async generate(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      stop?: string | string[];
    } = {}
  ): Promise<string> {
    const url = `${this.baseUrl.replace(/\/+$/, '')}/v1/chat/completions`;
    
    const payload = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 512,
      top_p: options.topP ?? 1.0,
      frequency_penalty: options.frequencyPenalty ?? 0.0,
      presence_penalty: options.presencePenalty ?? 0.0,
      stop: options.stop ?? undefined
    };

    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    return data.choices[0].message.content;
  }
}