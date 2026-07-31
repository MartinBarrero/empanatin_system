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
    <div className="rounded-md border border-border bg-surface p-4">
      <h3 className="mb-4 text-sm font-medium text-muted">Ventas de la semana actual</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={datosMock}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2C2C30" />
          <XAxis dataKey="dia" stroke="#A3A3A8" fontSize={12} />
          <YAxis stroke="#A3A3A8" fontSize={12} />
          <Tooltip
            contentStyle={{ background: "#1A1A1D", border: "1px solid #2C2C30", color: "#F5F5F0" }}
          />
          <Legend />
          <Bar dataKey="carne" name="Carne" fill="#F2C230" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pollo" name="Pollo" fill="#3DB56A" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
