import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  FOSSITT_HABITATS,
  FossittHabitat,
  HABITAT_GROUPS,
  HabitatParameters,
} from '../data/fossittHabitats';
import { RenderMode, renderHabitatPlate } from '../engine/habitatRenderer';

export interface HabitatCanvasHandle {
  exportPng: () => void;
}

interface HabitatCanvasProps {
  habitat: FossittHabitat;
  params: HabitatParameters;
  mode: RenderMode;
  onModeChange: (mode: RenderMode) => void;
  compareCode: string | null;
  compareHabitat: FossittHabitat | null;
  onCompareCodeChange: (code: string | null) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  onResetIdeal: () => void;
}

export const HabitatCanvas = forwardRef<HabitatCanvasHandle, HabitatCanvasProps>(
  function HabitatCanvas(
    {
      habitat,
      params,
      mode,
      onModeChange,
      compareCode,
      compareHabitat,
      onCompareCodeChange,
      showLabels,
      onToggleLabels,
      onResetIdeal,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [size, setSize] = useState({ width: 880, height: 500 });

    // Smoothly interpolated parameters for fluid morphing when sliders/presets change
    const currentParamsRef = useRef<HabitatParameters>({ ...params });
    const targetParamsRef = useRef<HabitatParameters>({ ...params });
    const rafRef = useRef<number | null>(null);

    targetParamsRef.current = params;

    useImperativeHandle(ref, () => ({
      exportPng: () => {
        const exportCanvas = document.createElement('canvas');
        const exportW = 1600;
        const exportH = 920;
        exportCanvas.width = exportW;
        exportCanvas.height = exportH;
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) return;
        renderHabitatPlate(ctx, exportW, exportH, habitat, params, {
          mode,
          compareHabitat,
          showLabels,
          compact: false,
        });
        const link = document.createElement('a');
        link.download = `fossitt-${habitat.code.toLowerCase()}-section.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
      },
    }));

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const updateSize = () => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setSize({
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      };
      updateSize();
      const observer = new ResizeObserver(updateSize);
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size.width * dpr;
      canvas.height = size.height * dpr;

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const drawFrame = () => {
        const cur = currentParamsRef.current;
        const tgt = targetParamsRef.current;

        if (prefersReducedMotion) {
          currentParamsRef.current = { ...tgt };
        } else {
          const ease = 0.28;
          cur.light += (tgt.light - cur.light) * ease;
          cur.soil += (tgt.soil - cur.soil) * ease;
          cur.maturity += (tgt.maturity - cur.maturity) * ease;
          cur.exposure += (tgt.exposure - cur.exposure) * ease;
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderHabitatPlate(ctx, size.width, size.height, habitat, cur, {
          mode,
          compareHabitat,
          showLabels,
          compact: false,
        });

        const diff =
          Math.abs(cur.light - tgt.light) +
          Math.abs(cur.soil - tgt.soil) +
          Math.abs(cur.maturity - tgt.maturity) +
          Math.abs(cur.exposure - tgt.exposure);

        if (diff > 0.08 && !prefersReducedMotion) {
          rafRef.current = requestAnimationFrame(drawFrame);
        } else {
          currentParamsRef.current = { ...tgt };
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          renderHabitatPlate(ctx, size.width, size.height, habitat, tgt, {
            mode,
            compareHabitat,
            showLabels,
            compact: false,
          });
        }
      };

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(drawFrame);

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [habitat, params, mode, compareHabitat, showLabels, size]);

    return (
      <div className="flex flex-col bg-white border border-[#DCD9CF] rounded-lg overflow-hidden">
        {/* Drawing Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-[#E7E4DC] bg-[#FAF9F5]">
          <div className="flex items-center gap-1 p-0.5 bg-[#EBE9E2] rounded-md">
            {(
              [
                { id: 'textured', label: 'Textured Ink' },
                { id: 'xray', label: 'Structural X-Ray' },
                { id: 'strata', label: 'Strata & Light' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onModeChange(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  mode === item.id
                    ? 'bg-white text-[#18201C] shadow-xs'
                    : 'text-[#555E58] hover:text-[#18201C]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Compare habitat architectural form"
              value={compareCode ?? ''}
              onChange={(e) =>
                onCompareCodeChange(e.target.value ? e.target.value : null)
              }
              className={`px-3 py-1.5 text-xs font-medium rounded border max-w-[230px] truncate transition-colors cursor-pointer focus:outline-none ${
                compareCode
                  ? 'bg-[#2B5B78] text-white border-[#2B5B78]'
                  : 'bg-white text-[#3E4742] border-[#D6D3C9] hover:border-[#18201C]'
              }`}
            >
              <option value="" className="bg-white text-[#18201C]">
                Compare form: Off
              </option>
              {habitat.code !== 'WD5' && (
                <option value="WD5" className="bg-white text-[#18201C]">
                  WD5 · Parkland Form (Clear Stem)
                </option>
              )}
              {HABITAT_GROUPS.map((grp) => {
                const items = FOSSITT_HABITATS.filter(
                  (h) =>
                    h.group === grp.id &&
                    h.code !== habitat.code &&
                    h.code !== 'WD5'
                );
                if (items.length === 0) return null;
                return (
                  <optgroup
                    key={grp.id}
                    label={grp.label}
                    className="bg-white text-[#18201C]"
                  >
                    {items.map((h) => (
                      <option
                        key={h.code}
                        value={h.code}
                        className="bg-white text-[#18201C]"
                      >
                        {h.code} · {h.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>

            <button
              type="button"
              onClick={onToggleLabels}
              aria-pressed={showLabels}
              className={`px-3 py-1.5 text-xs font-medium rounded border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                showLabels
                  ? 'bg-[#18201C] text-white border-[#18201C]'
                  : 'bg-white text-[#3E4742] border-[#D6D3C9] hover:border-[#18201C]'
              }`}
            >
              Callouts
            </button>

            <button
              type="button"
              onClick={onResetIdeal}
              className="px-3 py-1.5 text-xs font-medium rounded border border-[#D6D3C9] bg-white text-[#3E4742] hover:border-[#18201C] hover:text-[#18201C] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* High-DPI Architectural Drafting Stage */}
        <div
          ref={containerRef}
          className="relative w-full h-[460px] lg:h-[520px] bg-[#F6F4EE]"
        >
          <canvas
            ref={canvasRef}
            className="block w-full h-full"
            aria-label={`Architectural cross-section of Fossitt habitat ${habitat.code} ${habitat.name}`}
          />
        </div>

        {/* Visual Form & Root Cue Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 py-3 border-t border-[#E7E4DC] bg-[#FAF9F5] text-xs">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[11px] font-medium text-[#2D5A3D] shrink-0">
              CANOPY FORM
            </span>
            <span className="text-[#3E4742]">{habitat.formCue}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[11px] font-medium text-[#5E4632] shrink-0">
              ROOTING PROFILE
            </span>
            <span className="text-[#3E4742]">{habitat.rootCue}</span>
          </div>
        </div>
      </div>
    );
  }
);
