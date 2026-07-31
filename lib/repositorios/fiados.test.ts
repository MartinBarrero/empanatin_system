import { describe, expect, test } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  crearFiado,
  FiadoNoEncontradoError,
  listarFiados,
  registrarAbono,
  type FiadoInput,
} from "./fiados";

interface FakeResult<T> {
  data: T | null;
  error: { message: string } | null;
}

function createFakeClient(options: {
  insertResult?: FakeResult<unknown>;
  listResult?: FakeResult<unknown>;
  fiadoPorId?: FakeResult<unknown>;
  updateResult?: FakeResult<unknown>;
}) {
  let insertPayload: unknown = null;
  let updatePayload: unknown = null;
  let estadoFiltrado: string | null = null;

  const client = {
    from(table: string) {
      if (table !== "fiados") throw new Error(`Tabla inesperada: ${table}`);
      return {
        insert: (payload: unknown) => {
          insertPayload = payload;
          return { select: () => ({ single: async () => options.insertResult }) };
        },
        select: () => ({
          order: () => ({
            ...options.listResult,
            eq: (_col: string, val: string) => {
              estadoFiltrado = val;
              return options.listResult;
            },
          }),
          eq: () => ({
            maybeSingle: async () => options.fiadoPorId,
          }),
        }),
        update: (payload: unknown) => {
          updatePayload = payload;
          return {
            eq: () => ({
              select: () => ({ single: async () => options.updateResult }),
            }),
          };
        },
      };
    },
  };

  return {
    client: client as unknown as SupabaseClient,
    getInsertPayload: () => insertPayload,
    getUpdatePayload: () => updatePayload,
    getEstadoFiltrado: () => estadoFiltrado,
  };
}

const fiadoInputValido: FiadoInput = {
  fecha_creacion: "2026-07-30",
  nombre_persona: "Andrea",
  cantidad_empanadas: 5,
  monto: 20000,
};

describe("crearFiado", () => {
  test("inserta con monto_abonado 0, estado pendiente y fecha_pago null", async () => {
    const fiadoCreado = {
      id: "fiado-1",
      ...fiadoInputValido,
      monto_abonado: 0,
      estado: "pendiente",
      fecha_pago: null,
      registro_diario_id: null,
    };
    const { client, getInsertPayload } = createFakeClient({
      insertResult: { data: fiadoCreado, error: null },
    });

    const resultado = await crearFiado(client, fiadoInputValido);

    expect(resultado).toEqual(fiadoCreado);
    expect(getInsertPayload()).toMatchObject({
      nombre_persona: "Andrea",
      monto: 20000,
      monto_abonado: 0,
      estado: "pendiente",
      fecha_pago: null,
    });
  });
});

describe("listarFiados", () => {
  test("sin filtro retorna todos ordenados por fecha_creacion descendente", async () => {
    const lista = [{ id: "fiado-1" }, { id: "fiado-2" }];
    const { client } = createFakeClient({ listResult: { data: lista, error: null } });

    const resultado = await listarFiados(client);

    expect(resultado).toEqual(lista);
  });

  test("con estado filtra por ese estado", async () => {
    const pendientes = [{ id: "fiado-1", estado: "pendiente" }];
    const { client, getEstadoFiltrado } = createFakeClient({
      listResult: { data: pendientes, error: null },
    });

    const resultado = await listarFiados(client, "pendiente");

    expect(resultado).toEqual(pendientes);
    expect(getEstadoFiltrado()).toBe("pendiente");
  });
});

describe("registrarAbono", () => {
  test("abono parcial deja el fiado pendiente con el monto_abonado incrementado", async () => {
    const fiadoActual = {
      id: "fiado-1",
      ...fiadoInputValido,
      monto_abonado: 5000,
      estado: "pendiente",
      fecha_pago: null,
      registro_diario_id: null,
    };
    const fiadoActualizado = { ...fiadoActual, monto_abonado: 10000 };
    const { client, getUpdatePayload } = createFakeClient({
      fiadoPorId: { data: fiadoActual, error: null },
      updateResult: { data: fiadoActualizado, error: null },
    });

    const resultado = await registrarAbono(client, "fiado-1", 5000, "2026-07-30");

    expect(resultado).toEqual(fiadoActualizado);
    expect(getUpdatePayload()).toMatchObject({
      monto_abonado: 10000,
      estado: "pendiente",
      fecha_pago: null,
    });
  });

  test("abono que completa el monto marca el fiado como pagado con fecha_pago", async () => {
    const fiadoActual = {
      id: "fiado-1",
      ...fiadoInputValido,
      monto_abonado: 5000,
      estado: "pendiente",
      fecha_pago: null,
      registro_diario_id: null,
    };
    const fiadoActualizado = {
      ...fiadoActual,
      monto_abonado: 20000,
      estado: "pagado",
      fecha_pago: "2026-07-30",
    };
    const { client, getUpdatePayload } = createFakeClient({
      fiadoPorId: { data: fiadoActual, error: null },
      updateResult: { data: fiadoActualizado, error: null },
    });

    const resultado = await registrarAbono(client, "fiado-1", 15000, "2026-07-30");

    expect(resultado).toEqual(fiadoActualizado);
    expect(getUpdatePayload()).toMatchObject({
      monto_abonado: 20000,
      estado: "pagado",
      fecha_pago: "2026-07-30",
    });
  });

  test("lanza FiadoNoEncontradoError si el id no existe", async () => {
    const { client } = createFakeClient({ fiadoPorId: { data: null, error: null } });

    await expect(registrarAbono(client, "no-existe", 1000, "2026-07-30")).rejects.toThrow(
      FiadoNoEncontradoError
    );
  });
});
