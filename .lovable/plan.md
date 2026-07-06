## Diagnóstico

O preview que funcionava (`384e237a`, ~02/07) usava um caminho específico para n8n **local/privado** que foi removido nas últimas iterações. O código atual (`src/services/printService.ts`) faz apenas:

```ts
fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
})
```

Isso dispara **preflight CORS (OPTIONS)** no navegador. n8n rodando local (`localhost:5678`, `192.168.x.x`, etc.) tipicamente **não responde OPTIONS com `Access-Control-Allow-Origin`**, então o browser bloqueia o POST antes de sair — a etiqueta nunca chega no n8n. O `res.ok` também falha e o toast mostra "webhook falhou".

Na versão que funcionava, para URLs locais o envio era:
- `mode: 'no-cors'` (dispara "simple request", **sem preflight**)
- corpo como `URLSearchParams` (`application/x-www-form-urlencoded`, que também é "simple")
- `imageBase64` como campo do form → n8n continua lendo em `$json.body.imageBase64`
- resposta tratada como sucesso "fire-and-forget" (opaque response), porque o browser esconde o status quando é `no-cors`

Para URLs **públicas** (não-local), mantinha JSON normal para conseguir ler o status HTTP.

## O que restaurar em `src/services/printService.ts`

1. **Helper `isLocalWebhookUrl(url)`** — detecta `localhost`, `127.0.0.1`, hostnames `.local`, e faixas privadas `10.x.x.x`, `192.168.x.x`, `172.16-31.x.x`.

2. **`sendToWebhook` com dois caminhos:**
   - **URL local** → `fetch(url, { method: 'POST', mode: 'no-cors', body: URLSearchParams })` com todos os campos como strings (`imageBase64`, `mimeType`, `type`, `template`, `format`, `title`, `widthMm`, `heightMm`, `imageSize`, `sentAt`, `data` como JSON string). Não checa `res.ok` (resposta é opaque) — considera enviado.
   - **URL pública** → mantém `fetch` com `application/json` + `JSON.stringify(body)` e valida `res.ok`.

3. **Toast** — para local, "Etiqueta enviada para o n8n (fire-and-forget)"; para pública, mesma mensagem atual.

## O que NÃO alterar

- `SettingsPage.tsx`, `LabelLayoutPanel.tsx`, `useAppStore.ts` — já estão no formato de webhook único, sem override de motor. Sem mudança.
- Fluxo do `dispatchPrint` (validação, fallback para navegador quando não há webhook) — mantido.
- Payload/campos enviados — mantidos os mesmos nomes, só muda o **encoding** (form vs JSON) quando é local.
- **Não** recriar a Edge Function `n8n-proxy` — para n8n local ela não ajuda (Supabase não alcança sua rede).

## Detalhes técnicos

- `URLSearchParams` faz o browser mandar `Content-Type: application/x-www-form-urlencoded;charset=UTF-8`, que é whitelisted como "simple request" — não gera OPTIONS.
- `mode: 'no-cors'` remove qualquer chance de preflight e faz o browser aceitar a resposta como `opaque` (não conseguimos ler status, mas o POST **sai**).
- No workflow do n8n, `$json.body.imageBase64` funciona igual para JSON e para form-urlencoded — o n8n faz o parse automaticamente.
- Sem `keepalive` (ele descarta payloads &gt; ~64KB, e a etiqueta base64 passa disso).

## Arquivo a editar

- `src/services/printService.ts` — adicionar `isLocalWebhookUrl` e reescrever `sendToWebhook` com os dois caminhos descritos acima.

## Validação

- Rodar `webhook-url.test.ts` e `useAppStore.persist.test.ts` — devem continuar verdes.
- Testar imprimindo uma etiqueta de tecido: no DevTools &gt; Network, esperar ver o POST para `http://localhost:5678/...` com status `(opaque)` e o n8n recebendo `body.imageBase64`.
