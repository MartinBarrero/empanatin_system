// Módulo de cálculo compartido — ver Claude.md sección 3.3 y 8.
// Única fuente de verdad para estos cálculos: se usa tanto en el formulario
// (vista previa en vivo) como en el guardado en el servidor.

export interface Configuracion {
  id: number;
  costo_paquete_carne: number;
  costo_paquete_pollo: number;
  unidades_por_paquete: number;
  precio_venta_carne: number;
  precio_venta_pollo: number;
  promo_2x_carne: number;
  costo_paquete_salsa: number;
  gasto_operativo_diario: number;
}

export function calcularCostoUnitario(
  costoPaquete: number,
  unidadesPorPaquete: number
): number {
  return costoPaquete / unidadesPorPaquete;
}

export function calcularCostoRecuperado(
  carneLlevada: number,
  polloLlevada: number,
  config: Configuracion
): number {
  const costoUnitCarne = calcularCostoUnitario(
    config.costo_paquete_carne,
    config.unidades_por_paquete
  );
  const costoUnitPollo = calcularCostoUnitario(
    config.costo_paquete_pollo,
    config.unidades_por_paquete
  );
  return carneLlevada * costoUnitCarne + polloLlevada * costoUnitPollo;
}

export function calcularUtilidad(
  ingresoTotal: number,
  costoRecuperado: number,
  gastoOperativo: number
): number {
  return ingresoTotal - costoRecuperado - gastoOperativo;
}

// Verifica que la distribución entre bolsillos (caja/monedas/nu) coincida con
// el ingreso total del día, con una tolerancia de redondeo de 1 peso.
export function sumaBolsillosCuadra(
  montoCaja: number,
  montoMonedas: number,
  montoNu: number,
  ingresoTotal: number,
  tolerancia = 1
): boolean {
  const suma = montoCaja + montoMonedas + montoNu;
  return Math.abs(suma - ingresoTotal) <= tolerancia;
}
