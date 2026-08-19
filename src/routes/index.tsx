import React from 'react';

export default function ErrorDisplay() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Preciso corrigir dois erros críticos na página:</h1>
      <p className="mb-2">/estoque/acabamentos</p>
      <p className="mb-4">O erro observado no navegador é:</p>
      <pre className="bg-muted p-4 rounded mb-8">
{ `TypeError: removidasManualmente.has is not a function

    at GerarTagTab.tsx` }
      </pre>
      
      <p className="mb-2">O erro ainda persiste em produção e precisa ser corrigido definitivamente, not apenas mascarado.</p>
      <p className="mb-4">Erro atual:</p>
      <pre className="bg-muted p-4 rounded">
{ `TypeError: removidasManualmente.has is not a function` }
      </pre>
    </div>
  );
}
