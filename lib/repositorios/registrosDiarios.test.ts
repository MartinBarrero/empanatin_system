import { describe, expect, test } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Configuracion } from "../calculos";
import {
  guardarRegistroDiario,
  obtenerConfiguracionVigente,
  obtenerRegistroPorFecha,
  type RegistroDiarioInput,
} from "./registrosDiarios";

interface FakeResult<T> {
  data: T | null;
  error: { message: string } | null;
}

function createFakeClient(options: {
  configuracion?: FakeResult<Configuracion>;
  registroPorFecha?: FakeResult<unknown>;
  upsertResult?: FakeResult<unknown>;
}) {
  const fromCalls: string[] = [];
  let upsertPayload: unknown = null;
  let upsertOptions: unknown = null;

  const client = {
    from(table: string) {
      fromCalls.push(table);

      if (table === "configuracion") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => options.configuracion,
            }),
          }),
        };
      }

      if (table === "registros_diarios") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => options.registroPorFecha,
            }),
          }),
          upsert: (payload: unknown, upsertOpts: unknown) => {
            upsertPayload = payload;
            upsertOptions = upsertOpts;
            return {
              select: () => ({
                single: async () => options.upsertResult,
              }),
            };
          },
        };
      }

      throw new Error(`Tabla inesperada en el fake client: ${table}`);
    },
  };

  return {
    client: client as unknown as SupabaseClient,
    fromCalls,
    getUpsertPayload: () => upsertPayload,
    getUpsertOptions: () => upsertOptions,
  };
}

const configPorDefecto: Configuracion = {
  id: 1,
  costo_paquete_carne: 26000,
  costo_paquete_pollo: 28000,
  unidades_por_paquete: 25,
  precio_venta_carne: 2200,
  precio_venta_pollo: 2200,
  promo_2x_carne: 4000,
  costo_paquete_salsa: 4000,
  gasto_operativo_diario: 5000,
};

const inputValido: RegistroDiarioInput = {
  fecha: "2026-07-30",
  carne_llevada: 30,
  pollo_llevada: 20,
  regalos_carne: 5,
  monto_billetera: 30000,
  monto_monedas: 20000,
  monto_nu: 20000,
  notas: null,
};

describe("obtenerConfiguracionVigente", () => {
  test("retorna la fila de configuración vigente", async () => {
    const { client } = createFakeClient({
      configuracion: { data: configPorDefecto, error: null },
    });

    const config = await obtenerConfiguracionVigente(client);

    expect(config).toEqual(configPorDefecto);
  });
});

describe("obtenerRegistroPorFecha", () => {
  test("retorna null si no hay registro guardado para esa fecha", async () => {
    const { client } = createFakeClient({
      registroPorFecha: { data: null, error: null },
    });

    const registro = await obtenerRegistroPorFecha(client, "2026-07-30");

    expect(registro).toBeNull();
  });

  test("retorna el registro existente si la fecha ya está guardada", async () => {
    const registroExistente = {
      id: "uuid-1",
      ...inputValido,
      ingreso_total: 70000,
      costo_recuperado: 53600,
      gasto_operativo: 5000,
      utilidad: 11400,
      created_at: "2026-07-30T00:00:00.000Z",
    };
    const { client } = createFakeClient({
      registroPorFecha: { data: registroExistente, error: null },
    });

    const registro = await obtenerRegistroPorFecha(client, "2026-07-30");

    expect(registro).toEqual(registroExistente);
  });
});

describe("guardarRegistroDiario", () => {
  test("calcula ingreso_total como la suma de los tres bolsillos y lo guarda junto con costo_recuperado/utilidad", async () => {
    const registroGuardado = {
      id: "uuid-1",
      ...inputValido,
      ingreso_total: 70000,
      costo_recuperado: 53600,
      gasto_operativo: 5000,
      utilidad: 11400,
      created_at: "2026-07-30T00:00:00.000Z",
    };
    const { client, getUpsertPayload } = createFakeClient({
      configuracion: { data: configPorDefecto, error: null },
      upsertResult: { data: registroGuardado, error: null },
    });

    const resultado = await guardarRegistroDiario(client, inputValido);

    expect(resultado).toEqual(registroGuardado);
    expect(getUpsertPayload()).toMatchObject({
      fecha: "2026-07-30",
      ingreso_total: 70000,
      costo_recuperado: 53600,
      gasto_operativo: 5000,
      utilidad: 11400,
    });
  });

  test("usa upsert por fecha para actualizar en vez de fallar si el día ya existe", async () => {
    const registroGuardado = {
      id: "uuid-1",
      ...inputValido,
      ingreso_total: 70000,
      costo_recuperado: 53600,
      gasto_operativo: 5000,
      utilidad: 11400,
      created_at: "2026-07-30T00:00:00.000Z",
    };
    const { client, getUpsertOptions } = createFakeClient({
      configuracion: { data: configPorDefecto, error: null },
      upsertResult: { data: registroGuardado, error: null },
    });

    await guardarRegistroDiario(client, inputValido);

    expect(getUpsertOptions()).toMatchObject({ onConflict: "fecha" });
  });
});
