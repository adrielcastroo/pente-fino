p = 'src/pages/expedicao/RomaneioPage.tsx'
with open(p, encoding='utf-8') as f:
    content = f.read()

# 1. Add editingField state
old_state = "  const [editingRow, setEditingRow] = useState<number | null>(null);\n  const [editData, setEditData] = useState<Partial<PreviewRow> & { id?: string }>({});"
new_state = "  const [editingRow, setEditingRow] = useState<number | null>(null);\n  const [editingField, setEditingField] = useState<keyof PreviewRow | null>(null);\n  const [editData, setEditData] = useState<Partial<PreviewRow>>({});"
content = content.replace(old_state, new_state)

# 2. Fix handlers to use editingField
content = content.replace(
    "setEditingRow(idx);",
    "setEditingRow(idx);\n    setEditingField(field);"
)
content = content.replace(
    "setEditingRow(null);",
    "setEditingRow(null);\n    setEditingField(null);"
)

# 3. Replace table body - use line-based approach
lines = content.split('\n')
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    if '<TableBody>' in line and i > 0:
        # Found TableBody, skip until matching </TableBody>
        # First collect the indentation
        indent = len(line) - len(line.lstrip())
        j = i + 1
        while j < len(lines) and '</TableBody>' not in lines[j]:
            j += 1
        # j is now at </TableBody> or past end
        if j < len(lines) and '</TableBody>' in lines[j]:
            # Insert new table body
            new_block = '''                  <TableBody>
                    {importedLinhas.map((row, idx) => {
                      const isEditing = editingRow === idx;
                      const current = isEditing ? editData : row;
                      const parts: string[] = [];
                      if (row.decisao) {
                        const { situacao, modalidade, flagExcecao, qtdPedidos } = row.decisao;
                        if (modalidade) parts.push(modalidade);
                        if (situacao === 'atingido' && qtdPedidos > 0) parts.push(`${qtdPedidos}x`);
                        else if (situacao === 'sem_pedidos') parts.push('sem pedidos');
                        if (flagExcecao && !parts.includes('sem pedidos')) parts.push('exceção');
                        if (situacao === 'instrucao') parts.push('instrução planilha');
                      }
                      if (row.observacoes) parts.push(row.observacoes);
                      const renderCell = (
                        field: keyof PreviewRow,
                        display: React.ReactNode,
                        inputType: 'text' | 'number' = 'text',
                        className = 'text-xs',
                      ) => {
                        const editingFieldHere = isEditing && editingField === field;
                        if (!editingFieldHere) {
                          return (
                            <td
                              className={className}
                              onDoubleClick={() => handleEditStart(idx, field)}
                            >
                              {display}
                            </td>
                          );
                        }
                        return (
                          <td className={className} onClick={(e) => e.stopPropagation()}>
                            <Input
                              type={inputType}
                              value={String(current[field] ?? '')}
                              onChange={(e) =>
                                handleEditChange(
                                  field,
                                  inputType === 'number'
                                    ? Number(e.target.value) || 0
                                    : e.target.value,
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleEditSave(idx);
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  handleEditCancel();
                                }
                              }}
                              autoFocus
                              className="h-7 text-xs"
                            />
                          </td>
                        );
                      };
                      return (
                        <TableRow key={idx} className={isEditing ? 'bg-muted/50' : ''}>
                          {renderCell('codigoCliente', row.codigoCliente, 'text', 'font-mono text-xs')}
                          {renderCell('nomeCliente', row.nomeCliente)}
                          {renderCell('nf', row.nf || '-')}
                          {renderCell(
                            'data',
                            row.data
                              ? (() => {
                                  const d = row.data.split('-');
                                  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : row.data;
                                })()
                              : '-',
                          )}
                          {renderCell(
                            'transportador',
                            <Badge variant="outline" className="text-[10px]">
                              {row.decisao?.transportadora || row.transportador || '-'}
                            </Badge>,
                          )}
                          {renderCell('volume', typeof row.volume === 'number' ? row.volume : '-', 'number', 'text-xs text-center')}
                          <td className="text-xs text-center">
                            {parts.length > 0 ? parts.join(' · ') : '-'}
                          </td>
                        </TableRow>
                      );
                    })}
                  </TableBody>'''
            new_lines.append(new_block)
            i = j + 1
            continue
    new_lines.append(line)
    i += 1

content = '\n'.join(new_lines)

with open(p, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
