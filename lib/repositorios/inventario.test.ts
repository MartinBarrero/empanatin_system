import { describe, expect, test } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Configuracion } from "../calculos";
import { obtenerStockActual } from "./inventario";

interface FakeResult<T> {
  data: T | null;
  error: { message: string } | null;
}

function createFakeClient(options: {
  configuracion: FakeResult<Configuracion>;
  compras: FakeResult<unknown>;
  registros: FakeResult<unknown>;
}) {
  const client = {
    from(table: string) {
      if (table === "configuracion") {
        return { select: () => ({ eq: () => ({ single: async () => options.configuracion }) }) };
      }
      if (table === "compras_mercancia") {
        return { select: async () => options.compras };
      }
      if (table === "registros_diarios") {
        return { select: async () => options.registros };
      }
      throw new Error(`Tabla inesperada: ${table}`);
    },
  };
  return { client: client as unknown as SupabaseClient };
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

describe("obtenerStockActual", () => {
  test("resta lo llevado de lo comprado, por tipo, ignorando salsa", async () => {
    const { client } = createFakeClient({
      configuracion: { data: configPorDefecto, error: null },
      compras: {
        data: [
          { tipo: "carne", cantidad_paquetes: 3 },
          { tipo: "pollo", cantidad_paquetes: 2 },
          { tipo: "salsa", cantidad_paquetes: 5 },
        ],
        error: null,
      },
      registros: {
        data: [
          { carne_llevada: 30, pollo_llevada: 20 },
          { carne_llevada: 20, pollo_llevada: 10 },
        ],
        error: null,
      },
    });

    const stock = await obtenerStockActual(client);

    // carne: 3*25=75 comprado - (30+20)=50 llevado = 25
    // pollo: 2*25=50 comprado - (20+10)=30 llevado = 20
    expect(stock).toEqual({ carne: 25, pollo: 20 });
  });

  test("retorna stock negativo si se llevó más de lo comprado", async () => {
    const { client } = createFakeClient({
      configuracion: { data: configPorDefecto, error: null },
      compras: { data: [{ tipo: "carne", cantidad_paquetes: 1 }], error: null },
      registros: { data: [{ carne_llevada: 30, pollo_llevada: 0 }], error: null },
    });

    const stock = await obtenerStockActual(client);

    // carne: 1*25=25 comprado - 30 llevado = -5
    expect(stock.carne).toBe(-5);
  });

  test("sin compras ni registros retorna stock en cero", async () => {
    const { client } = createFakeClient({
      configuracion: { data: configPorDefecto, error: null },
      compras: { data: [], error: null },
      registros: { data: [], error: null },
    });

    const stock = await obtenerStockActual(client);

    expect(stock).toEqual({ carne: 0, pollo: 0 });
  });
});
