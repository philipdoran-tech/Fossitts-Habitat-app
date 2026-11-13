import { useEffect, useRef } from 'react';
import {
  FossittHabitat,
  HabitatParameters,
  computeArchitectureMetrics,
} from '../data/fossittHabitats';
import { RenderMode, renderHabitatPlate } from '../engine/habitatRenderer';

interface StagePanelProps {
  indexLabel: string;
  title: string;
  subtitle: string;
  habitat: FossittHabitat;
  params: HabitatParameters;
  mode: RenderMode;
  onApplyStage: (params: HabitatParameters) => void;
}

function StagePanel({
  indexLabel,
  title,
  subtitle,
  habitat,
  params,
  mode,
  onApplyStage,
}: StagePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const metrics = computeArchitectureMetrics(habitat, params);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = 520;
    const h = 250;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderHabitatPlate(ctx, w, h, habitat, params, {
      mode,
      compareHabitat: null,
      showLabels: false,
      compact: true,
    });
  }, [habitat, params, mode]);

  return (
    <div className="bg-white border border-[#DCD9CF] rounded-lg overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-[#EAE7DF] flex items-center justify-between gap-2 bg-[#FAF9F5]">
        <div>
          <div className="text-xs font-semibold text-[#18201C]">
            {indexLabel} {title}
          </div>
          <div className="text-[11px] text-[#555E58]">{subtitle}</div>
        </div>
        <button
          type="button"
          onClick={() => onApplyStage(params)}
          className="px-3 py-1.5 text-xs font-medium rounded border border-[#D6D3C9] bg-white text-[#18201C] hover:border-[#2D5A3D] hover:text-[#2D5A3D] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
        >
          Open in Studio
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-[250px] block bg-[#F6F4EE]"
        aria-label={`${title} architectural profile of ${habitat.name}`}
      />

      <div className="px-4 py-2.5 border-t border-[#EAE7DF] grid grid-cols-4 gap-2 font-mono text-[11px] text-[#3E4742] tabular-nums">
        <div>Light {params.light}%</div>
        <div>Height {metrics.canopyHeightM}m</div>
        <div>Stem {metrics.clearStemRatioPct}%</div>
        <div>Lean {metrics.windLeanDeg}°</div>
      </div>
    </div>
  );
}

interface SuccessionStripProps {
  habitat: FossittHabitat;
  mode: RenderMode;
  onApplyStageInStudio: (params: HabitatParameters) => void;
}

export function SuccessionStrip({
  habitat,
  mode,
  onApplyStageInStudio,
}: SuccessionStripProps) {
  const stages: Array<{
    indexLabel: string;
    title: string;
    subtitle: string;
    params: HabitatParameters;
  }> = [
    {
      indexLabel: '01.',
      title: 'Pioneer & Colonising',
      subtitle: 'High light · shallow young root profile · sapling/herb dominance',
      params: {
        light: 92,
        soil: Math.max(25, habitat.idealParams.soil - 12),
        maturity: 15,
        exposure: Math.min(65, habitat.idealParams.exposure + 10),
      },
    },
    {
      indexLabel: '02.',
      title: 'Stem-Exclusion / Thicket',
      subtitle: 'Intense vertical light competition · rising clear stem ratio',
      params: {
        light: Math.max(15, habitat.idealParams.light - 18),
        soil: habitat.idealParams.soil,
        maturity: 48,
        exposure: Math.max(15, habitat.idealParams.exposure - 8),
      },
    },
    {
      indexLabel: '03.',
      title: 'Ideal Semi-Natural (Fossitt)',
      subtitle: 'Multi-aged strata · balanced gaps · characteristic root-to-shoot form',
      params: habitat.idealParams,
    },
    {
      indexLabel: '04.',
      title: 'Atlantic Wind-Sheared & Veteran',
      subtitle: 'Leeward flagged crowns · gnarled limbs · deadwood & snags',
      params: {
        light: Math.min(95, habitat.idealParams.light + 16),
        soil: Math.max(18, habitat.idealParams.soil - 15),
        maturity: 92,
        exposure: 88,
      },
    },
  ];

  return (
    <section className="space-y-5">
      <div className="border-b border-[#DCD9CF] pb-4">
        <div className="text-xs font-mono text-[#2D5A3D]">
          {habitat.code} · {habitat.subgroup}
        </div>
        <h1 className="font-display text-2xl font-semibold text-[#18201C] mt-1 text-balance">
          Architectural Succession Sequence — {habitat.name}
        </h1>
        <p className="text-sm text-[#555E58] mt-1">
          Four simultaneous ecological states illustrating how age, canopy competition, and Atlantic wind transform plant architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {stages.map((st) => (
          <StagePanel
            key={st.indexLabel}
            indexLabel={st.indexLabel}
            title={st.title}
            subtitle={st.subtitle}
            habitat={habitat}
            params={st.params}
            mode={mode}
            onApplyStage={onApplyStageInStudio}
          />
        ))}
      </div>
    </section>
  );
}
