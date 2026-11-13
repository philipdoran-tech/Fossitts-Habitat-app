import { useEffect, useRef, useState } from 'react';
import {
  FOSSITT_HABITATS,
  FossittHabitat,
  HABITAT_GROUPS,
  HabitatGroupId,
  computeArchitectureMetrics,
} from '../data/fossittHabitats';
import { renderHabitatPlate } from '../engine/habitatRenderer';

interface MiniPlateProps {
  habitat: FossittHabitat;
}

function MiniHabitatPlate({ habitat }: MiniPlateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = 320;
    const h = 156;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderHabitatPlate(ctx, w, h, habitat, habitat.idealParams, {
      mode: 'textured',
      compareHabitat: null,
      showLabels: false,
      compact: true,
    });
  }, [habitat]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[156px] block bg-[#F6F4EE]"
      aria-hidden="true"
    />
  );
}

interface MorphologyIndexProps {
  selectedCode: string;
  onSelectHabitat: (habitat: FossittHabitat) => void;
}

export function MorphologyIndex({
  selectedCode,
  onSelectHabitat,
}: MorphologyIndexProps) {
  const [groupFilter, setGroupFilter] = useState<HabitatGroupId | 'ALL'>('ALL');
  const [query, setQuery] = useState('');

  const filtered = FOSSITT_HABITATS.filter((h) => {
    if (groupFilter !== 'ALL' && h.group !== groupFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      h.code.toLowerCase().includes(q) ||
      h.name.toLowerCase().includes(q) ||
      h.species.some(
        (s) =>
          s.common.toLowerCase().includes(q) ||
          s.latin.toLowerCase().includes(q)
      )
    );
  });

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#DCD9CF] pb-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#18201C] text-balance">
            Visual Morphology Index
          </h1>
          <p className="text-sm text-[#555E58] mt-1">
            Compare architectural section silhouettes across Fossitt habitats. Select any plate to adjust light, soil, maturity, and exposure.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter code or species (e.g. WN1, Hazel)..."
            aria-label="Filter habitats by code, name, or species"
            className="px-3 py-1.5 text-xs bg-white border border-[#D6D3C9] rounded-md text-[#18201C] placeholder:text-[#8A918B] focus:outline-none focus:border-[#2D5A3D] w-64"
          />
        </div>
      </div>

      {/* Group Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EBE9E2] rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setGroupFilter('ALL')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            groupFilter === 'ALL'
              ? 'bg-white text-[#18201C] shadow-xs'
              : 'text-[#555E58] hover:text-[#18201C]'
          }`}
        >
          All Habitats ({FOSSITT_HABITATS.length})
        </button>
        {HABITAT_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGroupFilter(g.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              groupFilter === g.id
                ? 'bg-white text-[#18201C] shadow-xs'
                : 'text-[#555E58] hover:text-[#18201C]'
            }`}
          >
            {g.shortLabel}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-[#DCD9CF] rounded-lg p-10 text-center text-sm text-[#555E58]">
          No Fossitt habitats match "{query}". Clear the search box to view all plates.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((h) => {
            const m = computeArchitectureMetrics(h, h.idealParams);
            const isSelected = h.code === selectedCode;
            return (
              <button
                key={h.code}
                type="button"
                onClick={() => onSelectHabitat(h)}
                className={`group text-left bg-white rounded-lg border overflow-hidden transition-colors cursor-pointer flex flex-col ${
                  isSelected
                    ? 'border-[#2D5A3D] ring-1 ring-[#2D5A3D]'
                    : 'border-[#DCD9CF] hover:border-[#18201C]'
                }`}
              >
                <div className="border-b border-[#EAE7DF] overflow-hidden">
                  <MiniHabitatPlate habitat={h} />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#555E58]">
                      <span className="font-mono font-medium text-[#2D5A3D]">
                        {h.code}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{h.subgroup}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">p.{h.fossittPage}</span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-[#18201C] mt-1 group-hover:text-[#2D5A3D] transition-colors">
                      {h.name}
                    </h3>
                    <p className="text-xs text-[#555E58] mt-1 line-clamp-2">
                      {h.formCue}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#F0EDE5] font-mono text-[11px] text-[#3E4742] tabular-nums">
                    <span>H: {m.canopyHeightM}m</span>
                    <span>Clear stem: {m.clearStemRatioPct}%</span>
                    <span>Root: {m.rootDepthM}m</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
