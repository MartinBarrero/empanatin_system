"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";
import type { CompraMercancia, TipoMercancia } from "@/lib/repositorios/comprasMercancia";
import type { Configuracion } from "@/lib/calculos";
import { actualizarCompraAction, crearCompraAction, eliminarCompraAction } from "@/app/actions/compras";

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

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edicionTipo, setEdicionTipo] = useState<TipoMercancia>("carne");
  const [edicionCantidad, setEdicionCantidad] = useState("1");
  const [edicionCosto, setEdicionCosto] = useState("");

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

  function handleIniciarEdicion(compra: CompraMercancia) {
    setMensaje(null);
    setEditandoId(compra.id);
    setEdicionTipo(compra.tipo);
    setEdicionCantidad(String(compra.cantidad_paquetes));
    setEdicionCosto(String(compra.costo_total));
  }

  function handleCancelarEdicion() {
    setEditandoId(null);
  }

  function handleGuardarEdicion(compra: CompraMercancia) {
    const cantidadEditada = Number(edicionCantidad) || 0;
    setMensaje(null);

    startTransition(async () => {
      const resultado = await actualizarCompraAction(compra.id, {
        fecha: compra.fecha,
        tipo: edicionTipo,
        cantidad_paquetes: cantidadEditada,
        costo_total: edicionCosto.trim() === "" ? undefined : Number(edicionCosto),
      });

      if (!resultado.ok) {
        setMensaje({ tipo: "error", texto: resultado.error });
        return;
      }

      setCompras((actual) => actual.map((c) => (c.id === compra.id ? resultado.compra : c)));
      setEditandoId(null);
      router.refresh();
    });
  }

  function handleEliminar(id: string) {
    if (!window.confirm("¿Eliminar esta compra? Esta acción no se puede deshacer.")) return;

    setMensaje(null);
    startTransition(async () => {
      const resultado = await eliminarCompraAction(id);

      if (!resultado.ok) {
        setMensaje({ tipo: "error", texto: resultado.error });
        return;
      }

      setCompras((actual) => actual.filter((c) => c.id !== id));
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-border/70 bg-surface p-5 shadow-lg shadow-black/20 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm text-muted">
          Tipo
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoMercancia)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground transition focus:border-accent"
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
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground transition focus:border-accent"
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
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground transition focus:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={guardando}
          className="self-end rounded-xl bg-accent px-5 py-2.5 font-semibold text-background shadow-glow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Registrar compra"}
        </button>
      </form>

      {mensaje && (
        <p className={mensaje.tipo === "ok" ? "text-sm text-success" : "text-sm text-danger"}>
          {mensaje.texto}
        </p>
      )}

      <div id="historial-compras" className="scroll-mt-24">
        <h3 className="mb-3 text-sm font-medium text-muted">Historial de compras</h3>
        <ul className="flex flex-col gap-2">
          {compras.length === 0 && <li className="text-sm text-muted">Aún no hay compras registradas.</li>}
          {compras.map((compra) =>
            editandoId === compra.id ? (
              <li
                key={compra.id}
                className="grid gap-3 rounded-xl border border-accent/60 bg-surface p-3 text-sm shadow-lg shadow-black/20 sm:grid-cols-4"
              >
                <select
                  value={edicionTipo}
                  onChange={(e) => setEdicionTipo(e.target.value as TipoMercancia)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-foreground transition focus:border-accent"
                >
                  <option value="carne">Carne</option>
                  <option value="pollo">Pollo</option>
                  <option value="salsa">Salsa</option>
                </select>
                <input
                  type="number"
                  min="1"
                  value={edicionCantidad}
                  onChange={(e) => setEdicionCantidad(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-foreground transition focus:border-accent"
                />
                <input
                  type="number"
                  min="0"
                  value={edicionCosto}
                  onChange={(e) => setEdicionCosto(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-foreground transition focus:border-accent"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => handleGuardarEdicion(compra)}
                    className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    disabled={guardando}
                    title="Cancelar"
                    onClick={handleCancelarEdicion}
                    className="rounded-lg border border-border p-2 text-muted transition hover:bg-border/30 disabled:opacity-60"
                  >
                    <X size={16} />
                  </button>
                </div>
              </li>
            ) : (
              <li
                key={compra.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-surface p-3 text-sm shadow-lg shadow-black/20"
              >
                <span className="text-foreground">
                  {compra.fecha} — {compra.tipo} × {compra.cantidad_paquetes} paquetes
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-muted">{formatoPesos(compra.costo_total)}</span>
                  <button
                    type="button"
                    title="Editar compra"
                    disabled={guardando}
                    onClick={() => handleIniciarEdicion(compra)}
                    className="rounded-lg border border-accent/60 p-1.5 text-accent transition hover:bg-accent/10 disabled:opacity-60"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    title="Eliminar compra"
                    disabled={guardando}
                    onClick={() => handleEliminar(compra.id)}
                    className="rounded-lg border border-danger/40 p-1.5 text-danger transition hover:bg-danger/10 disabled:opacity-60"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
}
