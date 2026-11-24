"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Instant sort control: navigates on change, keeping any active filters. */
export function SortSelect({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      id="collection-sort"
      aria-label="Sort by"
      value={current}
      onChange={(event) => {
        const next = new URLSearchParams(searchParams.toString());
        if (event.target.value === "popular") next.delete("sort");
        else next.set("sort", event.target.value);
        next.delete("page");
        const qs = next.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }}
    >
      <option value="popular">Featured</option>
      <option value="price-low">Price: low to high</option>
      <option value="price-high">Price: high to low</option>
      <option value="name">Name: A to Z</option>
      <option value="name-desc">Name: Z to A</option>
    </select>
  );
}
