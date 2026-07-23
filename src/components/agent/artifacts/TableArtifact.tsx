import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ArtifactSpec } from "@/lib/agent-blocks";
import { formatQty } from "@/lib/utils";

type Sort = { key: string; dir: "asc" | "desc" } | null;

function formatCell(v: unknown, numeric?: boolean): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return numeric ? formatQty(v) : v.toLocaleString("pt-BR");
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  return String(v);
}

export function TableArtifact({ spec }: { spec: Extract<ArtifactSpec, { type: "table" }> }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>(null);
  const [page, setPage] = useState(0);
  const pageSize = spec.pageSize ?? 25;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return spec.rows;
    return spec.rows.filter((row) =>
      spec.columns.some((col) => String(row[col.key] ?? "").toLowerCase().includes(q)),
    );
  }, [query, spec.rows, spec.columns]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const { key, dir } = sort;
    const factor = dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor;
      return String(av).localeCompare(String(bv), "pt-BR", { numeric: true }) * factor;
    });
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = sorted.slice(page * pageSize, page * pageSize + pageSize);

  const toggleSort = (key: string) =>
    setSort((s) =>
      s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null,
    );

  return (
    <div className="flex h-full flex-col gap-2">
      {(spec.searchable ?? true) && (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar…"
            className="h-8 pl-7 text-xs"
          />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
            <TableRow>
              {spec.columns.map((col) => {
                const active = sort?.key === col.key;
                const Icon = !active ? ArrowUpDown : sort!.dir === "asc" ? ArrowUp : ArrowDown;
                return (
                  <TableHead
                    key={col.key}
                    style={{ width: col.width, textAlign: col.align }}
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1 text-xs font-semibold">
                      {col.label}
                      <Icon className={"h-3 w-3 " + (active ? "text-primary" : "text-muted-foreground/60")} />
                    </span>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={spec.columns.length} className="py-6 text-center text-xs text-muted-foreground">
                  Nenhum registro.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((row, i) => (
              <TableRow key={i}>
                {spec.columns.map((col) => (
                  <TableCell
                    key={col.key}
                    style={{ textAlign: col.align ?? (col.numeric ? "right" : "left") }}
                    className="text-xs tabular-nums"
                  >
                    {formatCell(row[col.key], col.numeric)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {sorted.length.toLocaleString("pt-BR")} registro{sorted.length === 1 ? "" : "s"}
        </span>
        {pageCount > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              ←
            </Button>
            <span>
              {page + 1} / {pageCount}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
