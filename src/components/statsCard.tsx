interface StatsCardProps {
  label:    string;
  value:    string | number;
  icon:     React.ReactNode;
  sub?:     string;
  loading?: boolean;
  live?:    boolean;   
}

export const StatsCard = ({
  label,
  value,
  icon,
  sub,
  loading = false,
  live = false,
}: StatsCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#111111] border border-white/5 p-6 flex flex-col gap-3 shadow-lg">
      {/* Subtle glow */}
      <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-[rgb(128,255,0)]/5 blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-tertiary text-xs tracking-widest text-gray-500 uppercase">
            {label}
          </p>
          {/* Live indicator dot */}
          {live && !loading && (
            <span className="w-1.5 h-1.5 rounded-full bg-[rgb(128,255,0)] animate-pulse flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 text-[rgb(128,255,0)]">
          {icon}
        </div>
      </div>

      {/* Value — skeleton while loading */}
      {loading ? (
        <div className="space-y-2">
          <div className="h-9 w-28 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-3 w-20 rounded-full bg-white/5 animate-pulse" />
        </div>
      ) : (
        <>
          <p className="font-secondary text-4xl text-white">{value}</p>
          {sub && (
            <p className="font-body text-xs text-gray-600">{sub}</p>
          )}
        </>
      )}
    </div>
  );
};