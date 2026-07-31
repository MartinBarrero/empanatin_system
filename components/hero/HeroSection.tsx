import Image from "next/image";

const accesosDirectos = [
  { href: "#dashboard", texto: "Ver el Dashboard" },
  { href: "#stock", texto: "Ver el stock" },
  { href: "#fiados", texto: "Ver las deudas" },
];

export function HeroSection() {
  return (
    <section
      id="hero"
      className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center"
    >
      <Image
        src="/logo_empanatin.png"
        alt="Logo de Empanatin"
        width={160}
        height={160}
        priority
        className="rounded-full"
      />
      <h1 className="font-serif text-5xl font-bold text-foreground sm:text-6xl">
        Empana<span className="text-accent">tin</span>
      </h1>
      <a
        href="#registro"
        className="rounded-md bg-accent px-6 py-3 text-lg font-semibold text-background transition hover:opacity-90"
      >
        Registra tus ventas Martin
      </a>
      <div className="flex flex-wrap justify-center gap-4">
        {accesosDirectos.map((acceso) => (
          <a
            key={acceso.href}
            href={acceso.href}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-foreground transition hover:border-accent"
          >
            {acceso.texto}
          </a>
        ))}
      </div>
    </section>
  );
}
