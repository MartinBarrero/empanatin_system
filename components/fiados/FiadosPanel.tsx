"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Fiado } from "@/lib/repositorios/fiados";
import { crearFiadoAction, registrarAbonoAction } from "@/app/actions/fiados";

interface Props {
  fiadosIniciales: Fiado[];
}

function formatoPesos(valor: number): string {
  return `$${Math.round(valor).toLocaleString("es-CO")}`;
}

export function FiadosPanel({ fiadosIniciales }: Props) {
  const router = useRouter();
  const [fiados, setFiados] = useState(fiadosIniciales);
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [monto, setMonto] = useState("");
  const [montosAbono, setMontosAbono] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [guardando, startTransition] = useTransition();

  function handleCrear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensaje(null);
    startTransition(async () => {
      const resultado = await crearFiadoAction({
        fecha_creacion: new Date().toISOString().slice(0, 10),
        nombre_persona: nombre,
        cantidad_empanadas: cantidad.trim() === "" ? null : Number(cantidad),
        monto: Number(monto),
      });

      if (!resultado.ok) {
        setMensaje({ tipo: "error", texto: resultado.error });
        return;
      }

      setFiados((actual) => [resultado.fiado, ...actual]);
      setNombre("");
      setCantidad("");
      setMonto("");
      router.refresh();
    });
  }

  function handleAbono(id: string) {
    const valor = Number(montosAbono[id] ?? "0");
    if (!valor || valor <= 0) return;

    setMensaje(null);
    startTransition(async () => {
      const resultado = await registrarAbonoAction(id, valor);

      if (!resultado.ok) {
        setMensaje({ tipo: "error", texto: resultado.error });
        return;
      }

      setFiados((actual) => actual.map((f) => (f.id === id ? resultado.fiado : f)));
      setMontosAbono((actual) => ({ ...actual, [id]: "" }));
      router.refresh();
    });
  }

  const pendientes = fiados.filter((f) => f.estado === "pendiente");
  const pagados = fiados.filter((f) => f.estado === "pagado");

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleCrear} className="grid gap-4 rounded-md border border-border bg-surface p-4 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm text-muted">
          Nombre
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Empanadas (opcional)
          <input
            type="number"
            min="0"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Monto
          <input
            type="number"
            min="0"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-foreground"
          />
        </label>
        <button
          type="submit"
          disabled={guardando}
          className="self-end rounded-md bg-accent px-4 py-2 font-medium text-background disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Registrar fiado"}
        </button>
      </form>

      {mensaje && (
        <p className={mensaje.tipo === "ok" ? "text-sm text-success" : "text-sm text-danger"}>
          {mensaje.texto}
        </p>
      )}

      <div>
        <h3 className="mb-3 text-sm font-medium text-muted">Pendientes</h3>
        <ul className="flex flex-col gap-3">
          {pendientes.length === 0 && <li className="text-sm text-muted">No hay deudas pendientes.</li>}
          {pendientes.map((fiado) => (
            <li
              key={fiado.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface p-4"
            >
              <div>
                <p className="font-medium text-foreground">{fiado.nombre_persona}</p>
                <p className="text-sm text-muted">
                  {formatoPesos(fiado.monto_abonado)} de {formatoPesos(fiado.monto)} abonado
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Abono"
                  value={montosAbono[fiado.id] ?? ""}
                  onChange={(e) =>
                    setMontosAbono((actual) => ({ ...actual, [fiado.id]: e.target.value }))
                  }
                  className="w-28 rounded-md border border-border bg-background px-3 py-2 text-foreground"
                />
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => handleAbono(fiado.id)}
                  className="rounded-md border border-accent px-3 py-2 text-sm text-accent disabled:opacity-60"
                >
                  Abonar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-muted">Pagados</h3>
        <ul className="flex flex-col gap-3">
          {pagados.length === 0 && <li className="text-sm text-muted">Aún no hay fiados pagados.</li>}
          {pagados.map((fiado) => (
            <li
              key={fiado.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface p-4"
            >
              <p className="font-medium text-foreground">{fiado.nombre_persona}</p>
              <p className="text-sm text-success">
                {formatoPesos(fiado.monto)} pagado el {fiado.fecha_pago}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
