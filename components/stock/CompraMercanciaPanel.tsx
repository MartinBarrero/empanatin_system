"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { CompraMercancia, TipoMercancia } from "@/lib/repositorios/comprasMercancia";
import type { Configuracion } from "@/lib/calculos";
import { crearCompraAction } from "@/app/actions/compras";

interface Props {
  comprasIniciales: CompraMercancia[];
  config: Configuracion;
}

function formatoPesos(valor: number): string {
  return `$${Math.round(valor).toLocaleString("es-CO")}`;
}

function costoSugerido(tipo: TipoMercancia, cantidadPaquetes: number, config: Configuracion): number {
  const costoPaquete =
    tipo === "carne"
      ? config.costo_paquete_carne
      : tipo === "pollo"
        ? config.costo_paquete_pollo
        : config.costo_paquete_salsa;
  return costoPaquete * cantidadPaquetes;
}

export function CompraMercanciaPanel({ comprasIniciales, config }: Props) {
  const router = useRouter();
  const [compras, setCompras] = useState(comprasIniciales);
  const [tipo, setTipo] = useState<TipoMercancia>("carne");
  const [cantidadPaquetes, setCantidadPaquetes] = useState("1");
  const [costoTotal, setCostoTotal] = useState("");
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [guardando, startTransition] = useTransition();

  const cantidad = Number(cantidadPaquetes) || 0;
  const sugerido = costoSugerido(tipo, cantidad, config);

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensaje(null);

    startTransition(async () => {
      const resultado = await crearCompraAction({
        fecha: new Date().toISOString().slice(0, 10),
        tipo,
        cantidad_paquetes: cantidad,
        costo_total: costoTotal.trim() === "" ? undefined : Number(costoTotal),
      });

      if (!resultado.ok) {
        setMensaje({ tipo: "error", texto: resultado.error });
        return;
      }

      setCompras((actual) => [resultado.compra, ...actual]);
      setCantidadPaquetes("1");
      setCostoTotal("");
      setMensaje({ tipo: "ok", texto: "Compra registrada." });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-md border border-border bg-surface p-4 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm text-muted">
          Tipo
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoMercancia)}
            className="rounded-md border border-border bg-background px-3 py-2 text-foreground"
          >
            <option value="carne">Carne</option>
            <option value="pollo">Pollo</option>
            <option value="salsa">Salsa</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Paquetes
          <input
            type="number"
            min="1"
            value={cantidadPaquetes}
            onChange={(e) => setCantidadPaquetes(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Costo total (sugerido {formatoPesos(sugerido)})
          <input
            type="number"
            min="0"
            placeholder={String(sugerido)}
            value={costoTotal}
            onChange={(e) => setCostoTotal(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-foreground"
          />
        </label>
        <button
          type="submit"
          disabled={guardando}
          className="self-end rounded-md bg-accent px-4 py-2 font-medium text-background disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Registrar compra"}
        </button>
      </form>

      {mensaje && (
        <p className={mensaje.tipo === "ok" ? "text-sm text-success" : "text-sm text-danger"}>
          {mensaje.texto}
        </p>
      )}

      <div>
        <h3 className="mb-3 text-sm font-medium text-muted">Historial de compras</h3>
        <ul className="flex flex-col gap-2">
          {compras.length === 0 && <li className="text-sm text-muted">Aún no hay compras registradas.</li>}
          {compras.map((compra) => (
            <li
              key={compra.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface p-3 text-sm"
            >
              <span className="text-foreground">
                {compra.fecha} — {compra.tipo} × {compra.cantidad_paquetes} paquetes
              </span>
              <span className="text-muted">{formatoPesos(compra.costo_total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
