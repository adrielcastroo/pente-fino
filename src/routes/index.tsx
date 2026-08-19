import React from 'react';

export default function ErrorDisplay() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Preciso corrigir dois problemas técnicos no frontend, sem alterar regras de negócio.</h1>
      
      <div className="my-8">
        <p className="font-bold">==================================================</p>
        <p className="font-bold">RESTRIÇÕES ABSOLUTAS</p>
        <p className="font-bold">==================================================</p>
      </div>

      <p className="mb-4">NÃO ALTERAR A LÓGICA DO BLOCO “RESUMO”.</p>
      <p className="mb-4">NÃO ALTERAR A LÓGICA DO BLOCO “MANTER TAG CUSTOMIZADA”.</p>
      
      <p className="mb-4 italic">Esses dois blocos estão protegidos e fora do escopo desta correção.</p>

      <p className="mb-2">Não alterar neles:</p>
      <ul className="list-disc ml-8 mb-4">
        <li>busca;</li>
        <li>filtros;</li>
        <li>seleção;</li>
        <li>seleção em massa;</li>
        <li>contagem;</li>
        <li>ordenação;</li>
        <li>remoção;</li>
        <li>inclusão;</li>
        <li>alteração;</li>
        <li>exclusão;</li>
        <li>payloads;</li>
        <li>consultas;</li>
        <li>RPCs;</li>
        <li>chamadas ao backend;</li>
        <li>validações;</li>
        <li>mensagens;</li>
        <li>regras de negócio.</li>
      </ul>

      <p className="mb-4">Também não alterar o fluxo de TAGs da página <code>/estoque/acabamentos</code>, exceto se alguma alteração for estritamente necessária para corrigir os erros técnicos descritos abaixo.</p>
      <p className="mb-4">Não refatorar componentes de negócio.</p>
      <p className="mb-4">Não modificar permissões, roles ou regras de acesso das páginas protegidas.</p>

      <p className="mb-2 font-bold">Reforço obrigatório:</p>
      <blockquote className="border-l-4 pl-4 italic mb-4">
        <p>NÃO ALTERAR O BLOCO RESUMO.</p>
        <p>NÃO ALTERAR O BLOCO MANTER TAG CUSTOMIZADA.</p>
        <p>Fazer somente correções técnicas no componente Sidebar/Dialog e no carregamento público do manifesto PWA.</p>
      </blockquote>

      <div className="my-8">
        <p className="font-bold">==================================================</p>
        <p className="font-bold">PROBLEMA 1 — WARNING DE REF NO SIDEBAR</p>
        <p className="font-bold">==================================================</p>
      </div>

      <p className="mb-4">O navegador exibe:</p>
      <pre className="bg-muted p-4 rounded mb-8 text-xs">
{ `Warning: Function components cannot be given refs.

Attempts to access this ref will fail.

Did you mean to use React.forwardRef()?

Check the render method of Sidebar.

    at Dialog

    at src/components/ui/sidebar.tsx

    at src/components/ModuleSidebar.tsx

    at src/components/EstoqueSidebar.tsx` }
      </pre>
    </div>
  );
}
