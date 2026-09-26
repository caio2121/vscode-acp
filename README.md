# Caio OpenCode ACP

Uma extensão própria para VS Code que conecta o editor a agentes compatíveis
com o [Agent Client Protocol (ACP)](https://agentclientprotocol.com/), com o
[OpenCode](https://opencode.ai/) instalado localmente como integração padrão.

## O que foi personalizado

- Identidade `Caio OpenCode ACP`, publisher `caio2121` e metadados apontando
  para [este fork](https://github.com/caio2121/vscode-acp).
- Ícones, nomes dos canais de log e textos da extensão próprios.
- Sem telemetria remota: os diagnósticos ficam somente nos canais locais do
  VS Code.
- O agente OpenCode usa o executável instalado (`opencode acp`) e a
  configuração/autenticação do usuário, em vez de baixar outro CLI via `npx`.
- `opencode.jsonc` fixa o teste e o uso padrão em `opencode/big-pickle`.
  Altere esse campo se outro modelo/provider for desejado.

## Pré-requisitos

- Node.js 18+;
- VS Code 1.85+;
- `opencode` disponível no `PATH`;
- uma instalação funcional do OpenCode. Se escolher um provider que exige
  login, confira apenas os nomes/tipos das credenciais com:

```bash
opencode auth list
```

O arquivo de credenciais não faz parte deste repositório e nunca deve ser
copiado para ele.

## Configuração e execução

```bash
npm ci
npm run compile
```

Pressione `F5` no VS Code para abrir o Extension Development Host. Abra o
painel **Caio ACP**, selecione **OpenCode** e envie uma mensagem.

O projeto mantém os demais agentes ACP pré-configurados. Eles continuam
disponíveis pelo ajuste `acp.agents`; o agente OpenCode padrão é:

```json
{
  "command": "opencode",
  "args": ["acp"],
  "env": {}
}
```

Quando o ambiente exporta `OPENCODE_CONFIG`/`OPENCODE_CONFIG_DIR` para uma
configuração incompatível, a extensão remove essas duas variáveis somente para
o agente OpenCode, a menos que sejam definidas explicitamente no agente do
usuário. Assim o CLI usa a configuração normal do usuário/projeto e a
autenticação já instalada.

## Verificação ponta a ponta do OpenCode

Este smoke test inicia o processo ACP real, faz `initialize`, cria uma sessão,
envia uma requisição real e valida o texto retornado:

```bash
npm run smoke:opencode
```

Ele imprime `SMOKE_RESULT=PASS`, o agente/protocolo/modelo observados e a
resposta recebida. Não usa mock nem imprime credenciais.

Para executar também o round-trip dentro do Extension Development Host:

```bash
# PowerShell
$env:CAIO_ACP_E2E = "1"; npm test
```

## Testes e empacotamento

```bash
npm run lint
npm run compile
npm test
npm run package
npx @vscode/vsce package
```

Para revisar o protocolo ACP durante uma sessão, use os comandos **Caio ACP:
Show Log** e **Caio ACP: Show Protocol Traffic**.

## Arquitetura

- **Core**: `AgentManager`, `ConnectionManager`, `SessionManager` e
  `AcpClientImpl`;
- **Handlers**: filesystem, terminal, permissões e atualizações de sessão;
- **UI**: árvore de agentes, chat webview e barra de status;
- **Config**: agentes configuráveis e registry ACP;
- **Diagnóstico**: canais locais de log e tráfego JSON-RPC.

A comunicação com os agentes usa JSON-RPC 2.0 sobre stdio, conforme ACP.

## Créditos e licença

Este projeto é um fork independente de
[`formulahendry/vscode-acp`](https://github.com/formulahendry/vscode-acp).
Os créditos e o aviso de copyright do autor original foram preservados em
[`LICENSE`](LICENSE), conforme a licença MIT. As alterações próprias estão
descritas acima e no histórico do repositório.
