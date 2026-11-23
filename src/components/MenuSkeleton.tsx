export function MenuSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="bg-[#1E1E1E] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-row md:flex-col animate-pulse"
        >
          <div className="hidden md:block aspect-[4/3] w-full bg-zinc-800/70" />
          <div className="flex-1 p-4 sm:p-5 space-y-3">
            <div className="h-3 w-20 bg-zinc-800 rounded" />
            <div className="h-5 w-3/4 bg-zinc-700/80 rounded" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-full bg-zinc-800 rounded" />
              <div className="h-3.5 w-2/3 bg-zinc-800 rounded" />
            </div>
            <div className="pt-2 flex items-center justify-between">
              <div className="h-5 w-20 bg-zinc-700/80 rounded" />
              <div className="h-10 w-24 bg-zinc-800 rounded-xl" />
            </div>
          </div>
          <div className="md:hidden w-28 p-3 pl-0 flex items-center">
            <div className="w-full aspect-square rounded-xl bg-zinc-800/70" />
          </div>
        </div>
      ))}
    </div>
  );
}
