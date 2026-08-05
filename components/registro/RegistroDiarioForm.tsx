"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  calcularCostoRecuperado,
  calcularIngresoTotal,
  calcularUtilidad,
  type Configuracion,
} from "@/lib/calculos";
import type { RegistroDiario } from "@/lib/repositorios/registrosDiarios";
import { buscarRegistroPorFechaAction, guardarRegistroDiarioAction } from "@/app/actions/registroDiario";

interface Props {
  config: Configuracion;
  fechaInicial: string;
  registroInicial: RegistroDiario | null;
}

interface FormState {
  fecha: string;
  carneLlevada: string;
  polloLlevada: string;
  regalosCarne: string;
  montoBilletera: string;
  montoMonedas: string;
  montoNu: string;
  notas: string;
}

const formVacio = (fecha: string): FormState => ({
  fecha,
  carneLlevada: "",
  polloLlevada: "",
  regalosCarne: "",
  montoBilletera: "",
  montoMonedas: "",
  montoNu: "",
  notas: "",
});

function registroAFormState(fecha: string, registro: RegistroDiario | null): FormState {
  if (!registro) return formVacio(fecha);
  return {
    fecha,
    carneLlevada: String(registro.carne_llevada),
    polloLlevada: String(registro.pollo_llevada),
    regalosCarne: String(registro.regalos_carne),
    montoBilletera: String(registro.monto_billetera),
    montoMonedas: String(registro.monto_monedas),
    montoNu: String(registro.monto_nu),
    notas: registro.notas ?? "",
  };
}

function numero(valor: string): number {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function formatoPesos(valor: number): string {
  return `$${Math.round(valor).toLocaleString("es-CO")}`;
}

export function RegistroDiarioForm({ config, fechaInicial, registroInicial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() =>
    registroAFormState(fechaInicial, registroInicial)
  );
  const [existeRegistro, setExisteRegistro] = useState(registroInicial !== null);
  const [buscandoFecha, setBuscandoFecha] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(
    null
  );
  const [guardando, startTransition] = useTransition();

  const carneLlevada = numero(form.carneLlevada);
  const polloLlevada = numero(form.polloLlevada);
  const montoBilletera = numero(form.montoBilletera);
  const montoMonedas = numero(form.montoMonedas);
  const montoNu = numero(form.montoNu);

  const ingresoTotal = calcularIngresoTotal(montoBilletera, montoMonedas, montoNu);
  const costoRecuperado = calcularCostoRecuperado(carneLlevada, polloLlevada, config);
  const gastoOperativo = config.gasto_operativo_diario;
  const utilidad = calcularUtilidad(ingresoTotal, costoRecuperado, gastoOperativo);

  function actualizarCampo<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  async function handleFechaChange(fecha: string) {
    actualizarCampo("fecha", fecha);
    setMensaje(null);
    setBuscandoFecha(true);
    try {
      const registro = await buscarRegistroPorFechaAction(fecha);
      setForm(registroAFormState(fecha, registro));
      setExisteRegistro(registro !== null);
    } finally {
      setBuscandoFecha(false);
    }
  }

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensaje(null);

    startTransition(async () => {
      const resultado = await guardarRegistroDiarioAction({
        fecha: form.fecha,
        carne_llevada: carneLlevada,
        pollo_llevada: polloLlevada,
        regalos_carne: numero(form.regalosCarne),
        monto_billetera: montoBilletera,
        monto_monedas: montoMonedas,
        monto_nu: montoNu,
        notas: form.notas.trim() === "" ? null : form.notas,
      });

      if (!resultado.ok) {
        setMensaje({ tipo: "error", texto: resultado.error });
        return;
      }

      setExisteRegistro(true);
      setMensaje({
        tipo: "ok",
        texto: `Guardado — ingreso total ${formatoPesos(
          resultado.registro.ingreso_total
        )} · costo recuperado ${formatoPesos(
          resultado.registro.costo_recuperado
        )} · gasto operativo ${formatoPesos(
          resultado.registro.gasto_operativo
        )} · utilidad ${formatoPesos(resultado.registro.utilidad)}`,
      });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-muted">
          Fecha
          <input
            type="date"
            required
            value={form.fecha}
            onChange={(e) => handleFechaChange(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground transition focus:border-accent"
          />
        </label>

        <div className="flex items-end text-sm text-muted">
          {buscandoFecha
            ? "Buscando registro para esa fecha…"
            : existeRegistro
              ? "Editando el registro ya guardado de este día."
              : "No hay registro guardado para este día todavía."}
        </div>

        <label className="flex flex-col gap-1 text-sm text-muted">
          Carne llevada (unidades)
          <input
            type="number"
            min="0"
            required
            value={form.carneLlevada}
            onChange={(e) => actualizarCampo("carneLlevada", e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground transition focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-muted">
          Pollo llevado (unidades)
          <input
            type="number"
            min="0"
            required
            value={form.polloLlevada}
            onChange={(e) => actualizarCampo("polloLlevada", e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground transition focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-muted">
          Regalos de carne (informativo)
          <input
            type="number"
            min="0"
            value={form.regalosCarne}
            onChange={(e) => actualizarCampo("regalosCarne", e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground transition focus:border-accent"
          />
        </label>
      </div>

      <fieldset className="flex flex-col gap-4 rounded-2xl border border-border p-5">
        <legend className="px-1 text-sm text-muted">
          Distribución del ingreso por bolsillo
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm text-muted">
            Billetera
            <input
              type="number"
              min="0"
              value={form.montoBilletera}
              onChange={(e) => actualizarCampo("montoBilletera", e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground transition focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted">
            Monedas
            <input
              type="number"
              min="0"
              value={form.montoMonedas}
              onChange={(e) => actualizarCampo("montoMonedas", e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground transition focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted">
            Nu
            <input
              type="number"
              min="0"
              value={form.montoNu}
              onChange={(e) => actualizarCampo("montoNu", e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground transition focus:border-accent"
            />
          </label>
        </div>
        <p className="text-sm text-muted">
          Ingreso total (calculado): <span className="font-semibold text-foreground">{formatoPesos(ingresoTotal)}</span>
        </p>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Notas (opcional)
        <textarea
          value={form.notas}
          onChange={(e) => actualizarCampo("notas", e.target.value)}
          rows={2}
          className="rounded-md border border-border bg-surface px-3 py-2 text-foreground"
        />
      </label>

      <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-lg shadow-black/20">
        <h3 className="mb-3 text-sm font-medium text-muted">Vista previa del día</h3>
        <dl className="grid grid-cols-3 gap-4 text-center">
          <div>
            <dt className="text-xs text-muted">Costo recuperado</dt>
            <dd className="text-lg font-semibold text-foreground">
              {formatoPesos(costoRecuperado)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Gasto operativo</dt>
            <dd className="text-lg font-semibold text-foreground">
              {formatoPesos(gastoOperativo)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Utilidad</dt>
            <dd
              className={`text-lg font-semibold ${
                utilidad >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {formatoPesos(utilidad)}
            </dd>
          </div>
        </dl>
      </div>

      {mensaje && (
        <p className={mensaje.tipo === "ok" ? "text-sm text-success" : "text-sm text-danger"}>
          {mensaje.texto}
        </p>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="rounded-xl bg-accent px-5 py-2.5 font-semibold text-background shadow-glow-sm transition hover:opacity-90 disabled:opacity-60"
      >
        {guardando ? "Guardando…" : existeRegistro ? "Actualizar registro" : "Guardar registro"}
      </button>
    </form>
  );
}
