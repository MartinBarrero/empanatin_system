import { describe, expect, test } from "vitest";
import {
  calcularCostoRecuperado,
  calcularCostoUnitario,
  calcularIngresoTotal,
  calcularUtilidad,
  type Configuracion,
} from "./calculos";

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

describe("calcularCostoUnitario", () => {
  test("costo unitario de carne con la configuración por defecto", () => {
    expect(calcularCostoUnitario(26000, 25)).toBe(1040);
  });

  test("costo unitario de pollo con la configuración por defecto", () => {
    expect(calcularCostoUnitario(28000, 25)).toBe(1120);
  });
});

describe("calcularCostoRecuperado", () => {
  test("día normal con carne y pollo llevados", () => {
    // 30 carne * 1040 + 20 pollo * 1120 = 31200 + 22400 = 53600
    const resultado = calcularCostoRecuperado(30, 20, configPorDefecto);
    expect(resultado).toBe(53600);
  });

  test("día sin ventas de pollo (solo carne)", () => {
    const resultado = calcularCostoRecuperado(30, 0, configPorDefecto);
    expect(resultado).toBe(31200);
  });

  test("día sin ventas de carne (solo pollo)", () => {
    const resultado = calcularCostoRecuperado(0, 20, configPorDefecto);
    expect(resultado).toBe(22400);
  });

  test("los regalos de carne no se restan del costo recuperado (van incluidos en carne_llevada)", () => {
    // carne_llevada ya incluye las regaladas, así que el resultado no cambia
    // por saber cuántas fueron regalo (sección 3.2 del CLAUDE.md).
    const conRegalos = calcularCostoRecuperado(30, 20, configPorDefecto);
    const sinRegalos = calcularCostoRecuperado(30, 20, configPorDefecto);
    expect(conRegalos).toBe(sinRegalos);
  });
});

describe("calcularUtilidad", () => {
  test("día normal donde el ingreso cubre costo y gasto operativo", () => {
    // 70000 - 53600 - 5000 = 11400
    expect(calcularUtilidad(70000, 53600, 5000)).toBe(11400);
  });

  test("día con muchos regalos donde el ingreso no alcanza a cubrir el costo (utilidad negativa)", () => {
    // 20000 - 53600 - 5000 = -38600
    expect(calcularUtilidad(20000, 53600, 5000)).toBe(-38600);
  });

  test("el gasto operativo se resta completo incluso si es mayor que lo que queda del ingreso", () => {
    // ingreso apenas cubre el costo recuperado; el gasto operativo igual se
    // resta completo, sin prorratear (sección 3.3 del CLAUDE.md).
    expect(calcularUtilidad(53600, 53600, 5000)).toBe(-5000);
  });
});

describe("calcularIngresoTotal", () => {
  test("suma los tres bolsillos", () => {
    expect(calcularIngresoTotal(30000, 20000, 20000)).toBe(70000);
  });

  test("funciona con montos en cero", () => {
    expect(calcularIngresoTotal(0, 0, 0)).toBe(0);
  });

  test("funciona cuando solo un bolsillo tiene monto", () => {
    expect(calcularIngresoTotal(70000, 0, 0)).toBe(70000);
  });
});
