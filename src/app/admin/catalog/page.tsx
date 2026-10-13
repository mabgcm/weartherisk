import Image from "next/image";
import Link from "next/link";
import { getPrintifyBlueprints } from "@/lib/printify/client";

const PAGE_SIZE = 24;

interface CatalogPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { q = "", page = "1" } = await searchParams;
  const query = q.trim().toLowerCase();
  const requestedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const blueprints = await getPrintifyBlueprints();
  const filtered = query
    ? blueprints.filter((item) => `${item.title} ${item.brand} ${item.model}`.toLowerCase().includes(query))
    : blueprints;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, pageCount);
  const products = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageHref = (target: number) => `/admin/catalog?${new URLSearchParams({ ...(q && { q }), page: String(target) })}`;

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-6 border-b border-black/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <Link href="/" className="text-sm font-bold text-emerald-700">← Storefront</Link>
            <h1 className="mt-4 text-4xl font-black tracking-tight">Printify product catalog</h1>
            <p className="mt-2 text-black/60">Browse {blueprints.length.toLocaleString("en-US")} product blueprints and choose a print provider.</p>
          </div>
          <form className="flex w-full max-w-md gap-2">
            <input name="q" defaultValue={q} placeholder="Search products or brands" className="min-w-0 flex-1 rounded-full border border-black/15 bg-white px-5 py-3 outline-none focus:border-emerald-700" />
            <button className="rounded-full bg-emerald-700 px-5 py-3 font-semibold text-white">Search</button>
          </form>
        </header>

        <div className="grid gap-7 py-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Link key={product.id} href={`/admin/catalog/${product.id}`} className="group">
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-white">
                {product.images[0] && <Image src={product.images[0]} alt={product.title} fill sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-contain p-5 transition duration-300 group-hover:scale-105" />}
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-emerald-700">{product.brand}</p>
              <h2 className="mt-1 font-bold leading-snug">{product.title}</h2>
              <p className="mt-1 text-sm text-black/50">Model {product.model}</p>
            </Link>
          ))}
        </div>

        {products.length === 0 && <p className="py-24 text-center text-black/55">No products match your search.</p>}

        <nav className="flex items-center justify-center gap-4 border-t border-black/10 pt-8">
          {currentPage > 1 && <Link href={pageHref(currentPage - 1)} className="rounded-full border border-black/15 px-5 py-2">Previous</Link>}
          <span className="text-sm text-black/55">Page {currentPage} of {pageCount}</span>
          {currentPage < pageCount && <Link href={pageHref(currentPage + 1)} className="rounded-full border border-black/15 px-5 py-2">Next</Link>}
        </nav>
      </div>
    </main>
  );
}
