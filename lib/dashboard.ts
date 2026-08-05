import type { RegistroDiario } from "./repositorios/registrosDiarios";

export interface TotalesPeriodo {
  ventas: number;
  utilidad: number;
}

export function inicioDeSemana(fecha: Date): Date {
  const resultado = new Date(fecha);
  const dia = resultado.getDay();
  const diff = dia === 0 ? 6 : dia - 1; // semana inicia lunes
  resultado.setDate(resultado.getDate() - diff);
  resultado.setHours(0, 0, 0, 0);
  return resultado;
}

function formatoFechaLocal(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function calcularTotalesPorPeriodo(
  registros: RegistroDiario[],
  fechaReferencia: string
): { diario: TotalesPeriodo; semanal: TotalesPeriodo; mensual: TotalesPeriodo } {
  const referencia = new Date(`${fechaReferencia}T00:00:00`);
  const inicioSemana = inicioDeSemana(referencia);
  const anioMes = fechaReferencia.slice(0, 7); // YYYY-MM

  const vacio = (): TotalesPeriodo => ({ ventas: 0, utilidad: 0 });
  const totales = { diario: vacio(), semanal: vacio(), mensual: vacio() };

  for (const registro of registros) {
    const fechaRegistro = new Date(`${registro.fecha}T00:00:00`);

    if (registro.fecha === fechaReferencia) {
      totales.diario.ventas += registro.ingreso_total;
      totales.diario.utilidad += registro.utilidad;
    }
    if (fechaRegistro >= inicioSemana && fechaRegistro <= referencia) {
      totales.semanal.ventas += registro.ingreso_total;
      totales.semanal.utilidad += registro.utilidad;
    }
    if (registro.fecha.slice(0, 7) === anioMes) {
      totales.mensual.ventas += registro.ingreso_total;
      totales.mensual.utilidad += registro.utilidad;
    }
  }

  return totales;
}

export function calcularComparacionCarnePollo(
  registros: RegistroDiario[]
): { carne: number; pollo: number } {
  return registros.reduce(
    (acc, r) => ({ carne: acc.carne + r.carne_llevada, pollo: acc.pollo + r.pollo_llevada }),
    { carne: 0, pollo: 0 }
  );
}

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export interface VentasDia {
  dia: string;
  carne: number;
  pollo: number;
}

export function calcularVentasSemana(
  registros: RegistroDiario[],
  fechaReferencia: string
): VentasDia[] {
  const referencia = new Date(`${fechaReferencia}T00:00:00`);
  const inicioSemana = inicioDeSemana(referencia);

  return DIAS_SEMANA.map((dia, indice) => {
    const fecha = new Date(inicioSemana);
    fecha.setDate(fecha.getDate() + indice);
    const fechaISO = formatoFechaLocal(fecha);
    const registro = registros.find((r) => r.fecha === fechaISO);

    return {
      dia,
      carne: registro?.carne_llevada ?? 0,
      pollo: registro?.pollo_llevada ?? 0,
    };
  });
}

export interface PuntoUtilidadAcumulada {
  fecha: string;
  acumulado: number;
}

export function calcularUtilidadAcumulada(
  registros: RegistroDiario[]
): PuntoUtilidadAcumulada[] {
  const ordenados = [...registros].sort((a, b) => a.fecha.localeCompare(b.fecha));
  let acumulado = 0;
  return ordenados.map((registro) => {
    acumulado += registro.utilidad;
    return { fecha: registro.fecha, acumulado };
  });
}
