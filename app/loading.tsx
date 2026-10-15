export default function Loading() {
  return (
    <div className="flex min-h-dvh" aria-busy="true" aria-label="Carregando">
      <div className="hidden w-64 shrink-0 border-r bg-sidebar p-4 lg:block">
        <div className="skeleton h-7 w-32 rounded-lg" />
        <div className="skeleton mt-6 h-9 rounded-lg" />
        <div className="skeleton mt-4 h-8 rounded-lg" />
        <div className="skeleton mt-1 h-8 rounded-lg" />
      </div>
      <div className="flex-1 space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="skeleton h-8 w-40 rounded-lg" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="skeleton h-80 w-72 shrink-0 rounded-2xl lg:flex-1" />
          ))}
        </div>
      </div>
    </div>
  );
}
