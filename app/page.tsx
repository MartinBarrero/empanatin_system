import Link from "next/link";

export default function Home() {
  return (
    <div className="p-8">
      <Link href="/registro-diario" className="text-accent hover:underline">
        Ir a registro diario →
      </Link>
    </div>
  );
}
