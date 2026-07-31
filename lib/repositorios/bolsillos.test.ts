import { describe, expect, test } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { obtenerSaldosBolsillos } from "./bolsillos";

interface FakeResult<T> {
  data: T | null;
  error: { message: string } | null;
}

function createFakeClient(options: {
  registros: FakeResult<unknown>;
  compras: FakeResult<unknown>;
}) {
  const client = {
    from(table: string) {
      if (table === "registros_diarios") return { select: async () => options.registros };
      if (table === "compras_mercancia") return { select: async () => options.compras };
      throw new Error(`Tabla inesperada: ${table}`);
    },
  };
  return { client: client as unknown as SupabaseClient };
}

describe("obtenerSaldosBolsillos", () => {
  test("suma los montos por bolsillo y resta las compras hechas desde cada uno", async () => {
    const { client } = createFakeClient({
      registros: {
        data: [
          { monto_billetera: 30000, monto_monedas: 20000, monto_nu: 20000 },
          { monto_billetera: 10000, monto_monedas: 5000, monto_nu: 5000 },
        ],
        error: null,
      },
      compras: {
        data: [
          { bolsillo_origen: "billetera", costo_total: 10000 },
          { bolsillo_origen: "nu", costo_total: 5000 },
          { bolsillo_origen: null, costo_total: 2000 },
        ],
        error: null,
      },
    });

    const saldos = await obtenerSaldosBolsillos(client);

    expect(saldos).toEqual({
      billetera: 30000 + 10000 - 10000,
      monedas: 20000 + 5000,
      nu: 20000 + 5000 - 5000,
    });
  });

  test("sin registros ni compras retorna todo en cero", async () => {
    const { client } = createFakeClient({
      registros: { data: [], error: null },
      compras: { data: [], error: null },
    });

    const saldos = await obtenerSaldosBolsillos(client);

    expect(saldos).toEqual({ billetera: 0, monedas: 0, nu: 0 });
  });
});
