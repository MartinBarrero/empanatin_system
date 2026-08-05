import { supabase } from "@/lib/supabase";
import {
  listarRegistrosDiarios,
  obtenerConfiguracionVigente,
  obtenerRegistroPorFecha,
} from "@/lib/repositorios/registrosDiarios";
import { listarFiados } from "@/lib/repositorios/fiados";
import { listarCompras } from "@/lib/repositorios/comprasMercancia";
import { obtenerStockActual } from "@/lib/repositorios/inventario";
import { obtenerCapitalReinversion } from "@/lib/repositorios/capital";
import { obtenerSaldosBolsillos } from "@/lib/repositorios/bolsillos";
import { HeroSection } from "@/components/hero/HeroSection";
import { RegistroSection } from "@/components/registro/RegistroSection";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { FiadosSection } from "@/components/fiados/FiadosSection";
import { StockSection } from "@/components/stock/StockSection";

// Depende de la fecha actual y del estado vigente en Supabase — no se puede
// cachear como página estática.
export const dynamic = "force-dynamic";

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function Home() {
  const fechaInicial = hoyISO();

  const [config, registroInicial, registros, fiados, compras, stock, capital, bolsillos] =
    await Promise.all([
      obtenerConfiguracionVigente(supabase),
      obtenerRegistroPorFecha(supabase, fechaInicial),
      listarRegistrosDiarios(supabase),
      listarFiados(supabase),
      listarCompras(supabase),
      obtenerStockActual(supabase),
      obtenerCapitalReinversion(supabase),
      obtenerSaldosBolsillos(supabase),
    ]);

  return (
    <>
      <HeroSection />
      <RegistroSection
        config={config}
        fechaInicial={fechaInicial}
        registroInicial={registroInicial}
        registros={registros}
      />
      <DashboardSection
        registros={registros}
        fiados={fiados}
        stock={stock}
        capital={capital}
        bolsillos={bolsillos}
      />
      <FiadosSection fiados={fiados} />
      <StockSection stock={stock} compras={compras} config={config} />
    </>
  );
}
