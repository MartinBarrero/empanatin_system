import { describe, expect, test } from "vitest";
import type { RegistroDiario } from "./repositorios/registrosDiarios";
import {
  calcularComparacionCarnePollo,
  calcularTotalesPorPeriodo,
  calcularUtilidadAcumulada,
} from "./dashboard";

function registro(parcial: Partial<RegistroDiario> & { fecha: string }): RegistroDiario {
  return {
    id: `id-${parcial.fecha}`,
    carne_llevada: 0,
    pollo_llevada: 0,
    regalos_carne: 0,
    monto_billetera: 0,
    monto_monedas: 0,
    monto_nu: 0,
    ingreso_total: 0,
    costo_recuperado: 0,
    gasto_operativo: 5000,
    utilidad: 0,
    notas: null,
    created_at: `${parcial.fecha}T00:00:00.000Z`,
    ...parcial,
  };
}

describe("calcularTotalesPorPeriodo", () => {
  // Referencia: martes 2026-07-28 (semana lunes 2026-07-27 a domingo 2026-08-02)
  const registros = [
    registro({ fecha: "2026-06-20", ingreso_total: 10000, utilidad: 1000 }), // mes anterior, fuera de semana
    registro({ fecha: "2026-07-27", ingreso_total: 20000, utilidad: 2000 }), // dentro de la semana, mismo mes
    registro({ fecha: "2026-07-28", ingreso_total: 30000, utilidad: 3000 }), // el día de referencia
    registro({ fecha: "2026-08-02", ingreso_total: 40000, utilidad: 4000 }), // dentro de semana, mes distinto
  ];

  test("diario solo cuenta la fecha exacta", () => {
    const totales = calcularTotalesPorPeriodo(registros, "2026-07-28");
    expect(totales.diario).toEqual({ ventas: 30000, utilidad: 3000 });
  });

  test("semanal cuenta desde el lunes de esa semana hasta la fecha de referencia", () => {
    const totales = calcularTotalesPorPeriodo(registros, "2026-07-28");
    expect(totales.semanal).toEqual({ ventas: 20000 + 30000, utilidad: 2000 + 3000 });
  });

  test("mensual cuenta todo el mes calendario de la fecha de referencia", () => {
    const totales = calcularTotalesPorPeriodo(registros, "2026-07-28");
    expect(totales.mensual).toEqual({ ventas: 20000 + 30000, utilidad: 2000 + 3000 });
  });
});

describe("calcularComparacionCarnePollo", () => {
  test("suma carne_llevada y pollo_llevada de todos los registros", () => {
    const registros = [
      registro({ fecha: "2026-07-27", carne_llevada: 30, pollo_llevada: 20 }),
      registro({ fecha: "2026-07-28", carne_llevada: 10, pollo_llevada: 5 }),
    ];

    expect(calcularComparacionCarnePollo(registros)).toEqual({ carne: 40, pollo: 25 });
  });

  test("lista vacía retorna ceros", () => {
    expect(calcularComparacionCarnePollo([])).toEqual({ carne: 0, pollo: 0 });
  });
});

describe("calcularUtilidadAcumulada", () => {
  test("retorna la serie ordenada por fecha con el acumulado corriendo", () => {
    const registros = [
      registro({ fecha: "2026-07-28", utilidad: 3000 }),
      registro({ fecha: "2026-07-27", utilidad: 2000 }),
    ];

    const serie = calcularUtilidadAcumulada(registros);

    expect(serie).toEqual([
      { fecha: "2026-07-27", acumulado: 2000 },
      { fecha: "2026-07-28", acumulado: 5000 },
    ]);
  });

  test("lista vacía retorna serie vacía", () => {
    expect(calcularUtilidadAcumulada([])).toEqual([]);
  });
});
