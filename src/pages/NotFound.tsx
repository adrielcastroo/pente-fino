import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Compass, ArrowLeft } from "lucide-react";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <Seo
        title="Página não encontrada — Pente Fino"
        description="O endereço acessado não existe ou foi movido. Volte ao início do Sistema Pente Fino."
        path={location.pathname}
        noindex
      />
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center text-muted-foreground">
          <Compass className="h-9 w-9" aria-hidden="true" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
          Erro 404
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Esta página não existe por aqui
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          O endereço <span className="font-mono text-foreground/80">{location.pathname}</span> pode
          ter sido movido, renomeado ou nunca existiu. Nenhum dado foi perdido.
        </p>
        <Button asChild className="mt-7 h-11 font-semibold gap-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para os módulos
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
