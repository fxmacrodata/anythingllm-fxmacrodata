import test from 'node:test';
import assert from 'node:assert/strict';
import { runtime, parameters } from '../src/handler';
import { capabilities } from '../src/client';
import { mockFetch, sample } from './fixtures';

test('native research schema exposes all 72 operations and the default workflow', () => {
  assert.equal(parameters.properties.operation.enum.length, 73);
  assert.equal(parameters.properties.arguments.anyOf.length, 73);
  assert.ok(!JSON.stringify(parameters).includes('api_key'));
});

for (const operation of capabilities)
  test(`AnythingLLM executes ${operation.id} and emits cited research data`, async () => {
    const original = globalThis.fetch;
    const { request } = mockFetch();
    globalThis.fetch = request;
    try {
      const args = sample(operation.schema) as Record<string, unknown>;
      if (operation.id === 'rest_stream_events')
        Object.assign(args, { max_events: 1, max_seconds: 1 });
      const result = await runtime.handler.call(
        { runtimeArgs: { authentication: 'public' } },
        { operation: operation.id, arguments: args },
      );
      assert.match(result, /Structured FXMacroData results:/);
      assert.match(result, /utm_source=anythingllm/);
      assert.match(result, /1.25/);
    } finally {
      globalThis.fetch = original;
    }
  });

test('host environment auth stays private and public mode ignores the same environment', async () => {
  const original = globalThis.fetch;
  const previousKey = process.env.FXMD_API_KEY;
  const sentinel = 'synthetic-native-anything-key';
  process.env.FXMD_API_KEY = sentinel;
  const { request, calls } = mockFetch(sentinel);
  globalThis.fetch = request;
  try {
    const context = { runtimeArgs: { authentication: 'environment' } };
    const result = await runtime.handler.call(context, { operation: 'mcp_ping' });
    assert.ok(!result.includes(sentinel));
    assert.ok(!JSON.stringify(context).includes(sentinel));
    assert.ok(calls.every((call) => new URL(call.url).searchParams.get('api_key') === sentinel));
    calls.length = 0;
    await runtime.handler.call(
      { runtimeArgs: { authentication: 'public' } },
      { operation: 'rest_ping' },
    );
    assert.ok(calls.every((call) => !new URL(call.url).searchParams.has('api_key')));
  } finally {
    globalThis.fetch = original;
    if (previousKey === undefined) delete process.env.FXMD_API_KEY;
    else process.env.FXMD_API_KEY = previousKey;
  }
});

test('native skill rejects credential arguments, unknown fields and an invalid authentication mode', async () => {
  await assert.rejects(
    runtime.handler.call({}, { operation: 'rest_ping', arguments: { api_key: 'synthetic' } }),
  );
  await assert.rejects(runtime.handler.call({}, { token: 'synthetic' } as any));
  await assert.rejects(
    runtime.handler.call(
      { runtimeArgs: { authentication: 'invalid' } },
      { operation: 'rest_ping' },
    ),
  );
  await assert.rejects(
    runtime.handler.call({}, { operation: 'daily_briefing', arguments: { token: 'synthetic' } }),
  );
});

test('invalid tool envelopes fail before sending a request', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error('Unexpected request');
  };
  try {
    for (const input of [
      null,
      [],
      '',
      1,
      { operation: null },
      { operation: 42 },
      { arguments: [] },
      { arguments: '' },
      { arguments: null },
    ])
      await assert.rejects(runtime.handler.call({}, input as any), /object|Operation/);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});
