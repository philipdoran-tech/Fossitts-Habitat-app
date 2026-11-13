import {
  FossittHabitat,
  HabitatParameters,
  computeArchitectureMetrics,
} from '../data/fossittHabitats';

interface ControlDeckProps {
  habitat: FossittHabitat;
  params: HabitatParameters;
  onChange: (next: HabitatParameters) => void;
  onApplyPreset: (preset: HabitatParameters) => void;
}

export function ControlDeck({
  habitat,
  params,
  onChange,
  onApplyPreset,
}: ControlDeckProps) {
  const metrics = computeArchitectureMetrics(habitat, params);
  const { sliderLabels } = habitat;

  const updateField = (key: keyof HabitatParameters, value: number) => {
    onChange({ ...params, [key]: value });
  };

  const presets: Array<{ label: string; values: HabitatParameters }> = [
    {
      label: 'Ideal Benchmark',
      values: habitat.idealParams,
    },
    {
      label: 'Atlantic Edge',
      values: {
        light: Math.min(100, habitat.idealParams.light + 22),
        soil: Math.max(15, habitat.idealParams.soil - 18),
        maturity: habitat.idealParams.maturity,
        exposure: 88,
      },
    },
    {
      label: 'Heavy Browse / Stress',
      values: {
        light: 85,
        soil: Math.max(12, habitat.idealParams.soil - 28),
        maturity: Math.max(25, habitat.idealParams.maturity - 35),
        exposure: 82,
      },
    },
    {
      label: 'Pioneer Stage',
      values: {
        light: 92,
        soil: habitat.idealParams.soil,
        maturity: 16,
        exposure: Math.min(70, habitat.idealParams.exposure + 15),
      },
    },
  ];

  const sliders: Array<{
    key: keyof HabitatParameters;
    title: string;
    low: string;
    high: string;
    value: number;
  }> = [
    {
      key: 'light',
      title: 'Light & Canopy Competition',
      low: sliderLabels.lightLow,
      high: sliderLabels.lightHigh,
      value: params.light,
    },
    {
      key: 'soil',
      title: sliderLabels.soilTitle,
      low: sliderLabels.soilLow,
      high: sliderLabels.soilHigh,
      value: params.soil,
    },
    {
      key: 'maturity',
      title: 'Stage of Maturity & Succession',
      low: sliderLabels.maturityLow,
      high: sliderLabels.maturityHigh,
      value: params.maturity,
    },
    {
      key: 'exposure',
      title: 'Exposure, Wind & Grazing',
      low: sliderLabels.exposureLow,
      high: sliderLabels.exposureHigh,
      value: params.exposure,
    },
  ];

  return (
    <aside className="flex flex-col bg-white border border-[#DCD9CF] rounded-lg divide-y divide-[#E7E4DC]">
      {/* Habitat Reference Header */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 text-xs text-[#555E58] mb-1">
          <span className="font-mono font-medium text-[#2D5A3D]">{habitat.code}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{habitat.subgroup}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono whitespace-nowrap">p. {habitat.fossittPage}</span>
        </div>
        <h2 className="font-display text-xl font-semibold text-[#18201C] leading-snug text-balance">
          {habitat.name}
        </h2>
        {habitat.annexICode && (
          <p className="mt-1 text-xs text-[#555E58]">
            EU Annex I ({habitat.annexICode})
            {habitat.annexIPriority ? ' · Priority habitat' : ''}
          </p>
        )}
      </div>

      {/* 4 Parametric Sliders */}
      <div className="p-4 space-y-5">
        {sliders.map((s) => (
          <div key={s.key} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <label
                htmlFor={`slider-${s.key}`}
                className="text-xs font-semibold text-[#18201C]"
              >
                {s.title}
              </label>
              <span className="font-mono text-xs font-medium text-[#18201C] tabular-nums">
                {s.value}%
              </span>
            </div>

            <input
              id={`slider-${s.key}`}
              type="range"
              min={0}
              max={100}
              step={1}
              value={s.value}
              onChange={(e) => updateField(s.key, Number(e.target.value))}
              className="arch-slider"
            />

            {/* Drafting tick marks */}
            <div className="flex justify-between px-0.5 text-[10px] font-mono text-[#8A918B] select-none">
              <span>|</span>
              <span>|</span>
              <span>|</span>
              <span>|</span>
              <span>|</span>
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px] text-[#555E58]">
              <span className="truncate">{s.low}</span>
              <span className="truncate text-right">{s.high}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Ecological Condition Presets */}
      <div className="p-4">
        <div className="text-xs font-semibold text-[#18201C] mb-2">
          Ecological Condition Presets
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {presets.map((preset) => {
            const isActive =
              Math.abs(params.light - preset.values.light) <= 1 &&
              Math.abs(params.soil - preset.values.soil) <= 1 &&
              Math.abs(params.maturity - preset.values.maturity) <= 1 &&
              Math.abs(params.exposure - preset.values.exposure) <= 1;

            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onApplyPreset(preset.values)}
                className={`px-2.5 py-2 text-xs font-medium rounded border text-left truncate transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#2D5A3D] text-white border-[#2D5A3D]'
                    : 'bg-[#FAF9F5] text-[#3E4742] border-[#E2DFD5] hover:border-[#18201C] hover:text-[#18201C]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Architectural Proportion Metrics */}
      <div className="p-4">
        <div className="text-xs font-semibold text-[#18201C] mb-2.5">
          Measured Structural Proportions
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
          <div className="flex items-baseline justify-between border-b border-[#F0EDE5] pb-1">
            <dt className="text-[#555E58]">Canopy height</dt>
            <dd className="font-mono font-medium text-[#18201C] tabular-nums">
              {metrics.canopyHeightM} m
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-b border-[#F0EDE5] pb-1">
            <dt className="text-[#555E58]">Clear stem</dt>
            <dd className="font-mono font-medium text-[#18201C] tabular-nums">
              {metrics.clearStemRatioPct}%
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-b border-[#F0EDE5] pb-1">
            <dt className="text-[#555E58]">Spread ratio</dt>
            <dd className="font-mono font-medium text-[#18201C] tabular-nums">
              {metrics.crownSpreadRatio}×
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-b border-[#F0EDE5] pb-1">
            <dt className="text-[#555E58]">Root depth</dt>
            <dd className="font-mono font-medium text-[#18201C] tabular-nums">
              {metrics.rootDepthM} m
            </dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="text-[#555E58]">Wind lean</dt>
            <dd className="font-mono font-medium text-[#18201C] tabular-nums">
              {metrics.windLeanDeg}°
            </dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="text-[#555E58]">Deadwood</dt>
            <dd className="font-mono font-medium text-[#18201C] tabular-nums">
              {metrics.deadwoodIndexPct}%
            </dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
