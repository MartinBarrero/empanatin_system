import { describe, expect, test } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Configuracion } from "../calculos";
import { actualizarCompra, crearCompra, eliminarCompra, listarCompras } from "./comprasMercancia";

interface FakeResult<T> {
  data: T | null;
  error: { message: string } | null;
}

function createFakeClient(options: {
  configuracion?: FakeResult<Configuracion>;
  insertResult?: FakeResult<unknown>;
  listResult?: FakeResult<unknown>;
  updateResult?: FakeResult<unknown>;
  deleteResult?: { error: { message: string } | null };
}) {
  let insertPayload: unknown = null;
  let updatePayload: unknown = null;
  let idEliminado: string | null = null;

  const client = {
    from(table: string) {
      if (table === "configuracion") {
        return {
          select: () => ({ eq: () => ({ single: async () => options.configuracion }) }),
        };
      }
      if (table === "compras_mercancia") {
        return {
          insert: (payload: unknown) => {
            insertPayload = payload;
            return { select: () => ({ single: async () => options.insertResult }) };
          },
          select: () => ({
            order: () => options.listResult,
          }),
          update: (payload: unknown) => {
            updatePayload = payload;
            return {
              eq: () => ({
                select: () => ({ single: async () => options.updateResult }),
              }),
            };
          },
          delete: () => ({
            eq: async (_col: string, val: string) => {
              idEliminado = val;
              return options.deleteResult ?? { error: null };
            },
          }),
        };
      }
      throw new Error(`Tabla inesperada: ${table}`);
    },
  };

  return {
    client: client as unknown as SupabaseClient,
    getInsertPayload: () => insertPayload,
    getUpdatePayload: () => updatePayload,
    getIdEliminado: () => idEliminado,
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

describe("crearCompra", () => {
  test("usa el costo_total explícito sin consultar configuración", async () => {
    const compraCreada = {
      id: "compra-1",
      fecha: "2026-07-30",
      tipo: "carne",
      cantidad_paquetes: 2,
      costo_total: 50000,
      bolsillo_origen: null,
    };
    const { client, getInsertPayload } = createFakeClient({
      insertResult: { data: compraCreada, error: null },
    });

    const resultado = await crearCompra(client, {
      fecha: "2026-07-30",
      tipo: "carne",
      cantidad_paquetes: 2,
      costo_total: 50000,
    });

    expect(resultado).toEqual(compraCreada);
    expect(getInsertPayload()).toMatchObject({ costo_total: 50000 });
  });

  test("autocalcula el costo_total de carne con la configuración vigente cuando no se pasa", async () => {
    const compraCreada = {
      id: "compra-1",
      fecha: "2026-07-30",
      tipo: "carne",
      cantidad_paquetes: 2,
      costo_total: 52000,
      bolsillo_origen: null,
    };
    const { client, getInsertPayload } = createFakeClient({
      configuracion: { data: configPorDefecto, error: null },
      insertResult: { data: compraCreada, error: null },
    });

    const resultado = await crearCompra(client, {
      fecha: "2026-07-30",
      tipo: "carne",
      cantidad_paquetes: 2,
    });

    expect(resultado).toEqual(compraCreada);
    expect(getInsertPayload()).toMatchObject({ costo_total: 52000 });
  });

  test("autocalcula el costo_total de pollo", async () => {
    const compraCreada = {
      id: "compra-1",
      fecha: "2026-07-30",
      tipo: "pollo",
      cantidad_paquetes: 2,
      costo_total: 56000,
      bolsillo_origen: null,
    };
    const { client, getInsertPayload } = createFakeClient({
      configuracion: { data: configPorDefecto, error: null },
      insertResult: { data: compraCreada, error: null },
    });

    await crearCompra(client, { fecha: "2026-07-30", tipo: "pollo", cantidad_paquetes: 2 });

    expect(getInsertPayload()).toMatchObject({ costo_total: 56000 });
  });

  test("autocalcula el costo_total de salsa", async () => {
    const compraCreada = {
      id: "compra-1",
      fecha: "2026-07-30",
      tipo: "salsa",
      cantidad_paquetes: 3,
      costo_total: 12000,
      bolsillo_origen: null,
    };
    const { client, getInsertPayload } = createFakeClient({
      configuracion: { data: configPorDefecto, error: null },
      insertResult: { data: compraCreada, error: null },
    });

    await crearCompra(client, { fecha: "2026-07-30", tipo: "salsa", cantidad_paquetes: 3 });

    expect(getInsertPayload()).toMatchObject({ costo_total: 12000 });
  });
});

describe("listarCompras", () => {
  test("retorna la lista ordenada por fecha descendente", async () => {
    const lista = [{ id: "compra-2" }, { id: "compra-1" }];
    const { client } = createFakeClient({ listResult: { data: lista, error: null } });

    const resultado = await listarCompras(client);

    expect(resultado).toEqual(lista);
  });
});

describe("actualizarCompra", () => {
  test("usa el costo_total explícito sin consultar configuración", async () => {
    const compraActualizada = {
      id: "compra-1",
      fecha: "2026-07-30",
      tipo: "carne",
      cantidad_paquetes: 3,
      costo_total: 70000,
      bolsillo_origen: null,
    };
    const { client, getUpdatePayload } = createFakeClient({
      updateResult: { data: compraActualizada, error: null },
    });

    const resultado = await actualizarCompra(client, "compra-1", {
      fecha: "2026-07-30",
      tipo: "carne",
      cantidad_paquetes: 3,
      costo_total: 70000,
    });

    expect(resultado).toEqual(compraActualizada);
    expect(getUpdatePayload()).toMatchObject({ cantidad_paquetes: 3, costo_total: 70000 });
  });

  test("autocalcula el costo_total con la configuración vigente cuando no se pasa", async () => {
    const compraActualizada = {
      id: "compra-1",
      fecha: "2026-07-30",
      tipo: "pollo",
      cantidad_paquetes: 2,
      costo_total: 56000,
      bolsillo_origen: null,
    };
    const { client, getUpdatePayload } = createFakeClient({
      configuracion: { data: configPorDefecto, error: null },
      updateResult: { data: compraActualizada, error: null },
    });

    await actualizarCompra(client, "compra-1", {
      fecha: "2026-07-30",
      tipo: "pollo",
      cantidad_paquetes: 2,
    });

    expect(getUpdatePayload()).toMatchObject({ costo_total: 56000 });
  });
});

describe("eliminarCompra", () => {
  test("borra la compra con el id indicado", async () => {
    const { client, getIdEliminado } = createFakeClient({});

    await eliminarCompra(client, "compra-1");

    expect(getIdEliminado()).toBe("compra-1");
  });
});
