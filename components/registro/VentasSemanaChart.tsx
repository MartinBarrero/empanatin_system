"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// TODO: conectar a datos reales de `registros_diarios` filtrados por la
// semana actual (ver lib/repositorios/registrosDiarios.ts,
// listarRegistrosDiarios). Por ahora usa datos mock.
const datosMock = [
  { dia: "Lun", carne: 20, pollo: 15 },
  { dia: "Mar", carne: 25, pollo: 10 },
  { dia: "Mié", carne: 18, pollo: 20 },
  { dia: "Jue", carne: 30, pollo: 12 },
  { dia: "Vie", carne: 35, pollo: 22 },
  { dia: "Sáb", carne: 40, pollo: 28 },
  { dia: "Dom", carne: 15, pollo: 8 },
];

export function VentasSemanaChart() {
  return (
    <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-lg shadow-black/20">
      <h3 className="mb-1 text-sm font-medium text-muted">Ventas de la semana actual</h3>
      <p className="mb-4 text-xs text-warning">Datos de ejemplo — aún no conectado a tus ventas reales.</p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={datosMock}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2C2C30" />
          <XAxis dataKey="dia" stroke="#A3A3A8" fontSize={12} />
          <YAxis stroke="#A3A3A8" fontSize={12} />
          <Tooltip
            contentStyle={{ background: "#1A1A1D", border: "1px solid #2C2C30", color: "#F5F5F0" }}
          />
          <Legend />
          <Bar dataKey="carne" name="Carne" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pollo" name="Pollo" fill="#F5F5F0" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
