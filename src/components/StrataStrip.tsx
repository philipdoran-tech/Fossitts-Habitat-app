import { FossittHabitat, SpeciesArchetype } from '../data/fossittHabitats';

interface StrataStripProps {
  habitat: FossittHabitat;
}

function ArchetypeGlyph({ archetype }: { archetype: SpeciesArchetype }) {
  switch (archetype) {
    case 'sessile_oak':
    case 'pedunculate_oak':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 shrink-0 text-[#2D5A3D]" aria-hidden="true">
          <path d="M8 17 C6 11 12 6 19 7 C25 5 33 10 31 16 C33 21 26 23 20 21 C13 23 7 21 8 17 Z" fill="currentColor" fillOpacity="0.12" stroke="#18201C" strokeWidth="0.9" strokeDasharray="2 1.5" />
          <path d="M20 36 L20 22 M20 24 Q12 18 9 13 M20 22 Q28 17 31 12 M16 20 Q18 12 20 8 M13 17 L8 15 M27 16 L32 14" stroke="#46382B" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'ash':
    case 'downy_birch':
    case 'rowan':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 shrink-0 text-[#4B7447]" aria-hidden="true">
          <ellipse cx="14" cy="12" rx="6" ry="4" fill="currentColor" fillOpacity="0.12" stroke="#18201C" strokeWidth="0.8" strokeDasharray="2 1.5" />
          <ellipse cx="26" cy="11" rx="6" ry="4" fill="currentColor" fillOpacity="0.12" stroke="#18201C" strokeWidth="0.8" strokeDasharray="2 1.5" />
          <ellipse cx="20" cy="7" rx="5" ry="3.5" fill="currentColor" fillOpacity="0.12" stroke="#18201C" strokeWidth="0.8" strokeDasharray="2 1.5" />
          <path d="M20 36 L19 18 M19 24 L13 13 M19 22 L26 12 M19 18 L20 7 M15 16 L10 12 M24 15 L29 11" stroke="#46382B" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'hazel':
    case 'willow_carr':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 shrink-0 text-[#3F6B43]" aria-hidden="true">
          <path d="M7 15 C8 9 16 7 21 9 C27 7 34 11 33 17 C29 22 12 22 7 15 Z" fill="currentColor" fillOpacity="0.11" stroke="#18201C" strokeWidth="0.8" strokeDasharray="2 1.5" />
          <path d="M20 36 Q13 24 9 13 M20 36 Q17 22 17 10 M20 36 Q24 22 26 11 M20 36 Q29 25 32 16 M12 21 L7 16 M27 20 L33 14" stroke="#46382B" strokeWidth="1.35" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'yew':
    case 'holly':
    case 'scots_pine':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 shrink-0 text-[#1F4A32]" aria-hidden="true">
          <ellipse cx="20" cy="12" rx="12" ry="3.5" fill="currentColor" fillOpacity="0.18" stroke="#18201C" strokeWidth="0.8" />
          <ellipse cx="20" cy="19" rx="14" ry="3.8" fill="currentColor" fillOpacity="0.18" stroke="#18201C" strokeWidth="0.8" />
          <path d="M18 36 L19 11 M22 36 L21 14 M19 20 L8 18 M21 19 L32 17 M19 13 L10 11 M21 13 L30 11" stroke="#6E3B2B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'sycamore_parkland':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 shrink-0 text-[#2B5B78]" aria-hidden="true">
          <path d="M20 36 L20 20" stroke="#46382B" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="20" cy="13" r="9.5" fill="currentColor" fillOpacity="0.12" stroke="#2B5B78" strokeWidth="1.2" strokeDasharray="3 2" />
        </svg>
      );
    case 'hawthorn_blackthorn':
    case 'gorse':
    case 'ling_heather':
    case 'bell_heather':
    case 'dwarf_willow':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 shrink-0 text-[#5C4962]" aria-hidden="true">
          <path d="M6 32 Q20 14 34 32 Z" fill="currentColor" fillOpacity="0.12" stroke="#18201C" strokeWidth="0.9" strokeDasharray="2 1.5" />
          <path d="M20 32 L14 23 L9 20 M20 32 L26 22 L31 19 M20 32 L20 18 M16 25 L19 20 M24 25 L21 19" stroke="#46382B" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 shrink-0 text-[#2D5A3D]" aria-hidden="true">
          <path d="M20 34 Q14 20 8 15 M20 34 Q18 18 16 9 M20 34 Q22 18 24 9 M20 34 Q26 20 32 15" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <ellipse cx="20" cy="33" rx="6" ry="3" fill="#5E4632" fillOpacity="0.4" />
        </svg>
      );
  }
}

export function StrataStrip({ habitat }: StrataStripProps) {
  return (
    <section className="bg-white border border-[#DCD9CF] rounded-lg p-4">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <h3 className="text-xs font-semibold text-[#18201C]">
          Characteristic Species & Growth Architecture
        </h3>
        <span className="font-mono text-[11px] text-[#555E58]">
          {habitat.species.length} elements · weighted transect mix
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {habitat.species.map((sp) => (
          <div
            key={`${sp.latin}-${sp.stratum}`}
            className="flex items-center gap-3 p-2.5 rounded border border-[#EAE7DF] bg-[#FAF9F5]"
          >
            <ArchetypeGlyph archetype={sp.archetype} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2 text-xs font-semibold text-[#18201C]">
                <span className="truncate">{sp.common}</span>
                <span className="font-mono text-[11px] font-medium text-[#2D5A3D] tabular-nums shrink-0">
                  {sp.dominancePct}%
                </span>
              </div>
              <div className="text-[11px] italic text-[#555E58] truncate">
                {sp.latin}
              </div>
              <div className="text-[11px] text-[#2D5A3D] truncate mt-0.5">
                {sp.stratum} · {sp.architecturalRole}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
