const { spawn } = require('node:child_process');

const cwd = process.argv[2] || process.cwd();
const env = { ...process.env };

// Use the installed OpenCode CLI with its normal user/project configuration.
// The host environment can point at an incompatible managed config, so mirror
// the extension's OpenCode isolation behavior unless a caller overrides it.
delete env.OPENCODE_CONFIG;
delete env.OPENCODE_CONFIG_DIR;

const child = spawn('opencode', ['acp'], {
  cwd,
  env,
  shell: true,
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buffer = '';
let nextId = 1;
const pending = new Map();
const notifications = [];
let assistantText = '';

function send(method, params) {
  const id = nextId++;
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`timeout while waiting for ${method}`));
    }, 90_000);
    timer.unref();
    pending.set(id, { resolve, reject, timer });
  });
}

function handleLine(line) {
  if (!line.trim()) return;
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }

  if (message.method) {
    notifications.push(message.method);
    const update = message.params?.update;
    if (message.method === 'session/update' && update?.sessionUpdate === 'agent_message_chunk') {
      assistantText += update.content?.text || '';
    }
  }

  if (message.id == null || !pending.has(message.id)) return;
  const request = pending.get(message.id);
  pending.delete(message.id);
  clearTimeout(request.timer);
  if (message.error) {
    request.reject(new Error(message.error.message || 'OpenCode ACP request failed'));
  } else {
    request.resolve(message.result);
  }
}

child.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  let newline;
  while ((newline = buffer.indexOf('\n')) !== -1) {
    handleLine(buffer.slice(0, newline));
    buffer = buffer.slice(newline + 1);
  }
});

child.stderr.on('data', (chunk) => {
  const text = chunk.toString().trim();
  if (text && /error|invalid|failed|auth/i.test(text)) {
    process.stderr.write(`OpenCode stderr: ${text.slice(0, 500)}\n`);
  }
});

function stop() {
  if (!child.killed) child.kill();
}

child.on('error', (error) => {
  process.stderr.write(`OpenCode process error: ${error.message}\n`);
  process.exitCode = 1;
});

(async () => {
  try {
    const init = await send('initialize', {
      protocolVersion: 1,
      clientInfo: { name: 'caio-opencode-acp-smoke', version: '0.1.0' },
      clientCapabilities: { fs: { readTextFile: false, writeTextFile: false }, terminal: false },
    });
    const session = await send('session/new', { cwd, mcpServers: [] });
    const model = session.models?.currentModelId
      || session.configOptions?.find((option) => option.category === 'model')?.currentValue
      || 'agent-default';

    const promptResponse = await send('session/prompt', {
      sessionId: session.sessionId,
      prompt: [{ type: 'text', text: 'Reply with exactly: ACP integration OK. Do not use tools.' }],
    });
    if (promptResponse.stopReason !== 'end_turn' || !assistantText.includes('ACP integration OK')) {
      throw new Error(`unexpected response: stopReason=${promptResponse.stopReason}, text=${assistantText.slice(0, 120)}`);
    }

    process.stdout.write(`SMOKE_RESULT=PASS\nSMOKE_AGENT=${init.agentInfo?.name || 'unknown'}\n`);
    process.stdout.write(`SMOKE_PROTOCOL=${init.protocolVersion}\nSMOKE_SESSION=${session.sessionId}\n`);
    process.stdout.write(`SMOKE_MODEL=${model}\nSMOKE_NOTIFICATIONS=${notifications.join(',')}\n`);
    process.stdout.write(`SMOKE_RESPONSE=${assistantText.trim()}\n`);
  } catch (error) {
    process.stderr.write(`SMOKE_RESULT=FAIL\nSMOKE_FAILURE=${error.message}\n`);
    process.exitCode = 1;
  } finally {
    for (const request of pending.values()) clearTimeout(request.timer);
    stop();
  }
})();
