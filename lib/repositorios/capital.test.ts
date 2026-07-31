import { describe, expect, test } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { obtenerCapitalReinversion } from "./capital";

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

describe("obtenerCapitalReinversion", () => {
  test("resta el total gastado en compras del total de costo recuperado", async () => {
    const { client } = createFakeClient({
      registros: {
        data: [{ costo_recuperado: 53600 }, { costo_recuperado: 40000 }],
        error: null,
      },
      compras: { data: [{ costo_total: 26000 }], error: null },
    });

    const capital = await obtenerCapitalReinversion(client);

    expect(capital).toBe(53600 + 40000 - 26000);
  });

  test("sin compras retorna la suma completa de costo_recuperado", async () => {
    const { client } = createFakeClient({
      registros: { data: [{ costo_recuperado: 53600 }], error: null },
      compras: { data: [], error: null },
    });

    const capital = await obtenerCapitalReinversion(client);

    expect(capital).toBe(53600);
  });

  test("sin registros ni compras retorna cero", async () => {
    const { client } = createFakeClient({
      registros: { data: [], error: null },
      compras: { data: [], error: null },
    });

    const capital = await obtenerCapitalReinversion(client);

    expect(capital).toBe(0);
  });
});
