import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('caio2121.caio-opencode-acp'));
	});

	test('Should activate extension', async () => {
		const ext = vscode.extensions.getExtension('caio2121.caio-opencode-acp');
		assert.ok(ext);
		await ext.activate();
		assert.strictEqual(ext.isActive, true);
	});

	test('Should register ACP commands', async () => {
		const commands = await vscode.commands.getCommands(true);
		const acpCommands = commands.filter(c => c.startsWith('acp.'));
		assert.ok(acpCommands.length > 0, 'ACP commands should be registered');
		assert.ok(acpCommands.includes('acp.connectAgent'), 'connectAgent command should exist');
		assert.ok(acpCommands.includes('acp.newConversation'), 'newConversation command should exist');
		assert.ok(acpCommands.includes('acp.openChat'), 'openChat command should exist');
	});

	test('OpenCode ACP round trip (opt-in)', async function () {
		this.timeout(120_000);
		if (process.env.CAIO_ACP_E2E !== '1') {
			this.skip();
			return;
		}

		const session = await vscode.commands.executeCommand<{ sessionId: string }>('acp.connectAgent', 'OpenCode');
		assert.ok(session?.sessionId, 'OpenCode should create an ACP session');
		const response = await vscode.commands.executeCommand<{ stopReason: string }>(
			'acp.sendPrompt',
			'Reply with exactly: ACP extension integration OK. Do not use tools.',
		);
		assert.strictEqual(response?.stopReason, 'end_turn');
		await vscode.commands.executeCommand('acp.disconnectAgent');
	});
});
