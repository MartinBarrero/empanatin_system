import Image from "next/image";
import { BarChart3, CircleCheck, DollarSign, TrendingUp } from "lucide-react";
import { IconBadge } from "@/components/ui/IconBadge";

const accesosDirectos = [
  { href: "#dashboard", texto: "Ver el Dashboard" },
  { href: "#stock", texto: "Ver el stock" },
  { href: "#fiados", texto: "Ver las deudas" },
];

const propuestas = [
  {
    icon: BarChart3,
    titulo: "Registra tus ventas",
    descripcion: "Lleva el control de cada venta de forma sencilla.",
  },
  {
    icon: DollarSign,
    titulo: "Controla tus finanzas",
    descripcion: "Conoce tus ingresos, gastos y utilidades al día.",
  },
  {
    icon: TrendingUp,
    titulo: "Toma mejores decisiones",
    descripcion: "Reportes claros para hacer crecer tu negocio.",
  },
];

export function HeroSection() {
  return (
    <section id="hero" className="px-6 pb-20 pt-16 sm:pt-24">
      <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <h1 className="font-serif text-5xl font-bold leading-[1.08] text-foreground sm:text-6xl">
            Las mejores
            <br />
            empanadas
            <br />
            <span className="text-accent">de la UTP</span>
          </h1>
          <p className="mt-6 text-lg text-muted">Registra tus ventas y controla tus finanzas</p>

          <a
            href="#registro"
            className="mt-8 inline-flex items-center gap-3 rounded-xl bg-accent px-7 py-4 text-base font-semibold text-background shadow-glow transition hover:-translate-y-0.5 hover:opacity-95"
          >
            <BarChart3 size={20} strokeWidth={2.25} />
            Registra tus ventas Martin
          </a>

          <p className="mt-5 flex items-center gap-2 text-sm text-muted">
            <CircleCheck size={16} className="text-accent" />
            Fácil, rápido y pensado para ti.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            {accesosDirectos.map((acceso) => (
              <a
                key={acceso.href}
                href={acceso.href}
                className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs text-muted transition hover:border-accent hover:text-accent"
              >
                {acceso.texto}
              </a>
            ))}
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-md items-center justify-center">
          <div
            aria-hidden
            className="absolute inset-8 -z-10 rounded-full bg-accent/25 blur-[90px]"
          />
          <Image
            src="/logo_empanatin.png"
            alt="Mascota de Empanatin"
            width={480}
            height={480}
            priority
            className="animate-float drop-shadow-[0_0_55px_rgba(242,194,48,0.35)]"
          />
        </div>
      </div>

      <div className="mx-auto mt-20 grid max-w-6xl gap-6 border-t border-border pt-12 sm:grid-cols-3">
        {propuestas.map((propuesta) => (
          <div
            key={propuesta.titulo}
            className="rounded-2xl border border-border bg-surface/60 p-5"
          >
            <IconBadge icon={propuesta.icon} size="sm" />
            <h3 className="mt-4 font-serif text-lg font-bold text-foreground">
              {propuesta.titulo}
            </h3>
            <p className="mt-1 text-sm text-muted">{propuesta.descripcion}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
