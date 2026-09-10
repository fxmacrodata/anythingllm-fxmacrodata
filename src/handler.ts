import { FXMacroDataClient, capabilities, renderResult, type DataResult } from './client';

// AnythingLLM's native ImportedPlugin spreads runtime.parameters into the actual
// agent function registration, retaining this complete object schema.
export const parameters = {
  type: 'object',
  additionalProperties: false,
  properties: {
    operation: {
      type: 'string',
      enum: ['daily_briefing', ...capabilities.map((item) => item.id)],
      description:
        'FXMacroData operation. daily_briefing fetches current USD indicators, releases, and sessions together. Prefixes select the REST or MCP contract.',
    },
    arguments: {
      type: 'object',
      description:
        'Named parameters for the selected operation. Omit for the default USD daily briefing.',
      anyOf: [
        {
          type: 'object',
          properties: { currency: { type: 'string', default: 'usd' } },
          additionalProperties: false,
        },
        ...capabilities.map((item) => ({
          ...item.schema,
          title: item.id,
          description: `Arguments for ${item.id}: ${item.description}`,
          additionalProperties: false,
        })),
      ],
    },
  },
};

interface Context {
  runtimeArgs?: { authentication?: string };
}

export const runtime = {
  parameters,
  async handler(
    this: Context,
    input: { operation?: string; arguments?: Record<string, unknown> } = {},
  ): Promise<string> {
    if (!input || typeof input !== 'object' || Array.isArray(input))
      throw new Error('Provide an object with operation and its named arguments.');
    const operation = input.operation ?? 'daily_briefing';
    if (Object.keys(input).some((key) => !['operation', 'arguments'].includes(key)))
      throw new Error('Use only operation and its named arguments.');
    if (
      typeof operation !== 'string' ||
      (input.operation !== undefined && input.operation === null)
    )
      throw new Error('Operation must be a name from the FXMacroData operation list.');
    if (
      input.arguments !== undefined &&
      (!input.arguments || typeof input.arguments !== 'object' || Array.isArray(input.arguments))
    )
      throw new Error('Arguments must be an object of named operation parameters.');
    const mode = this.runtimeArgs?.authentication ?? 'public';
    if (!['public', 'environment'].includes(mode))
      throw new Error('Choose public or environment authentication in the Skill settings.');
    // The host's environment/secret deployment owns this optional value. It is
    // never stored in plugin.json, runtimeArgs, configuration, or tool schemas.
    const apiKey = mode === 'environment' ? process.env.FXMD_API_KEY : undefined;
    if (mode === 'environment' && !apiKey)
      throw new Error(
        'Configure FXMD_API_KEY in the host secret environment, or select public access.',
      );
    const client = new FXMacroDataClient({ apiKey, slug: 'anythingllm' });
    const args = input.arguments ?? {};
    let results: DataResult[];
    if (operation === 'daily_briefing') {
      if (
        Object.keys(args).some((key) => key !== 'currency') ||
        (args.currency !== undefined && typeof args.currency !== 'string')
      )
        throw new Error('Daily briefing accepts only an optional currency code.');
      results = await client.briefing((args.currency as string | undefined) ?? 'usd');
    } else results = [await client.execute(operation, args)];
    // Native agent function results are strings. Include readable tables and the
    // lossless structured envelope for downstream chart/research agent tools.
    const rendered = results.map(renderResult).join('\n\n---\n\n');
    return `${rendered}\n\nStructured FXMacroData results:\n${JSON.stringify(results)}`;
  },
};
