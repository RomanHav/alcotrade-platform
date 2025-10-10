// import { useCallback, useEffect, useState } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import FilterSheet from '@/app/(protected)/products/_components/ProductsTable/FilterSheet';

// type Item = {
//     id: string;
//     name: string;
//     coverId: string
// }

// export default function ProductList() {

//   const router = useRouter();
//   const sp = useSearchParams();
//   const PAGE_SIZE = 10;
//   type FilterDraft = { query: string; status?: string; brand?: string };

//   const [filterOpen, setFilterOpen] = useState(false);
//   const [filterDraft, setFilterDraft] = useState<FilterDraft>({
//     query: sp.get('query') ?? '',
//     status: sp.get('status') ?? undefined,
//     brand: sp.get('brand') ?? undefined,
//   });

//   useEffect(() => {
//     setFilterDraft({
//       query: sp.get('query') ?? '',
//       status: sp.get('status') ?? undefined,
//       brand: sp.get('brand') ?? undefined,
//     });
//   }, [sp.toString()]);

//   const applyParams = useCallback(
//     (patch: Record<string, string | undefined>) => {
//       const params = new URLSearchParams(sp.toString());
//       for (const [k, v] of Object.entries(patch)) {
//         if (!v) params.delete(k);
//         else params.set(k, v);
//       }
//       params.set('page', '1');
//       params.set('limit', String(PAGE_SIZE));
//       router.push(`?${params.toString()}`);
//     },
//     [router, sp],
//   );

//   const applyFilter = () => {
//     applyParams({
//       query: filterDraft.query || undefined,
//       status: filterDraft.status || undefined,
//       brand: filterDraft.brand || undefined,
//     });
//     setFilterOpen(false);
//   };

//   const clearFilter = () => {
//     setFilterDraft({ query: '', status: undefined, brand: undefined });
//     const params = new URLSearchParams();
//     params.set('page', '1');
//     params.set('limit', String(PAGE_SIZE));
//     router.push(`?${params.toString()}`);
//     setFilterOpen(false);
//   };

//   return (
//     <div className="w-full rounded-lg bg-neutral-300 shadow-sm">
//       <div className="flex w-3xs flex-col items-start justify-start">
//         <div className="flex items-center justify-between">
//           <span>Показано</span>
//           <FilterSheet
//             open={filterOpen}
//             setOpen={setFilterOpen}
//             brands={brands}
//             draft={filterDraft}
//             setDraft={setFilterDraft}
//             onApply={applyFilter}
//             onClear={clearFilter}
//           />
//         </div>
//         <ul className="flex flex-col">{}</ul>
//       </div>
//     </div>
//   );
// }
