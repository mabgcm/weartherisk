import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrintifyBlueprint, getPrintifyProviders, getPrintifyVariants } from "@/lib/printify/client";

interface BlueprintPageProps {
  params: Promise<{ blueprintId: string }>;
  searchParams: Promise<{ provider?: string }>;
}

export default async function BlueprintPage({ params, searchParams }: BlueprintPageProps) {
  const { blueprintId: rawBlueprintId } = await params;
  const { provider: rawProviderId } = await searchParams;
  const blueprintId = Number(rawBlueprintId);
  if (!Number.isInteger(blueprintId)) notFound();

  const [blueprint, providers] = await Promise.all([
    getPrintifyBlueprint(blueprintId).catch(() => null),
    getPrintifyProviders(blueprintId).catch(() => []),
  ]);
  if (!blueprint) notFound();

  const selectedProvider = providers.find((item) => item.id === Number(rawProviderId)) ?? providers[0];
  const variants = selectedProvider ? await getPrintifyVariants(blueprintId, selectedProvider.id).catch(() => []) : [];
  const colors = [...new Set(variants.map((item) => item.options.color).filter(Boolean))];
  const sizes = [...new Set(variants.map((item) => item.options.size).filter(Boolean))];

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin/catalog" className="text-sm font-bold text-emerald-700">← Product catalog</Link>
        <div className="mt-8 grid gap-12 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-white">
            {blueprint.images[0] && <Image src={blueprint.images[0]} alt={blueprint.title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain p-8" priority />}
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">{blueprint.brand} · {blueprint.model}</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{blueprint.title}</h1>
            <p className="mt-5 line-clamp-6 leading-7 text-black/60">{blueprint.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}</p>

            <section className="mt-10">
              <h2 className="text-lg font-black">Print provider</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {providers.map((provider) => (
                  <Link key={provider.id} href={`/admin/catalog/${blueprintId}?provider=${provider.id}`} className={`rounded-full border px-4 py-2 text-sm ${provider.id === selectedProvider?.id ? "border-emerald-700 bg-emerald-700 text-white" : "border-black/15 bg-white"}`}>
                    {provider.title}
                  </Link>
                ))}
              </div>
            </section>

            {selectedProvider && (
              <section className="mt-8 rounded-3xl bg-white p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-black">Available variants</h2>
                  <span className="text-sm text-black/50">{variants.length} combinations</span>
                </div>
                <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-black/45">Colors</dt><dd className="mt-1 text-sm leading-6">{colors.join(", ") || "Not specified"}</dd></div>
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-black/45">Sizes</dt><dd className="mt-1 text-sm leading-6">{sizes.join(", ") || "Not specified"}</dd></div>
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-black/45">Decoration</dt><dd className="mt-1 text-sm uppercase">{selectedProvider.decoration_methods.join(", ")}</dd></div>
                </dl>
              </section>
            )}

            <p className="mt-6 text-sm leading-6 text-black/50">Next step: upload artwork, select variants, set retail prices, and create this product in your Printify shop.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
