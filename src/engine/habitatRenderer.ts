import {
  FossittHabitat,
  HabitatParameters,
  SpeciesArchetype,
  computeArchitectureMetrics,
} from '../data/fossittHabitats';

export type RenderMode = 'textured' | 'xray' | 'strata';

export interface RenderOptions {
  mode: RenderMode;
  compareHabitat?: FossittHabitat | null;
  showLabels: boolean;
  compact?: boolean;
}

// Deterministic Mulberry32 PRNG so tree skeletons morph smoothly instead of flickering
function createRng(seedStr: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function rng() {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface LabelPoint {
  x: number;
  y: number;
  text: string;
  subtext?: string;
  align: 'left' | 'right';
}

export function renderHabitatPlate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  habitat: FossittHabitat,
  params: HabitatParameters,
  options: RenderOptions
) {
  const { mode, compareHabitat = null, showLabels, compact = false } = options;
  const rng = createRng(habitat.code);
  const metrics = computeArchitectureMetrics(habitat, params);

  const lightN = params.light / 100;
  const soilN = params.soil / 100;
  const matN = params.maturity / 100;
  const expN = params.exposure / 100;

  // Palette (Architectural Vellum & Botanical Ink)
  const ink = '#18201C';
  const inkMuted = 'rgba(24, 32, 28, 0.55)';
  const inkFaint = 'rgba(24, 32, 28, 0.12)';
  const paperBg = '#F6F4EE';
  const earthInk = '#5E4632';
  const mossGreen = '#2D5A3D';
  const waterBlue = '#2B5B78';

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // 1. Archival Drafting Vellum Background
  ctx.fillStyle = paperBg;
  ctx.fillRect(0, 0, width, height);

  // Subtle atmospheric / sky gradient modulated by light & exposure
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.72);
  const skyWarmth = 0.04 + lightN * 0.08;
  skyGrad.addColorStop(0, `rgba(218, 226, 221, ${0.22 + expN * 0.16})`);
  skyGrad.addColorStop(0.65, `rgba(242, 238, 226, ${skyWarmth})`);
  skyGrad.addColorStop(1, 'rgba(246, 244, 238, 0)');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height * 0.75);

  // Coordinate System: Vertical scale adapts so both tall woodlands (22m) and low heaths/bogs (3m) read clearly
  const padLeft = compact ? 10 : 54;
  const padRight = compact ? 10 : 28;
  const padTop = compact ? 10 : 34;
  const padBottom = compact ? 8 : 34;

  const drawW = width - padLeft - padRight;
  const drawH = height - padTop - padBottom;

  // Ground datum sits at ~70% down the drawing area
  const groundY = padTop + drawH * 0.7;
  const subSurfaceDepthPx = drawH * 0.3; // represents -3.0m below datum
  const aboveGroundPx = drawH * 0.7;

  // Dynamic vertical scale in meters above ground: woodlands ~22m, scrub/dune ~9m, heath/bog/grassland ~4.5m
  const maxDisplayMeters =
    habitat.maxNaturalHeightM > 11
      ? 22
      : habitat.maxNaturalHeightM > 4.5
      ? 11
      : habitat.maxNaturalHeightM > 2.1
      ? 4.8
      : 3.0;

  const pxPerMeterY = aboveGroundPx / maxDisplayMeters;
  const pxPerMeterRoot = subSurfaceDepthPx / 3.0;
  const transectMeters = 20;
  const pxPerMeterX = drawW / transectMeters;

  // Terrain elevation function y(x) across the 20m transect
  const getTerrainY = (xPx: number): number => {
    const t = (xPx - padLeft) / drawW; // 0..1
    const base = groundY;
    if (habitat.substrate === 'limestone_pavement') {
      // Stepped clints and deep grykes
      const grykePositions = [0.16, 0.34, 0.51, 0.69, 0.85];
      for (const gp of grykePositions) {
        const dist = Math.abs(t - gp);
        if (dist < 0.018) {
          return base + (1 - dist / 0.018) * (24 + (1 - soilN) * 14);
        }
      }
      return base - Math.sin(t * Math.PI * 2) * 3;
    }
    if (habitat.code === 'WL1') {
      // Raised central earth bank with flanking drainage ditches
      const bank = Math.exp(-Math.pow((t - 0.5) / 0.13, 2)) * 26;
      const ditchL = Math.exp(-Math.pow((t - 0.3) / 0.055, 2)) * 18;
      const ditchR = Math.exp(-Math.pow((t - 0.7) / 0.055, 2)) * 18;
      return base - bank + ditchL + ditchR;
    }
    if (habitat.code === 'WN5') {
      // River margin sloping down into river channel on right
      const slope = t > 0.58 ? Math.pow((t - 0.58) / 0.42, 1.35) * 46 : Math.sin(t * 6) * 3;
      return base + slope;
    }
    if (habitat.code === 'CD2' || habitat.code === 'CD4') {
      // Asymmetric windward/leeward sand dune ridge
      const ridge = Math.exp(-Math.pow((t - 0.48) / 0.24, 2)) * (habitat.code === 'CD2' ? 38 : 26);
      const blowout = expN > 0.65 ? Math.exp(-Math.pow((t - 0.25) / 0.08, 2)) * 16 : 0;
      return base + 14 - ridge + blowout;
    }
    if (habitat.code === 'PB1') {
      // Raised bog dome + hummock-hollow microtopography
      const dome = Math.sin(t * Math.PI) * (14 + soilN * 14);
      const micro = Math.sin(t * Math.PI * 14) * (4 + soilN * 4);
      return base + 10 - dome + micro;
    }
    if (habitat.code === 'PB2' || habitat.code === 'PB3' || habitat.code === 'PF1') {
      // Hummock-hollow pools & peat haggs if soilN is low
      const hagg =
        soilN < 0.38 && (habitat.code === 'PB2' || habitat.code === 'PB3')
          ? (Math.sin(t * Math.PI * 8) > 0.2 ? -8 : 16)
          : Math.sin(t * Math.PI * 12) * 5;
      return base - Math.sin(t * Math.PI) * 8 + hagg;
    }
    if (habitat.code === 'FS1' || habitat.code === 'WN6') {
      // Shallow flooded basin with sedge pedestals
      const basin = Math.sin(t * Math.PI) * 14;
      return base + basin + Math.sin(t * 36) * 3;
    }
    // Gentle natural slope / undulating ground
    return base - Math.sin(t * Math.PI * 1.6) * 7 + Math.cos(t * 17) * 2.5;
  };

  // 2. Architectural Scale Grid & Elevation Datums (non-compact)
  if (!compact) {
    ctx.strokeStyle = 'rgba(24, 32, 28, 0.06)';
    ctx.lineWidth = 1;
    // Vertical 2m grid
    for (let m = 0; m <= transectMeters; m += 2) {
      const gx = padLeft + m * pxPerMeterX;
      ctx.beginPath();
      ctx.moveTo(gx, padTop);
      ctx.lineTo(gx, height - padBottom);
      ctx.stroke();
    }

    // Horizontal elevation lines
    const stepM = maxDisplayMeters > 12 ? 5 : maxDisplayMeters > 5 ? 2 : 1;
    ctx.font = '400 10px "IBM Plex Mono", monospace';
    ctx.fillStyle = inkMuted;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let m = 0; m <= maxDisplayMeters; m += stepM) {
      const gy = groundY - m * pxPerMeterY;
      ctx.strokeStyle = m === 0 ? 'rgba(24, 32, 28, 0.25)' : 'rgba(24, 32, 28, 0.06)';
      ctx.beginPath();
      ctx.moveTo(padLeft - 4, gy);
      ctx.lineTo(width - padRight, gy);
      ctx.stroke();
      ctx.fillText(m === 0 ? '0m' : `+${m}m`, padLeft - 8, gy);
    }

    // Subsurface depth ticks
    for (const dm of [1, 2]) {
      const gy = groundY + dm * pxPerMeterRoot;
      ctx.strokeStyle = 'rgba(24, 32, 28, 0.06)';
      ctx.beginPath();
      ctx.moveTo(padLeft - 4, gy);
      ctx.lineTo(width - padRight, gy);
      ctx.stroke();
      ctx.fillText(`-${dm}m`, padLeft - 8, gy);
    }

    // Horizontal transect bottom ruler
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let m = 0; m <= transectMeters; m += 5) {
      const gx = padLeft + m * pxPerMeterX;
      ctx.fillText(`${m}m`, gx, height - padBottom + 8);
    }
  }

  // 3. Wind-vector atmosphere streaks (when exposure > 45%)
  if (expN > 0.4 && !compact) {
    const windAlpha = (expN - 0.4) * 0.26;
    ctx.save();
    ctx.strokeStyle = `rgba(43, 91, 120, ${windAlpha})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([12, 10]);
    for (let i = 0; i < 6; i++) {
      const wy = padTop + 26 + i * ((groundY - padTop) * 0.14);
      const offset = (i * 43) % 80;
      ctx.beginPath();
      ctx.moveTo(padLeft + offset, wy);
      ctx.quadraticCurveTo(padLeft + drawW * 0.5, wy - 4 - expN * 6, padLeft + drawW - 20, wy + expN * 8);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Strata Light Beams (when mode === 'strata')
  if (mode === 'strata' && !compact) {
    ctx.save();
    const beamCount = 5;
    const beamOpacity = 0.05 + lightN * 0.13;
    for (let i = 0; i < beamCount; i++) {
      const bx = padLeft + drawW * (0.12 + i * 0.19);
      const beamW = 24 + lightN * 54;
      const grad = ctx.createLinearGradient(bx, padTop, bx + 60, groundY);
      grad.addColorStop(0, `rgba(217, 169, 64, ${beamOpacity})`);
      grad.addColorStop(1, 'rgba(217, 169, 64, 0.01)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(bx - beamW * 0.4, padTop);
      ctx.lineTo(bx + beamW * 0.6, padTop);
      ctx.lineTo(bx + beamW * 1.1 + 40, groundY);
      ctx.lineTo(bx - beamW * 0.2 + 40, groundY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 5. Subsurface Geological & Water Table Cut-Away
  const bottomY = height - padBottom;
  const waterTableDepthM = computeWaterTableDepth(habitat, soilN);
  const waterTableY = groundY + waterTableDepthM * pxPerMeterRoot;

  drawSubsurfaceProfile(
    ctx,
    padLeft,
    padLeft + drawW,
    groundY,
    bottomY,
    pxPerMeterRoot,
    habitat,
    soilN,
    waterTableY,
    getTerrainY,
    compact
  );

  // 6. Optional Comparison Habitat Dashed Silhouette (true-to-scale pedagogical foil)
  if (compareHabitat && compareHabitat.code !== habitat.code && !compact) {
    const compareMetrics = computeArchitectureMetrics(
      compareHabitat,
      compareHabitat.idealParams
    );
    const compareX = padLeft + drawW * 0.73;
    drawHabitatComparisonGhost(
      ctx,
      compareX,
      getTerrainY(compareX),
      compareHabitat,
      compareMetrics.canopyHeightM,
      pxPerMeterY,
      padTop,
      padLeft,
      padLeft + drawW
    );
  }

  // 7. Generate & Render Botanical Architecture
  const labels: LabelPoint[] = [];
  const treeScaleH = metrics.canopyHeightM * pxPerMeterY;

  // Build deterministic plant instances ordered back-to-front by stratum
  const specimens = buildHabitatSpecimens(habitat, params, metrics, padLeft, drawW, pxPerMeterY, rng);

  // First draw subterranean root systems into the geological cut-away
  for (const spec of specimens) {
    const ty = getTerrainY(spec.x);
    drawRootArchitecture(
      ctx,
      spec.x,
      ty,
      spec,
      habitat,
      metrics.rootDepthM * pxPerMeterRoot,
      soilN,
      matN,
      mode,
      rng
    );
  }

  // Draw fallen mossy deadwood nurse logs in mature/veteran woodlands
  if (habitat.group === 'W' && habitat.code !== 'WD5' && matN > 0.58) {
    const logX = padLeft + drawW * 0.38;
    const logY = getTerrainY(logX);
    drawFallenNurseLog(ctx, logX, logY, 44 + matN * 36, matN, mode);
    if (showLabels && !compact) {
      labels.push({
        x: logX + 12,
        y: logY - 6,
        text: 'Mossy nurse log',
        subtext: 'Decay microhabitat',
        align: 'left',
      });
    }
  }

  // Draw ground & bryophyte carpets
  drawGroundLayerTexture(
    ctx,
    padLeft,
    padLeft + drawW,
    getTerrainY,
    habitat,
    lightN,
    soilN,
    matN,
    expN,
    mode,
    rng
  );

  // Draw field / reed / tussock / bracken / heather specimens
  for (const spec of specimens) {
    if (spec.layer === 'field' || spec.layer === 'shrub') {
      const ty = getTerrainY(spec.x);
      drawBotanicalSpecimen(
        ctx,
        spec,
        ty,
        treeScaleH,
        pxPerMeterY,
        habitat,
        params,
        mode,
        compact
      );

      if (showLabels && !compact && spec.labelTag) {
        labels.push({
          x: spec.x + spec.leanShift * 0.45,
          y: Math.max(padTop + 18, ty - spec.actualHeightPx * 0.72),
          text: spec.species.common,
          subtext: `${spec.species.latin} (${spec.species.dominancePct}%)`,
          align: spec.x > padLeft + drawW * 0.55 ? 'right' : 'left',
        });
      }
    }
  }

  // Draw subcanopy and canopy trees
  for (const spec of specimens) {
    if (spec.layer === 'subcanopy' || spec.layer === 'canopy') {
      const ty = getTerrainY(spec.x);
      drawBotanicalSpecimen(
        ctx,
        spec,
        ty,
        treeScaleH,
        pxPerMeterY,
        habitat,
        params,
        mode,
        compact
      );

      if (showLabels && !compact && spec.labelTag) {
        labels.push({
          x: spec.x + spec.leanShift * 0.45,
          y: Math.max(padTop + 18, ty - spec.actualHeightPx * 0.72),
          text: spec.species.common,
          subtext: `${spec.species.latin} (${spec.species.dominancePct}%)`,
          align: spec.x > padLeft + drawW * 0.55 ? 'right' : 'left',
        });
      }
    }
  }

  // Draw standing deadwood snag in veteran semi-natural woodlands
  if (habitat.group === 'W' && habitat.code !== 'WD5' && habitat.code !== 'WS1' && matN > 0.68) {
    const snagX = padLeft + drawW * 0.83;
    const snagY = getTerrainY(snagX);
    drawStandingSnag(ctx, snagX, snagY, Math.min(treeScaleH * 0.62, 110), expN, mode);
    if (showLabels && !compact) {
      labels.push({
        x: snagX,
        y: snagY - Math.min(treeScaleH * 0.45, 78),
        text: 'Standing deadwood snag',
        subtext: 'Veteran structure',
        align: 'right',
      });
    }
  }

  // 8. Strata Overlay Bands (when mode === 'strata')
  if (mode === 'strata' && !compact) {
    drawStrataBands(ctx, padLeft, padLeft + drawW, groundY, treeScaleH, metrics, habitat);
  }

  // 9. Leader Callout Labels (when showLabels === true)
  if (showLabels && !compact) {
    // Add soil/water label
    labels.push({
      x: padLeft + drawW * 0.14,
      y: Math.min(bottomY - 14, waterTableY),
      text: `Water table (${waterTableDepthM.toFixed(1)}m)`,
      subtext: habitat.substrate.replace(/_/g, ' '),
      align: 'left',
    });
    drawArchitecturalLabels(ctx, labels, padLeft, padLeft + drawW, padTop, bottomY);
  }

  // 10. Crisp Architectural Border & Corner Title Block
  if (!compact) {
    ctx.strokeStyle = 'rgba(24, 32, 28, 0.24)';
    ctx.lineWidth = 1;
    ctx.strokeRect(padLeft, padTop, drawW, bottomY - padTop);

    // Wind direction indicator top-left inside frame
    const windStrength = Math.round(expN * 100);
    ctx.save();
    ctx.fillStyle = ink;
    ctx.font = '500 10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(
      `SW PREVAILING WIND ${windStrength}%`,
      padLeft + 12,
      padTop + 10
    );
    // Arrow
    const arrowLen = 22 + expN * 36;
    ctx.strokeStyle = expN > 0.55 ? waterBlue : inkMuted;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(padLeft + 12, padTop + 26);
    ctx.lineTo(padLeft + 12 + arrowLen, padTop + 26);
    ctx.lineTo(padLeft + 12 + arrowLen - 5, padTop + 23);
    ctx.moveTo(padLeft + 12 + arrowLen, padTop + 26);
    ctx.lineTo(padLeft + 12 + arrowLen - 5, padTop + 29);
    ctx.stroke();
    ctx.restore();

    // Top-right architectural plate stamp
    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = ink;
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.fillText(
      `${habitat.code} · ${habitat.name.toUpperCase()}`,
      padLeft + drawW - 12,
      padTop + 10
    );
    ctx.fillStyle = inkMuted;
    ctx.font = '400 10px "IBM Plex Mono", monospace';
    ctx.fillText(
      `CANOPY ${metrics.canopyHeightM}m  |  ROOT ${metrics.rootDepthM}m  |  CLEAR STEM ${metrics.clearStemRatioPct}%`,
      padLeft + drawW - 12,
      padTop + 25
    );
    ctx.restore();
  }

  ctx.restore();
}

function computeWaterTableDepth(habitat: FossittHabitat, soilN: number): number {
  switch (habitat.substrate) {
    case 'waterlogged_carr':
    case 'swamp_silt':
    case 'rich_fen_peat':
      return 0.18 - soilN * 0.45; // above or at ground surface
    case 'deep_raised_peat':
    case 'blanket_peat':
      return 0.65 - soilN * 0.62;
    case 'alluvial_gley':
    case 'river_margin':
      return 0.9 - soilN * 0.72;
    case 'dune_sand':
      return 2.4 - soilN * 1.4;
    case 'limestone_pavement':
    case 'montane_scree':
      return 2.6 - soilN * 0.6;
    default:
      return 2.1 - soilN * 1.1;
  }
}

function drawSubsurfaceProfile(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  groundY: number,
  bottomY: number,
  pxPerMeterRoot: number,
  habitat: FossittHabitat,
  soilN: number,
  waterTableY: number,
  getTerrainY: (x: number) => number,
  compact: boolean
) {
  const width = x1 - x0;
  const subH = bottomY - groundY;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, bottomY);
  for (let x = x0; x <= x1; x += 6) {
    ctx.lineTo(x, getTerrainY(x));
  }
  ctx.lineTo(x1, getTerrainY(x1));
  ctx.lineTo(x1, bottomY);
  ctx.closePath();
  ctx.clip();

  // Base earth tone per substrate
  const earthTone =
    habitat.substrate.includes('peat')
      ? '#4A3A2B'
      : habitat.substrate === 'dune_sand'
      ? '#D9CCA8'
      : habitat.substrate === 'limestone_pavement'
      ? '#B7B4AC'
      : habitat.substrate === 'acid_podzol'
      ? '#7C6955'
      : habitat.substrate === 'alluvial_gley' || habitat.substrate === 'swamp_silt'
      ? '#6D736B'
      : '#7E6B55';

  ctx.fillStyle = earthTone;
  ctx.globalAlpha = 0.24;
  ctx.fillRect(x0, groundY - 60, width, subH + 60);
  ctx.globalAlpha = 1;

  // Soil thickness vs Bedrock interface
  const soilThicknessPx =
    habitat.substrate.includes('peat')
      ? subH * (0.6 + soilN * 0.38)
      : habitat.substrate === 'limestone_pavement'
      ? subH * (0.08 + soilN * 0.28)
      : subH * (0.28 + soilN * 0.56);

  // Top organic / humus / acrotelm horizon
  ctx.fillStyle = habitat.substrate.includes('peat')
    ? 'rgba(66, 48, 32, 0.36)'
    : habitat.substrate === 'dune_sand'
    ? 'rgba(182, 164, 122, 0.25)'
    : 'rgba(58, 46, 35, 0.28)';
  ctx.beginPath();
  for (let x = x0; x <= x1; x += 6) {
    const ty = getTerrainY(x);
    if (x === x0) ctx.moveTo(x, ty);
    else ctx.lineTo(x, ty);
  }
  for (let x = x1; x >= x0; x -= 6) {
    const ty = getTerrainY(x) + 6 + soilN * 14;
    ctx.lineTo(x, ty);
  }
  ctx.closePath();
  ctx.fill();

  // Substrate architectural hatching
  if (habitat.substrate === 'limestone_pavement' || habitat.substrate === 'calcareous_loam') {
    // Draw blocky limestone strata below soilThicknessPx
    const rockStart = groundY + soilThicknessPx;
    ctx.strokeStyle = 'rgba(24, 32, 28, 0.28)';
    ctx.lineWidth = 1;
    const rowH = compact ? 10 : 15;
    for (let y = rockStart; y < bottomY; y += rowH) {
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
      const offset = ((Math.round((y - rockStart) / rowH) % 2) * 26);
      for (let x = x0 + offset; x < x1; x += 52) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, Math.min(bottomY, y + rowH));
        ctx.stroke();
      }
    }
  } else if (habitat.substrate.includes('peat')) {
    // Fibrous horizontal peat compression ticks
    ctx.strokeStyle = 'rgba(54, 38, 24, 0.28)';
    ctx.lineWidth = 1;
    for (let y = groundY + 12; y < bottomY; y += compact ? 7 : 10) {
      for (let x = x0 + ((y * 7) % 23); x < x1; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 12, y);
        ctx.stroke();
      }
    }
  } else if (habitat.substrate === 'dune_sand') {
    // Cross-bedded sand dune stipple dots & sweeping strata
    ctx.strokeStyle = 'rgba(130, 108, 70, 0.24)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const sy = groundY + i * 16;
      ctx.beginPath();
      ctx.moveTo(x0, sy);
      ctx.quadraticCurveTo(x0 + width * 0.5, sy - 14, x1, sy + 6);
      ctx.stroke();
    }
  } else {
    // Podzol / alluvial stipple & gravel stones
    ctx.fillStyle = 'rgba(24, 32, 28, 0.22)';
    for (let i = 0; i < (compact ? 45 : 140); i++) {
      const px = x0 + ((i * 73) % width);
      const py = groundY + 10 + ((i * 41) % Math.max(20, subH - 12));
      ctx.fillRect(px, py, 1.5, 1.5);
    }
    // Lower bedrock diagonal architectural hatching
    const rockStart = groundY + soilThicknessPx;
    ctx.strokeStyle = 'rgba(24, 32, 28, 0.18)';
    ctx.lineWidth = 1;
    for (let x = x0 - subH; x < x1; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, rockStart);
      ctx.lineTo(x + 36, bottomY);
      ctx.stroke();
    }
  }

  // Water table / flooded zone shading
  if (waterTableY < bottomY) {
    ctx.fillStyle = 'rgba(43, 91, 120, 0.14)';
    ctx.fillRect(x0, waterTableY, width, bottomY - waterTableY);
    ctx.strokeStyle = 'rgba(43, 91, 120, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x0, waterTableY);
    ctx.lineTo(x1, waterTableY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();

  // Standing open water pools above ground (e.g. WN5 river, WN6 carr pools, FS1 swamp, PB1/PB3 bog pools)
  if (waterTableY < groundY + 12) {
    ctx.save();
    for (let x = x0; x < x1 - 4; x += 4) {
      const ty = getTerrainY(x);
      if (ty > waterTableY) {
        ctx.fillStyle = 'rgba(43, 91, 120, 0.22)';
        ctx.fillRect(x, waterTableY, 4.5, ty - waterTableY);
        ctx.fillStyle = 'rgba(43, 91, 120, 0.72)';
        ctx.fillRect(x, waterTableY, 4.5, 1.5);
      }
    }
    ctx.restore();
  }

  // Crisp ground-line ink contour
  ctx.save();
  ctx.strokeStyle = '#18201C';
  ctx.lineWidth = compact ? 1.2 : 1.8;
  ctx.beginPath();
  for (let x = x0; x <= x1; x += 4) {
    const ty = getTerrainY(x);
    if (x === x0) ctx.moveTo(x, ty);
    else ctx.lineTo(x, ty);
  }
  ctx.stroke();
  ctx.restore();
}

interface SpecimenInstance {
  x: number;
  species: FossittHabitat['species'][number];
  layer: 'canopy' | 'subcanopy' | 'shrub' | 'field';
  actualHeightPx: number;
  crownWidthPx: number;
  clearStemFrac: number;
  multiStemCount: number;
  leanShift: number;
  seedOffset: number;
  labelTag?: boolean;
}

function pickWeightedSpecies(
  speciesList: FossittHabitat['species'],
  rng: () => number
): FossittHabitat['species'][number] {
  const total = speciesList.reduce((sum, s) => sum + Math.max(1, s.dominancePct), 0);
  let r = rng() * total;
  for (const s of speciesList) {
    r -= Math.max(1, s.dominancePct);
    if (r <= 0) return s;
  }
  return speciesList[0];
}

function sampleOrganicPositions(
  count: number,
  minFrac: number,
  maxFrac: number,
  clusterCenters: number[],
  clusterTightness: number,
  minSpacing: number,
  rng: () => number
): number[] {
  const positions: number[] = [];
  const span = maxFrac - minFrac;

  for (let i = 0; i < count; i++) {
    let candidate = minFrac + rng() * span;
    if (clusterCenters.length > 0 && rng() < 0.72) {
      const center = clusterCenters[Math.floor(rng() * clusterCenters.length)];
      // Triangular/Gaussian-like offset around grove/thicket center
      const offset = (rng() + rng() - 1) * clusterTightness;
      candidate = center + offset;
    }
    candidate = Math.min(maxFrac, Math.max(minFrac, candidate));

    // Gentle minimum trunk collision avoidance while preserving natural clumping and open glades
    if (minSpacing > 0) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const tooClose = positions.some((p) => Math.abs(p - candidate) < minSpacing);
        if (!tooClose) break;
        candidate = minFrac + rng() * span;
      }
    }
    positions.push(candidate);
  }

  return positions.sort((a, b) => a - b);
}

function buildHabitatSpecimens(
  habitat: FossittHabitat,
  params: HabitatParameters,
  metrics: ReturnType<typeof computeArchitectureMetrics>,
  padLeft: number,
  drawW: number,
  pxPerMeterY: number,
  rng: () => number
): SpecimenInstance[] {
  const lightN = params.light / 100;
  const soilN = params.soil / 100;
  const matN = params.maturity / 100;
  const expN = params.exposure / 100;

  const list: SpecimenInstance[] = [];

  const canopySpecies = habitat.species.filter((s) => s.stratum === 'canopy');
  const subSpecies = habitat.species.filter((s) => s.stratum === 'subcanopy');
  const shrubSpecies = habitat.species.filter((s) => s.stratum === 'shrub');
  const fieldSpecies = habitat.species.filter((s) => s.stratum === 'field');

  const sumPct = (arr: typeof canopySpecies) =>
    arr.reduce((acc, s) => acc + s.dominancePct, 0);

  const canopyShare = sumPct(canopySpecies);
  const subShare = sumPct(subSpecies);
  const shrubShare = sumPct(shrubSpecies);
  const fieldShare = sumPct(fieldSpecies);

  // Organic grove/thicket attractors along the 20m transect (creates realistic clumps & glades)
  const groveCount = lightN > 0.6 ? 2 : 3;
  const groveCenters: number[] = [];
  for (let g = 0; g < groveCount; g++) {
    groveCenters.push(0.12 + rng() * 0.76);
  }

  const grykeFracs = [0.16, 0.34, 0.51, 0.69, 0.85];
  const labeledSpecies = new Set<string>();

  // 1. Canopy trees (weighted by dominancePct, random clustered positions on transect)
  if (canopySpecies.length > 0) {
    const baseCount =
      habitat.code === 'WD5'
        ? 2
        : habitat.code === 'WL1'
        ? Math.max(1, Math.round(1 + matN * 1.4))
        : Math.max(
            2,
            Math.round((2.6 + (canopyShare / 100) * 3.8) * (1.18 - lightN * 0.42) + matN * 0.9)
          );

    const fracs =
      habitat.code === 'WD5'
        ? sampleOrganicPositions(baseCount, 0.14, 0.86, [], 0.1, 0.34, rng)
        : habitat.code === 'WL1'
        ? sampleOrganicPositions(baseCount, 0.41, 0.59, [0.5], 0.08, 0.09, rng)
        : habitat.code === 'WN5'
        ? sampleOrganicPositions(baseCount, 0.08, 0.64, [0.22, 0.52], 0.14, 0.06, rng)
        : sampleOrganicPositions(
            baseCount,
            0.07,
            0.93,
            groveCenters,
            0.14 + lightN * 0.08,
            0.055,
            rng
          );

    for (let i = 0; i < fracs.length; i++) {
      const sp = pickWeightedSpecies(canopySpecies, rng);
      const x = padLeft + drawW * fracs[i];
      const hFrac = 0.7 + rng() * 0.36;
      const actualHeightPx = Math.max(22, metrics.canopyHeightM * pxPerMeterY * hFrac);

      const multiStem =
        matN < 0.24
          ? habitat.multiStemTendency > 0.7 && matN > 0.14 && rng() > 0.55
            ? 2
            : 1
          : sp.archetype === 'willow_carr' ||
            sp.archetype === 'yew' ||
            sp.archetype === 'downy_birch'
          ? Math.max(
              1,
              Math.round(1 + matN * (habitat.multiStemTendency + expN * 0.35) * (2.5 + rng() * 2))
            )
          : habitat.code === 'WD5'
          ? 1
          : expN > 0.55 && matN > 0.45 && rng() > 0.35
          ? 2 + Math.round(rng())
          : matN > 0.55 && rng() > 0.74
          ? 2
          : 1;

      const shouldLabel = !labeledSpecies.has(sp.latin) && labeledSpecies.size < 2;
      if (shouldLabel) labeledSpecies.add(sp.latin);

      list.push({
        x,
        species: sp,
        layer: 'canopy',
        actualHeightPx,
        crownWidthPx: actualHeightPx * metrics.crownSpreadRatio * (0.7 + rng() * 0.42),
        clearStemFrac: (metrics.clearStemRatioPct / 100) * (0.75 + rng() * 0.45),
        multiStemCount: multiStem,
        leanShift:
          habitat.code === 'WN5' && fracs[i] > 0.45
            ? actualHeightPx * (0.28 + rng() * 0.25)
            : expN * actualHeightPx * (0.15 + rng() * 0.32),
        seedOffset: rng() * 10000,
        labelTag: shouldLabel,
      });
    }
  }

  // 2. Subcanopy trees (Holly, Hazel, Alder, Rowan) mixed by percentage & clustered organically
  if (subSpecies.length > 0) {
    const count = Math.max(
      1,
      Math.round((1.4 + (subShare / 100) * 14) * (0.65 + matN * 0.5) * (1 - expN * 0.25))
    );
    const fracs = sampleOrganicPositions(count, 0.05, 0.95, groveCenters, 0.16, 0.025, rng);

    for (let i = 0; i < fracs.length; i++) {
      const sp = pickWeightedSpecies(subSpecies, rng);
      const x = padLeft + drawW * fracs[i];
      const actualHeightPx = Math.max(
        14,
        metrics.canopyHeightM * pxPerMeterY * (0.32 + rng() * 0.34)
      );
      const isHazel = sp.archetype === 'hazel';
      const shouldLabel = !labeledSpecies.has(sp.latin) && labeledSpecies.size < 2;
      if (shouldLabel) labeledSpecies.add(sp.latin);

      const subMultiStem =
        matN < 0.24
          ? isHazel && matN > 0.12
            ? 2
            : 1
          : isHazel
          ? Math.max(2, Math.round(1.5 + matN * 6.5 + rng() * 2))
          : matN < 0.45
          ? 1
          : 1 + Math.round(rng() * 1.5);

      list.push({
        x,
        species: sp,
        layer: 'subcanopy',
        actualHeightPx,
        crownWidthPx: actualHeightPx * (isHazel ? 1.15 + rng() * 0.25 : 0.68 + rng() * 0.25),
        clearStemFrac: isHazel ? 0.05 : (0.16 + rng() * 0.12) * Math.min(1, matN * 1.6),
        multiStemCount: subMultiStem,
        leanShift: expN * actualHeightPx * (0.18 + rng() * 0.25),
        seedOffset: rng() * 10000,
        labelTag: shouldLabel,
      });
    }
  }

  // 3. Shrub layer (Scrub, Hedgerows, Heaths, Bogs, Burren crevices)
  if (shrubSpecies.length > 0) {
    const isHeathOrBog =
      habitat.group === 'H' || habitat.group === 'P' || habitat.group === 'E';
    const rawCount =
      habitat.code === 'WL1'
        ? Math.round(5 + matN * 3)
        : habitat.code === 'GS1'
        ? Math.max(1, Math.round((shrubShare / 100) * 12 * (0.6 + (1 - expN) * 0.5)))
        : isHeathOrBog
        ? Math.max(2, Math.round((3 + (shrubShare / 100) * 12) * (0.65 + matN * 0.55)))
        : Math.max(2, Math.round((2 + (shrubShare / 100) * 10) * (0.65 + lightN * 0.45)));

    let fracs: number[];
    if (habitat.code === 'WL1') {
      fracs = sampleOrganicPositions(rawCount, 0.37, 0.63, [0.5], 0.09, 0.02, rng);
    } else if (habitat.code === 'ER2') {
      // Anchor crevice shrubs randomly into limestone grykes
      fracs = Array.from({ length: rawCount }, () => {
        const g = grykeFracs[Math.floor(rng() * grykeFracs.length)];
        return Math.min(0.95, Math.max(0.05, g + (rng() - 0.5) * 0.02));
      }).sort((a, b) => a - b);
    } else {
      fracs = sampleOrganicPositions(rawCount, 0.05, 0.95, groveCenters, 0.15, 0.015, rng);
    }

    for (let i = 0; i < fracs.length; i++) {
      const sp = pickWeightedSpecies(shrubSpecies, rng);
      const x = padLeft + drawW * fracs[i];
      const heightM =
        habitat.group === 'W'
          ? Math.min(4.8, metrics.canopyHeightM * (0.38 + rng() * 0.42))
          : metrics.canopyHeightM * (0.55 + rng() * 0.5);
      const actualHeightPx = Math.max(9, heightM * pxPerMeterY);
      const shouldLabel =
        canopySpecies.length === 0 && !labeledSpecies.has(sp.latin) && labeledSpecies.size < 2;
      if (shouldLabel) labeledSpecies.add(sp.latin);

      const shrubStems =
        matN < 0.22
          ? 1 + (rng() > 0.65 ? 1 : 0)
          : Math.max(2, Math.round(1.5 + matN * 5.5 + rng() * 2));

      list.push({
        x,
        species: sp,
        layer: 'shrub',
        actualHeightPx,
        crownWidthPx:
          actualHeightPx * (0.35 + matN * 0.75 + lightN * 0.3 + expN * 0.3 + rng() * 0.2),
        clearStemFrac: 0.03,
        multiStemCount: shrubStems,
        leanShift: expN * actualHeightPx * (0.24 + rng() * 0.24),
        seedOffset: rng() * 10000,
        labelTag: shouldLabel,
      });
    }
  }

  // 4. Field layer (ferns, tussocks, reeds, marram, bracken, meadow grass)
  if (fieldSpecies.length > 0 && habitat.code !== 'WD5') {
    const count = Math.max(
      3,
      Math.round(
        (4 + (fieldShare / 100) * 14) *
          (0.65 + soilN * 0.4) *
          (habitat.group === 'W' ? 0.55 + lightN * 0.65 : 1.0)
      )
    );

    let fracs: number[];
    if (habitat.code === 'ER2') {
      fracs = Array.from({ length: count }, () => {
        const g = grykeFracs[Math.floor(rng() * grykeFracs.length)];
        return Math.min(0.95, Math.max(0.05, g + (rng() - 0.5) * 0.03));
      }).sort((a, b) => a - b);
    } else if (habitat.code === 'WN5') {
      fracs = sampleOrganicPositions(count, 0.45, 0.78, [0.62], 0.1, 0, rng);
    } else {
      fracs = sampleOrganicPositions(count, 0.04, 0.96, groveCenters, 0.16, 0, rng);
    }

    for (let i = 0; i < fracs.length; i++) {
      const sp = pickWeightedSpecies(fieldSpecies, rng);
      const x = padLeft + drawW * fracs[i];

      const fieldHeightM =
        sp.archetype === 'common_reed'
          ? (1.25 + matN * 1.65 * (1 - expN * 0.3)) * (0.78 + rng() * 0.42)
          : sp.archetype === 'bracken'
          ? (0.75 + matN * 1.15 * (1 - expN * 0.35)) * (0.8 + rng() * 0.35)
          : sp.archetype === 'marram_grass'
          ? (0.55 + matN * 0.68) * (0.75 + rng() * 0.45)
          : sp.archetype === 'tussock_sedge' ||
            sp.archetype === 'black_bog_rush' ||
            sp.archetype === 'soft_rush'
          ? (0.45 + matN * 0.85 * (0.6 + soilN * 0.5)) * (0.78 + rng() * 0.42)
          : (0.3 + lightN * 0.55 + matN * 0.35) * (0.75 + rng() * 0.45);

      const actualHeightPx = Math.max(8, fieldHeightM * pxPerMeterY);
      const shouldLabel =
        canopySpecies.length === 0 &&
        shrubSpecies.length === 0 &&
        !labeledSpecies.has(sp.latin) &&
        labeledSpecies.size < 2;
      if (shouldLabel) labeledSpecies.add(sp.latin);

      list.push({
        x,
        species: sp,
        layer: 'field',
        actualHeightPx,
        crownWidthPx: actualHeightPx * (1.15 + rng() * 0.3),
        clearStemFrac: 0,
        multiStemCount: 1,
        leanShift: expN * actualHeightPx * (0.3 + rng() * 0.25),
        seedOffset: rng() * 10000,
        labelTag: shouldLabel,
      });
    }
  }

  return list;
}

function drawRootArchitecture(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  spec: SpecimenInstance,
  habitat: FossittHabitat,
  maxRootPx: number,
  _soilN: number,
  matN: number,
  mode: RenderMode,
  _rng: () => number
) {
  if (
    spec.layer === 'field' &&
    spec.species.archetype !== 'marram_grass' &&
    spec.species.archetype !== 'bracken'
  ) {
    return;
  }

  const rootRng = createRng(`${habitat.code}_root_${Math.round(spec.seedOffset)}`);

  const isWetFlat =
    habitat.substrate === 'waterlogged_carr' ||
    habitat.substrate === 'deep_raised_peat' ||
    habitat.substrate === 'blanket_peat' ||
    habitat.substrate === 'alluvial_gley';

  const isGryke = habitat.substrate === 'limestone_pavement';

  ctx.save();
  ctx.strokeStyle = mode === 'xray' ? '#5E4632' : 'rgba(64, 46, 30, 0.74)';
  ctx.lineWidth = spec.layer === 'canopy' ? 1.8 : 1.1;

  const rootAgeScale = 0.28 + 0.72 * matN;
  const rootSpan =
    spec.layer === 'canopy'
      ? Math.max(10, Math.max(28 * rootAgeScale, spec.crownWidthPx * 0.48))
      : spec.species.archetype === 'marram_grass'
      ? 24 + 28 * matN
      : 10 + 14 * matN;

  const depth =
    spec.layer === 'canopy'
      ? Math.min(maxRootPx * (0.35 + matN * 0.65), 75)
      : spec.species.archetype === 'marram_grass'
      ? 24 + matN * 46
      : Math.min(maxRootPx * (0.25 + matN * 0.3), 34);

  const drawRootlet = (rx: number, ry: number, dx: number, dy: number, w: number) => {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.quadraticCurveTo(rx + dx * 0.45, ry + dy * 0.7, rx + dx, ry + dy);
    ctx.stroke();
  };

  if (isWetFlat) {
    // Shallow wide pancake / buttress root plate above anoxic layer with fine descending feeder roots
    const branches =
      matN < 0.24 ? 2 : spec.layer === 'canopy' ? Math.round(3 + matN * 4) : Math.round(2 + matN * 2);
    for (let i = 0; i < branches; i++) {
      const dir = i % 2 === 0 ? -1 : 1;
      const spread = rootSpan * (0.4 + (i / branches) * 0.85) * (0.85 + rootRng() * 0.3);
      const rDepth = Math.min(depth * 0.42, 8 + matN * 10 + rootRng() * 8);
      const ex = x + dir * spread;
      const ey = y + rDepth;
      ctx.lineWidth = spec.layer === 'canopy' ? 0.9 + matN * 0.7 : 0.85;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + dir * spread * 0.45, y + rDepth * 0.45, ex, ey);
      ctx.stroke();
      if (matN >= 0.24) {
        drawRootlet(x + dir * spread * 0.55, y + rDepth * 0.55, dir * 10, 8, 0.7);
        drawRootlet(ex, ey, dir * 12, 5, 0.6);
      }
    }
  } else if (isGryke) {
    // Fissure-hugging vertical roots snaking down limestone grykes
    const startI = matN < 0.24 ? 0 : -1;
    const endI = matN < 0.24 ? 0 : 1;
    for (let i = startI; i <= endI; i++) {
      const ex = x + i * 11;
      const ey = y + depth;
      ctx.lineWidth = 0.9 + matN * 0.5;
      ctx.beginPath();
      ctx.moveTo(x + i * 3, y);
      ctx.bezierCurveTo(
        x + i * 10,
        y + depth * 0.35,
        x + i * 3,
        y + depth * 0.7,
        ex,
        ey
      );
      ctx.stroke();
      if (matN >= 0.24) {
        drawRootlet(ex, ey * 0.4 + y * 0.6, i * 8, 12, 0.65);
      }
    }
  } else if (spec.species.archetype === 'marram_grass') {
    // Sand-binding horizontal + deep vertical rhizome lattice
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x - rootSpan * 0.6, y + 9);
    ctx.quadraticCurveTo(x, y + 13, x + rootSpan * 0.65, y + 10);
    ctx.moveTo(x, y);
    ctx.lineTo(x - 7, y + depth * 0.88);
    ctx.moveTo(x + 3, y);
    ctx.lineTo(x + 11, y + depth * 0.74);
    ctx.stroke();
    drawRootlet(x - 16, y + 11, -5, 16, 0.7);
    drawRootlet(x + 18, y + 11, 6, 15, 0.7);
  } else {
    // Deep branching sinker & lateral root architecture with secondary forks
    const branches =
      matN < 0.24 ? 2 : spec.layer === 'canopy' ? Math.round(3 + matN * 3) : Math.round(2 + matN);
    for (let i = 0; i < branches; i++) {
      const spread =
        ((i - (branches - 1) / 2) / Math.max(1, branches - 1)) * rootSpan * 1.45 +
        (rootRng() - 0.5) * 6;
      const rDepth = depth * (0.5 + (1 - Math.abs(spread) / (rootSpan + 4)) * 0.5);
      const midX = x + spread * 0.45;
      const midY = y + rDepth * 0.45;
      const ex = x + spread;
      const ey = y + rDepth;
      ctx.lineWidth = spec.layer === 'canopy' ? 0.9 + matN * 0.75 : 0.85;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(midX, midY, ex, ey);
      ctx.stroke();
      if (matN >= 0.24) {
        drawRootlet(midX, midY, spread * 0.25, rDepth * 0.45, 0.75);
        drawRootlet(ex, ey, spread * 0.2, 10, 0.6);
      }
    }
  }

  ctx.restore();
}

function drawGroundLayerTexture(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  getTerrainY: (x: number) => number,
  habitat: FossittHabitat,
  lightN: number,
  soilN: number,
  _matN: number,
  expN: number,
  mode: RenderMode,
  _rng: () => number
) {
  const groundRng = createRng(`${habitat.code}_ground_layer`);
  ctx.save();
  const isWet =
    habitat.substrate.includes('peat') ||
    habitat.substrate === 'waterlogged_carr' ||
    habitat.substrate === 'alluvial_gley';

  const density = habitat.code === 'WD5' ? 0.3 : 0.45 + lightN * 0.35 + soilN * 0.25;
  const step = Math.max(8, Math.round(18 - density * 8));

  for (let x = x0 + 4; x < x1 - 4; x += step) {
    const ty = getTerrainY(x);
    const r = groundRng();

    if (habitat.substrate.includes('peat') && r > 0.25) {
      // Sphagnum hummock cushions
      const cw = 12 + r * 18;
      const ch = 4 + soilN * 5;
      if (mode !== 'xray') {
        ctx.fillStyle = r > 0.65 ? 'rgba(138, 120, 62, 0.26)' : 'rgba(90, 128, 72, 0.26)';
        ctx.beginPath();
        ctx.ellipse(x, ty - ch * 0.3, cw * 0.5, ch, 0, Math.PI, 0);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(45, 90, 61, 0.58)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(x, ty, cw * 0.45, Math.PI, 0);
      ctx.stroke();
    } else if (habitat.code === 'ER2' || habitat.code === 'WN3') {
      // Bryophyte moss cushions & fern tufts in grykes
      ctx.strokeStyle = 'rgba(45, 90, 61, 0.65)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, ty, 5 + r * 5, Math.PI, 0);
      ctx.stroke();
    } else {
      // Fine herb/grass surface strokes leaned by wind
      const h = (habitat.code === 'WD5' ? 4 : 6 + r * 8) * (1 - expN * 0.35);
      const lean = expN * 6;
      ctx.strokeStyle = isWet ? 'rgba(45, 90, 61, 0.62)' : 'rgba(65, 95, 58, 0.58)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, ty);
      ctx.lineTo(x + lean - 2, ty - h);
      ctx.moveTo(x + 3, ty);
      ctx.lineTo(x + 3 + lean + 1, ty - h * 0.85);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBotanicalSpecimen(
  ctx: CanvasRenderingContext2D,
  spec: SpecimenInstance,
  groundY: number,
  _treeScaleH: number,
  _pxPerMeterY: number,
  habitat: FossittHabitat,
  params: HabitatParameters,
  mode: RenderMode,
  compact = false
) {
  const localRng = createRng(`${habitat.code}_${Math.round(spec.seedOffset)}`);
  const lightN = params.light / 100;
  const matN = params.maturity / 100;
  const expN = params.exposure / 100;
  const arch = spec.species.archetype;

  // Dispatch specialized herbaceous / dwarf-shrub / reed / tussock forms
  if (
    arch === 'common_reed' ||
    arch === 'marram_grass' ||
    arch === 'soft_rush' ||
    arch === 'tussock_sedge' ||
    arch === 'black_bog_rush' ||
    arch === 'cottongrass' ||
    arch === 'tall_meadow_grass' ||
    arch === 'fine_turf_grass' ||
    arch === 'bracken' ||
    arch === 'woodland_ferns'
  ) {
    drawHerbaceousArchitecture(ctx, spec, groundY, arch, expN, matN, mode, localRng);
    return;
  }

  if (arch === 'ling_heather' || arch === 'bell_heather' || arch === 'dwarf_willow') {
    drawDwarfShrubArchitecture(ctx, spec, groundY, arch, expN, matN, mode, localRng);
    return;
  }

  // Woody Trees & Shrubs: true developmental ontogeny from whip -> pole -> semi-mature -> veteran
  const h = spec.actualHeightPx;
  const stems = spec.multiStemCount;

  // Species-specific branching traits
  const isWillow = arch === 'willow_carr';
  const isYew = arch === 'yew';
  const isBirch = arch === 'downy_birch';
  const isOak = arch === 'sessile_oak' || arch === 'pedunculate_oak';
  const isAsh = arch === 'ash';
  const isPine = arch === 'scots_pine';
  const isThorny = arch === 'hawthorn_blackthorn' || arch === 'gorse';
  const isHolly = arch === 'holly';
  const isHazel = arch === 'hazel';
  const isAlder = arch === 'alder';
  const isRowan = arch === 'rowan';
  const isParkland = arch === 'sycamore_parkland';

  const barkColor = isBirch
    ? '#2E2E2A'
    : isYew
    ? '#6B3626'
    : isPine
    ? '#7F4A2E'
    : isAlder
    ? '#292420'
    : isHazel
    ? '#4E4133'
    : '#2F261F';

  // Light, translucent watercolor foliage tones so branch architecture always dominates
  const washColor = isYew
    ? 'rgba(28, 56, 38, 0.22)'
    : isHolly
    ? 'rgba(34, 72, 46, 0.20)'
    : isPine
    ? 'rgba(42, 74, 52, 0.19)'
    : isThorny
    ? 'rgba(68, 92, 54, 0.15)'
    : isWillow || isBirch
    ? 'rgba(84, 118, 68, 0.14)'
    : 'rgba(56, 94, 58, 0.16)';

  const stippleColor = isYew
    ? 'rgba(24, 52, 34, 0.42)'
    : isHolly
    ? 'rgba(30, 68, 42, 0.38)'
    : isPine
    ? 'rgba(38, 68, 46, 0.38)'
    : isThorny
    ? 'rgba(62, 88, 48, 0.34)'
    : isWillow || isBirch
    ? 'rgba(72, 108, 60, 0.30)'
    : 'rgba(48, 86, 52, 0.33)';

  // ONTOGENY PHASE 1: Whip / Seedling / Feathered Maiden (matN < 0.24)
  // Young trees do NOT look like miniature adult trees: slender upright flexible central whip,
  // 0 to a few short ascending lateral shoots ("feathers"), no broad crown, no fissures/buttresses.
  if (matN < 0.24) {
    const whipT = matN / 0.24; // 0..1 within whip/feathered stage
    ctx.save();
    ctx.lineCap = 'round';

    for (let s = 0; s < stems; s++) {
      const stemLean =
        (stems > 1 ? (s / (stems - 1) - 0.5) * 0.26 : (localRng() - 0.5) * 0.08) +
        expN * 0.34;
      const whipH = Math.max(12, h * (0.88 + localRng() * 0.24));
      const baseAngle = -Math.PI / 2 + stemLean;
      const tipX = spec.x + Math.cos(baseAngle) * whipH;
      const tipY = groundY + Math.sin(baseAngle) * whipH;
      const midX =
        spec.x + Math.cos(baseAngle) * whipH * 0.5 + (localRng() - 0.5) * whipH * 0.1;
      const midY = groundY + Math.sin(baseAngle) * whipH * 0.5;

      // Thin supple stem tapering upward
      ctx.strokeStyle = isBirch ? '#5B4C3F' : isYew ? '#6E4632' : '#4A3C2E';
      ctx.lineWidth = Math.max(1.0, Math.min(2.4, 1.05 + whipT * 1.15));
      ctx.beginPath();
      ctx.moveTo(spec.x, groundY);
      ctx.quadraticCurveTo(midX, midY, tipX, tipY);
      ctx.stroke();

      // Young twigs/feathers along upper stem (0-1 at very young 0-8%, 2-4 steeply ascending twigs up to 24%)
      const featherCount =
        matN < 0.08 ? (localRng() > 0.55 ? 1 : 0) : Math.round(1 + whipT * 3 + localRng());
      const featherTips: Array<{ x: number; y: number; a: number }> = [
        { x: tipX, y: tipY, a: baseAngle },
      ];

      for (let f = 0; f < featherCount; f++) {
        const t = 0.42 + (f / Math.max(1, featherCount)) * 0.45 + (localRng() - 0.5) * 0.08;
        const omt = 1 - t;
        const sx = omt * omt * spec.x + 2 * omt * t * midX + t * t * tipX;
        const sy = omt * omt * groundY + 2 * omt * t * midY + t * t * tipY;
        const side = f % 2 === 0 ? -1 : 1;
        // Steep ascending juvenile branch angle (20-35 deg from leader)
        const fAngle = baseAngle + side * (0.34 + localRng() * 0.24) + expN * 0.15;
        const fLen = whipH * (0.14 + whipT * 0.18) * (1 - t * 0.35);
        const fx = sx + Math.cos(fAngle) * fLen;
        const fy = sy + Math.sin(fAngle) * fLen;

        ctx.strokeStyle = '#4A3C2E';
        ctx.lineWidth = 0.85;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(fx, fy);
        ctx.stroke();

        featherTips.push({ x: fx, y: fy, a: fAngle });

        // Occasional single secondary twiglet only near upper end of feathered stage (matN > 0.16)
        if (matN > 0.16 && localRng() > 0.5) {
          const sfAngle = fAngle + side * 0.35;
          const sfx = fx + Math.cos(sfAngle) * fLen * 0.45;
          const sfy = fy + Math.sin(sfAngle) * fLen * 0.45;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(sfx, sfy);
          ctx.stroke();
          featherTips.push({ x: sfx, y: sfy, a: sfAngle });
        }
      }

      // Sparse buds / delicate juvenile leaves at leader tip and feather shoots (never a canopy blob)
      if (mode !== 'xray') {
        ctx.fillStyle = stippleColor;
        for (const ft of featherTips) {
          const leaves = matN < 0.1 ? 2 : 3;
          for (let lf = 0; lf < leaves; lf++) {
            const la = ft.a + (lf - 1) * 0.5 + (localRng() - 0.5) * 0.3;
            const lx = ft.x + Math.cos(la) * (2.2 + localRng() * 2.5);
            const ly = ft.y + Math.sin(la) * (2.2 + localRng() * 2.5);
            ctx.beginPath();
            ctx.ellipse(lx, ly, 2.2, 1.2, la, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    ctx.restore();
    return;
  }

  // ONTOGENY PHASES 2–4: Pole Sapling (0.24..0.52) -> Semi-Mature (0.52..0.78) -> Veteran (0.78..1.0)
  const isPole = matN < 0.52;
  const isVeteran = matN >= 0.76;
  const ontogenyT = Math.min(1, Math.max(0, (matN - 0.24) / 0.76)); // 0 at young pole, 1 at veteran

  // Slender juvenile pole trunks thicken substantially into veteran boles
  const trunkBaseW = Math.max(
    1.5,
    Math.min(13.5, (h * (0.022 + ontogenyT * 0.048)) / Math.sqrt(stems))
  );

  interface BranchSeg {
    p0x: number;
    p0y: number;
    p1x: number;
    p1y: number;
    p2x: number;
    p2y: number;
    p3x: number;
    p3y: number;
    thickness: number;
    depth: number;
    dead: boolean;
  }

  interface TwigTip {
    x: number;
    y: number;
    angle: number;
    scale: number;
    isNeedle: boolean;
  }

  interface BackWash {
    x: number;
    y: number;
    rx: number;
    ry: number;
    rot: number;
  }

  const branchSegs: BranchSeg[] = [];
  const deadStubs: Array<{ x1: number; y1: number; x2: number; y2: number; w: number }> = [];
  const thorns: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const twigTips: TwigTip[] = [];
  const backWashes: BackWash[] = [];

  // Branching depth increases genuinely with age:
  // Pole (0.24..0.42) -> depth 2..3; Semi-mature (0.52..0.76) -> depth 4; Veteran -> depth 5
  const ageMaxDepth =
    matN < 0.36 ? 2 : matN < 0.54 ? 3 : matN < 0.75 ? 4 : spec.layer === 'canopy' ? 5 : 4;
  const maxDepth = compact ? Math.min(3, ageMaxDepth) : ageMaxDepth;

  // Young pole trees are straighter and more monopodial; gnarled crooks accumulate with maturity
  const baseCrookedness =
    isOak || isThorny || isYew
      ? 0.28 + expN * 0.24
      : isParkland
      ? 0.04
      : isHazel || isBirch
      ? 0.14 + expN * 0.2
      : 0.18 + expN * 0.2;
  const crookedness = baseCrookedness * (0.35 + 0.85 * ontogenyT);

  const generateBranch = (
    bx: number,
    by: number,
    len: number,
    angle: number,
    thickness: number,
    depth: number,
    isDeadLimb: boolean,
    isLeader: boolean
  ) => {
    if (depth > maxDepth || len < 2.6) {
      if (!isDeadLimb) {
        twigTips.push({
          x: bx,
          y: by,
          angle,
          scale: Math.max(0.55, Math.min(1.4, h / 110)),
          isNeedle: isPine || isYew || isThorny,
        });
      }
      return;
    }

    // Wind flagging pushes outer limbs leeward; willow & mature yew/birch droop subtly on outer tiers
    const windPull = expN * (isParkland ? 0.05 : 0.34) * (depth * 0.28);
    const droopPull =
      ontogenyT > 0.35 && ((isWillow && depth >= 2) || (isBirch && depth >= 4) || (isYew && depth >= 3))
        ? 0.14 * (depth - 1) * ontogenyT
        : 0;
    const effectiveAngle =
      angle + (Math.cos(angle) > -0.2 ? windPull : windPull * 1.35) + droopPull;

    // Articulated 3-segment limb path
    const j1 = (localRng() - 0.5) * len * crookedness * 0.65;
    const j2 = (localRng() - 0.5) * len * crookedness * 0.75;
    const perpX = -Math.sin(effectiveAngle);
    const perpY = Math.cos(effectiveAngle);

    const p1x = bx + Math.cos(effectiveAngle) * len * 0.34 + perpX * j1;
    const p1y = by + Math.sin(effectiveAngle) * len * 0.34 + perpY * j1;
    const p2x = bx + Math.cos(effectiveAngle) * len * 0.68 + perpX * j2;
    const p2y = by + Math.sin(effectiveAngle) * len * 0.68 + perpY * j2;
    const endX = bx + Math.cos(effectiveAngle) * len;
    const endY = by + Math.sin(effectiveAngle) * len;

    branchSegs.push({
      p0x: bx,
      p0y: by,
      p1x,
      p1y,
      p2x,
      p2y,
      p3x: endX,
      p3y: endY,
      thickness,
      depth,
      dead: isDeadLimb,
    });

    // Self-pruned dead shaded stubs along lower trunks (only once canopy competition / maturity > 0.42)
    if (depth === 0 && !isParkland && matN > 0.42 && (lightN < 0.62 || matN > 0.55)) {
      const stubCount = 1 + (matN > 0.68 && localRng() > 0.4 ? 1 : 0);
      for (let st = 0; st < stubCount; st++) {
        const t = 0.32 + localRng() * 0.48;
        const sx = bx + (endX - bx) * t;
        const sy = by + (endY - by) * t;
        const side = localRng() > 0.5 ? 1 : -1;
        const stubLen = Math.max(4, h * (0.04 + localRng() * 0.05) * ontogenyT);
        deadStubs.push({
          x1: sx,
          y1: sy,
          x2: sx + side * stubLen * (0.85 + expN * 0.3),
          y2: sy - stubLen * 0.25 + localRng() * 4,
          w: Math.max(0.85, thickness * 0.32),
        });
      }
    }

    // Epicormic water sprouts on mature oak trunks or leaning willow trunks
    if (depth === 0 && ((isOak && matN > 0.62) || (isWillow && matN > 0.45)) && !compact) {
      const sproutCount = isWillow ? 2 : 1;
      for (let spIdx = 0; spIdx < sproutCount; spIdx++) {
        const t = 0.45 + localRng() * 0.38;
        const sx = bx + (endX - bx) * t;
        const sy = by + (endY - by) * t;
        const sproutAngle = isWillow
          ? -Math.PI / 2 + (localRng() - 0.5) * 0.35 + expN * 0.2
          : effectiveAngle + (localRng() > 0.5 ? 0.85 : -0.85);
        generateBranch(
          sx,
          sy,
          len * 0.35,
          sproutAngle,
          Math.max(0.85, thickness * 0.3),
          Math.max(2, maxDepth - 1),
          false,
          false
        );
      }
    }

    // Lateral spur / thorn shoots for Hawthorn, Blackthorn, and Gorse
    if (isThorny && depth >= 1 && depth <= 3 && matN > 0.32 && !compact) {
      const spineDir = localRng() > 0.5 ? 1 : -1;
      const spineAngle = effectiveAngle + spineDir * (0.9 + localRng() * 0.35);
      const spineLen = Math.max(3.5, Math.min(8, len * 0.35));
      thorns.push({
        x1: p2x,
        y1: p2y,
        x2: p2x + Math.cos(spineAngle) * spineLen,
        y2: p2y + Math.sin(spineAngle) * spineLen,
      });
    }

    // Very light distant watercolor tint at penultimate twig zones (kept behind branches!)
    if (!isDeadLimb && depth === maxDepth - 1 && mode !== 'xray') {
      backWashes.push({
        x: endX,
        y: endY,
        rx: Math.max(4, len * (isPine ? 0.9 : 0.68)),
        ry: Math.max(3, len * (isYew || isPine ? 0.34 : 0.44)),
        rot: effectiveAngle + Math.PI / 2,
      });
    }

    // Branch fork count & angular spread scale genuinely with maturity (pole = apical, veteran = sympodial)
    let branchCount = 2;
    if (depth === 0) {
      branchCount = isParkland
        ? 3
        : isHazel
        ? 2
        : isPole
        ? 3 // strong central leader + 2 ascending side limbs
        : isOak || isAsh
        ? 3
        : 2 + (localRng() > 0.45 ? 1 : 0);
    } else if (depth === 1) {
      branchCount = isPole
        ? 2
        : isOak || isThorny || isYew
        ? 3
        : 2 + (localRng() > 0.55 ? 1 : 0);
    } else if (depth === 2 && !compact && !isPole) {
      branchCount = localRng() > 0.45 ? 3 : 2;
    }

    const baseSpreadFactor = isOak
      ? 0.72
      : isAsh
      ? 0.34
      : isHolly
      ? 0.52
      : isYew
      ? 0.88
      : isThorny
      ? 0.68
      : isPine
      ? 0.62
      : isRowan
      ? 0.42
      : 0.52;

    // Pole trees hold steeply ascending branches; mature/veteran trees spread wide
    const spreadFactor = baseSpreadFactor * (0.42 + 0.72 * ontogenyT);

    // Scots pine sheds lower boughs along mid-trunk, forming flat upper umbrella tiers
    const childStartT = isPine && depth === 0 ? 0.95 : depth === 0 ? 0.72 : 0.85;

    for (let b = 0; b < branchCount; b++) {
      // Strong monopodial central leader preservation during pole & early semi-mature stages
      const keepCentralLeader = isLeader && isPole && b === Math.floor(branchCount / 2);
      const forkRatio = branchCount === 1 ? 0 : (b / (branchCount - 1) - 0.5) * 2;
      const offset = keepCentralLeader
        ? (localRng() - 0.5) * 0.14
        : forkRatio * spreadFactor + (localRng() - 0.5) * 0.24;
      const childAngle = effectiveAngle + offset;

      // Windward branch abortion under heavy Atlantic gales
      if (expN > 0.6 && Math.cos(childAngle) < -0.5 && depth >= 1 && localRng() > 0.25) {
        continue;
      }

      // Attach some lateral scaffold limbs along trunk/mid-limb in pole & mature forms
      const attachAtMid =
        (isPole && depth === 0 && !keepCentralLeader) ||
        (depth <= 2 && b === 0 && branchCount >= 3 && !isPine && !keepCentralLeader);
      const spawnX = attachAtMid ? p2x : childStartT < 0.9 ? p2x : endX;
      const spawnY = attachAtMid ? p2y : childStartT < 0.9 ? p2y : endY;

      const stagDead =
        isDeadLimb ||
        (!isParkland &&
          isVeteran &&
          depth === 1 &&
          b === 0 &&
          (isOak || isAsh || isPine) &&
          localRng() > 0.62);

      const lenScale = keepCentralLeader
        ? 0.72
        : isPole
        ? 0.52
        : isOak
        ? 0.66
        : isPine
        ? 0.58
        : isHazel
        ? 0.7
        : isThorny
        ? 0.62
        : 0.65;
      const nextLen = len * lenScale * (0.78 + localRng() * 0.34);
      generateBranch(
        spawnX,
        spawnY,
        nextLen,
        childAngle,
        Math.max(0.55, thickness * (keepCentralLeader ? 0.68 : 0.58)),
        depth + 1,
        stagDead,
        keepCentralLeader
      );
    }
  };

  for (let s = 0; s < stems; s++) {
    const stemSpread =
      stems === 1
        ? (localRng() - 0.5) * (isPole ? 0.08 : 0.14)
        : (s / (stems - 1) - 0.5) *
            ((isWillow ? 1.05 : isHazel ? 0.92 : 0.62) * (0.48 + 0.6 * ontogenyT)) +
          (localRng() - 0.5) * 0.1;
    const baseAngle = -Math.PI / 2 + stemSpread + expN * (isParkland ? 0.08 : 0.42);
    const stemLen =
      h *
      (isPine ? 0.52 : isPole ? 0.44 : 0.32 + spec.clearStemFrac * 0.44) *
      (0.82 + localRng() * 0.3);

    generateBranch(spec.x, groundY, stemLen, baseAngle, trunkBaseW, 0, false, true);
  }

  ctx.save();

  // PASS 1: Subtle translucent canopy aura BEHIND branches (never hides woody structure!)
  if (mode !== 'xray') {
    ctx.fillStyle = washColor;
    for (const w of backWashes) {
      ctx.beginPath();
      ctx.ellipse(w.x, w.y, w.rx, w.ry, w.rot, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // X-Ray mode: dashed crown bounding hull
    if (twigTips.length > 2) {
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (const t of twigTips) {
        minX = Math.min(minX, t.x - 6);
        maxX = Math.max(maxX, t.x + 6);
        minY = Math.min(minY, t.y - 6);
        maxY = Math.max(maxY, t.y + 6);
      }
      ctx.strokeStyle = 'rgba(45, 90, 61, 0.38)';
      ctx.lineWidth = 0.9;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(
        (minX + maxX) / 2,
        (minY + maxY) / 2,
        Math.max(8, (maxX - minX) / 2),
        Math.max(6, (maxY - minY) / 2),
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // PASS 2: Crisp articulated branching skeleton, bark fissures, deadwood stubs, & thorns
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const seg of branchSegs) {
    ctx.strokeStyle = seg.dead
      ? '#7A7265'
      : isBirch && seg.depth <= 1
      ? '#363631'
      : barkColor;
    ctx.lineWidth = Math.max(0.55, seg.thickness);
    ctx.beginPath();
    ctx.moveTo(seg.p0x, seg.p0y);
    ctx.bezierCurveTo(seg.p1x, seg.p1y, seg.p2x, seg.p2y, seg.p3x, seg.p3y);
    ctx.stroke();

    // Bark character details on mature/semi-mature trunks & primary boughs
    if (!seg.dead && seg.depth <= 1 && seg.thickness >= 2.1 && !compact) {
      if (isBirch) {
        // Creamy-white birch bark with dark horizontal lenticel dashes (develops as bark matures)
        ctx.strokeStyle = '#ECEAE2';
        ctx.lineWidth = Math.max(0.9, seg.thickness - 1.2);
        ctx.beginPath();
        ctx.moveTo(seg.p0x, seg.p0y);
        ctx.bezierCurveTo(seg.p1x, seg.p1y, seg.p2x, seg.p2y, seg.p3x, seg.p3y);
        ctx.stroke();

        ctx.strokeStyle = '#2B2B27';
        ctx.lineWidth = 0.7;
        for (let k = 0.18; k <= 0.85; k += 0.16) {
          const lx = seg.p0x + (seg.p3x - seg.p0x) * k;
          const ly = seg.p0y + (seg.p3y - seg.p0y) * k;
          ctx.beginPath();
          ctx.moveTo(lx - seg.thickness * 0.35, ly);
          ctx.lineTo(lx + seg.thickness * 0.35, ly + 0.5);
          ctx.stroke();
        }
      } else if (seg.thickness >= 3.4 && ontogenyT > 0.35) {
        // Fine longitudinal bark fissure linework for mature oak, ash, yew, alder, pine
        ctx.strokeStyle = isYew
          ? 'rgba(165, 92, 62, 0.55)'
          : isPine
          ? 'rgba(182, 108, 66, 0.5)'
          : 'rgba(24, 20, 16, 0.42)';
        ctx.lineWidth = 0.65;
        ctx.beginPath();
        ctx.moveTo(seg.p0x + 1, seg.p0y - 2);
        ctx.quadraticCurveTo(
          (seg.p1x + seg.p2x) * 0.5 + 1,
          (seg.p1y + seg.p2y) * 0.5,
          seg.p3x + 0.5,
          seg.p3y
        );
        ctx.stroke();
      }
    }

    // Root collar buttress flare develops with trunk thickening (semi-mature & veteran)
    if (seg.depth === 0 && ontogenyT > 0.38) {
      const flare = Math.min(1, (ontogenyT - 0.38) / 0.4);
      ctx.strokeStyle = barkColor;
      ctx.lineWidth = Math.max(0.85, seg.thickness * 0.42 * flare);
      ctx.beginPath();
      ctx.moveTo(seg.p0x - seg.thickness * (0.65 + 0.35 * flare), seg.p0y);
      ctx.quadraticCurveTo(seg.p0x - seg.thickness * 0.3, seg.p0y - 4, seg.p0x, seg.p0y - 9 * flare);
      ctx.moveTo(seg.p0x + seg.thickness * (0.65 + 0.35 * flare), seg.p0y);
      ctx.quadraticCurveTo(seg.p0x + seg.thickness * 0.3, seg.p0y - 4, seg.p0x, seg.p0y - 9 * flare);
      ctx.stroke();
    }
  }

  // Self-pruned dead lower stubs
  if (deadStubs.length > 0) {
    ctx.strokeStyle = '#6E675B';
    for (const st of deadStubs) {
      ctx.lineWidth = st.w;
      ctx.beginPath();
      ctx.moveTo(st.x1, st.y1);
      ctx.lineTo(st.x2, st.y2);
      ctx.stroke();
    }
  }

  // Sharp hawthorn / blackthorn / gorse spines
  if (thorns.length > 0) {
    ctx.strokeStyle = '#382C21';
    ctx.lineWidth = 0.75;
    for (const th of thorns) {
      ctx.beginPath();
      ctx.moveTo(th.x1, th.y1);
      ctx.lineTo(th.x2, th.y2);
      ctx.stroke();
    }
  }

  // PASS 3: Airy, delicate leaf/needle stipples at terminal twig tips (never obscures branches!)
  if (mode !== 'xray') {
    ctx.fillStyle = stippleColor;
    ctx.strokeStyle = 'rgba(24, 32, 28, 0.34)';
    ctx.lineWidth = 0.65;

    for (const tip of twigTips) {
      const leafCount = tip.isNeedle ? 4 : 3;
      for (let lf = 0; lf < leafCount; lf++) {
        const a = tip.angle + (lf - 1) * 0.55 + (localRng() - 0.5) * 0.4;
        const dist = (2 + localRng() * 5.5) * tip.scale;
        const lx = tip.x + Math.cos(a) * dist;
        const ly = tip.y + Math.sin(a) * dist;

        if (tip.isNeedle) {
          // Crisp short pine/yew/gorse needle ticks
          ctx.beginPath();
          ctx.moveTo(tip.x, tip.y);
          ctx.lineTo(lx, ly);
          ctx.stroke();
        } else {
          // Small dappled leaf cluster fleck (2-4px), keeping gaps & light open
          const rx = (2.1 + localRng() * 2.2) * tip.scale;
          const ry = (1.3 + localRng() * 1.4) * tip.scale;
          ctx.beginPath();
          ctx.ellipse(lx, ly, rx, ry, a, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  ctx.restore();
}

function drawHerbaceousArchitecture(
  ctx: CanvasRenderingContext2D,
  spec: SpecimenInstance,
  groundY: number,
  arch: SpeciesArchetype,
  expN: number,
  matN: number,
  mode: RenderMode,
  rng: () => number
) {
  const h = spec.actualHeightPx;
  const x = spec.x;
  const lean = spec.leanShift;

  ctx.save();
  if (arch === 'common_reed') {
    // Tall jointed culms scale from few slender young shoots to dense plumed stands
    const culms = Math.max(3, Math.round(3 + matN * 6));
    for (let i = 0; i < culms; i++) {
      const cx = x + (i - (culms - 1) / 2) * 3.2 + (rng() - 0.5) * 2;
      const ch = h * (0.68 + rng() * 0.42);
      const topX = cx + lean;
      const topY = groundY - ch;
      ctx.strokeStyle = mode === 'xray' ? '#18201C' : '#586944';
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(cx, groundY);
      ctx.quadraticCurveTo(cx + lean * 0.3, groundY - ch * 0.6, topX, topY);
      ctx.stroke();

      // Alternating narrow reed blades
      for (const nt of [0.35, 0.58, 0.78]) {
        const nx = cx + lean * nt * 0.6;
        const ny = groundY - ch * nt;
        const dir = (i + Math.round(nt * 10)) % 2 === 0 ? 1 : -1;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.quadraticCurveTo(nx + dir * 8 + lean * 0.2, ny - 5, nx + dir * 13 + lean * 0.35, ny + 1);
        ctx.stroke();
      }

      // Feathered plume head develops in mature stands
      if (matN > 0.35 && mode !== 'xray') {
        ctx.strokeStyle = 'rgba(116, 94, 68, 0.78)';
        ctx.lineWidth = 0.85;
        for (let p = 0; p < 5; p++) {
          ctx.beginPath();
          ctx.moveTo(topX, topY - p * 1.5);
          ctx.lineTo(topX + (p % 2 === 0 ? 3.5 : -2) + expN * 3, topY - p * 1.8 - 4);
          ctx.stroke();
        }
      }
    }
  } else if (arch === 'tussock_sedge' || arch === 'black_bog_rush' || arch === 'soft_rush') {
    // Tussock pedestals accumulate only over decades (zero pedestal at pioneer stage)
    const pedFactor = Math.max(0, (matN - 0.22) / 0.78);
    const pedH =
      pedFactor <= 0
        ? 0
        : (arch === 'tussock_sedge' ? Math.min(28, h * 0.42) : Math.min(11, h * 0.22)) * pedFactor;
    if (pedH > 2) {
      if (mode !== 'xray') {
        ctx.fillStyle = 'rgba(78, 60, 40, 0.34)';
        ctx.beginPath();
        ctx.ellipse(x, groundY - pedH * 0.4, 11 * pedFactor + 3, pedH * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(58, 44, 30, 0.65)';
      ctx.lineWidth = 0.85;
      for (let k = -3; k <= 3; k++) {
        ctx.beginPath();
        ctx.moveTo(x + k * 2.5, groundY);
        ctx.quadraticCurveTo(x + k * 3.5, groundY - pedH * 0.5, x + k * 1.8, groundY - pedH);
        ctx.stroke();
      }
    }

    const blades = Math.max(5, Math.round(5 + matN * 13));
    for (let i = 0; i < blades; i++) {
      const spread = (i / (blades - 1) - 0.5) * (1.2 + matN * 1.2) + (rng() - 0.5) * 0.2;
      const bh = h * (0.62 + rng() * 0.42);
      ctx.strokeStyle = arch === 'black_bog_rush' ? '#364A32' : '#2D5A3D';
      ctx.lineWidth = 0.95;
      ctx.beginPath();
      ctx.moveTo(x + spread * 4, groundY - pedH * 0.65);
      ctx.quadraticCurveTo(
        x + spread * 11 + lean * 0.5,
        groundY - bh * 0.88,
        x + spread * 20 + lean,
        groundY - bh * (0.52 + rng() * 0.25)
      );
      ctx.stroke();
    }
  } else if (arch === 'marram_grass') {
    // Sand-binding arching tufts + dry basal straw collar on older clumps
    if (matN > 0.35) {
      ctx.strokeStyle = '#9C8A62';
      ctx.lineWidth = 0.9;
      for (let j = -3; j <= 3; j++) {
        ctx.beginPath();
        ctx.moveTo(x + j * 2, groundY);
        ctx.lineTo(x + j * 4 + lean * 0.2, groundY - h * 0.28);
        ctx.stroke();
      }
    }
    const blades = Math.max(5, Math.round(5 + matN * 12));
    for (let i = 0; i < blades; i++) {
      const spread = (i / (blades - 1) - 0.5) * (1.4 + matN * 1.1) + (rng() - 0.5) * 0.2;
      const bh = h * (0.58 + rng() * 0.48);
      ctx.strokeStyle = '#5D7A4B';
      ctx.lineWidth = 1.05;
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.quadraticCurveTo(
        x + spread * 10 + lean * 0.6,
        groundY - bh,
        x + spread * 23 + lean,
        groundY - bh * 0.52
      );
      ctx.stroke();
    }
  } else if (arch === 'bracken' || arch === 'woodland_ferns') {
    // Young stages show 2-3 upright uncurling fronds; mature stands form 5-7 arching pinnae umbrellas
    const fronds = Math.max(2, Math.round(2 + matN * (arch === 'bracken' ? 3 : 5)));
    for (let i = 0; i < fronds; i++) {
      const dir = (i / Math.max(1, fronds - 1) - 0.5) * (0.8 + matN * 1.2) + (rng() - 0.5) * 0.2;
      const fh = h * (0.65 + rng() * 0.4);
      const cx = x + dir * fh * 0.45 + lean * 0.5;
      const cy = groundY - fh;
      const ex = x + dir * fh * (0.55 + matN * 0.45) + lean;
      const ey = groundY - fh * (0.78 - matN * 0.22);

      ctx.strokeStyle = arch === 'bracken' ? '#526F38' : '#2D5A3D';
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.quadraticCurveTo(cx, cy, ex, ey);
      ctx.stroke();

      // Paired pinnae leaflets along upper half of arching rachis
      ctx.lineWidth = 0.85;
      ctx.strokeStyle = arch === 'bracken' ? 'rgba(82, 111, 56, 0.78)' : 'rgba(45, 90, 61, 0.78)';
      for (let t = 0.42; t <= 0.94; t += 0.1) {
        const omt = 1 - t;
        const px = omt * omt * x + 2 * omt * t * cx + t * t * ex;
        const py = omt * omt * groundY + 2 * omt * t * cy + t * t * ey;
        const pinLen = fh * 0.19 * (1 - (t - 0.4) * 1.1);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + dir * 2 - 2, py - pinLen);
        ctx.moveTo(px, py);
        ctx.lineTo(px + dir * 2 + 2, py + pinLen * 0.5);
        ctx.stroke();
      }
    }
  } else {
    // Tall meadow / cottongrass / fine turf with compound umbels
    const stalks = Math.max(3, Math.round(3 + matN * 7));
    for (let i = 0; i < stalks; i++) {
      const sx = x + (i - (stalks - 1) / 2) * 3.1 + (rng() - 0.5) * 1.5;
      const sh = h * (0.58 + rng() * 0.48);
      const tx = sx + lean;
      const ty = groundY - sh;
      ctx.strokeStyle = '#4B6B42';
      ctx.lineWidth = 0.95;
      ctx.beginPath();
      ctx.moveTo(sx, groundY);
      ctx.quadraticCurveTo(sx + lean * 0.4, groundY - sh * 0.55, tx, ty);
      ctx.stroke();

      if (arch === 'cottongrass' && matN > 0.25 && mode !== 'xray') {
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = 'rgba(24, 32, 28, 0.35)';
        ctx.beginPath();
        ctx.arc(tx, ty, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (arch === 'tall_meadow_grass' && matN > 0.35 && i % 2 === 0 && mode !== 'xray') {
        // Compound umbel rays
        ctx.strokeStyle = 'rgba(130, 125, 108, 0.85)';
        ctx.lineWidth = 0.8;
        for (let r = -2; r <= 2; r++) {
          ctx.beginPath();
          ctx.moveTo(tx, ty + 2);
          ctx.lineTo(tx + r * 2.5, ty - 2);
          ctx.stroke();
        }
      }
    }
  }
  ctx.restore();
}

function drawDwarfShrubArchitecture(
  ctx: CanvasRenderingContext2D,
  spec: SpecimenInstance,
  groundY: number,
  arch: SpeciesArchetype,
  expN: number,
  matN: number,
  mode: RenderMode,
  rng: () => number
) {
  const h = spec.actualHeightPx;
  const w = spec.crownWidthPx;
  const x = spec.x;

  ctx.save();

  // Pioneer dwarf-shrub seedling (< 0.24): 1-2 slender upright sprigs, no gnarled woody cushion yet
  if (matN < 0.24) {
    const sprigs = matN < 0.1 ? 1 : 2;
    for (let i = 0; i < sprigs; i++) {
      const a = -Math.PI / 2 + (sprigs === 1 ? 0 : (i - 0.5) * 0.38) + expN * 0.25;
      const len = Math.max(7, h * (0.8 + rng() * 0.3));
      const ex = x + Math.cos(a) * len;
      const ey = groundY + Math.sin(a) * len;
      ctx.strokeStyle = '#4E3F31';
      ctx.lineWidth = 1.05;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      if (mode !== 'xray') {
        ctx.strokeStyle =
          arch === 'dwarf_willow'
            ? 'rgba(56, 98, 48, 0.72)'
            : 'rgba(112, 68, 104, 0.72)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + expN * 2, ey - 3);
        ctx.stroke();
      }
    }
    ctx.restore();
    return;
  }

  // Subtle low translucent heather tint behind woody creeping branches (builds with maturity)
  if (mode !== 'xray' && matN > 0.38) {
    ctx.fillStyle =
      arch === 'dwarf_willow'
        ? 'rgba(72, 108, 62, 0.15)'
        : arch === 'bell_heather'
        ? 'rgba(116, 78, 108, 0.14)'
        : 'rgba(98, 72, 92, 0.14)';
    ctx.beginPath();
    ctx.ellipse(x + spec.leanShift * 0.35, groundY - h * 0.4, w * 0.45, h * 0.45, expN * 0.1, Math.PI, 0);
    ctx.fill();
  }

  const shrubMaxDepth = matN < 0.5 ? 1 : 2;

  // Recursive gnarled woody creeping stems (depth scales with maturity)
  const drawShrubTwig = (
    bx: number,
    by: number,
    len: number,
    angle: number,
    width: number,
    depth: number
  ) => {
    const mx = bx + Math.cos(angle) * len * 0.5 + (rng() - 0.5) * len * 0.28;
    const my = by + Math.sin(angle) * len * 0.5 + (rng() - 0.5) * len * 0.2;
    const ex = bx + Math.cos(angle) * len;
    const ey = by + Math.sin(angle) * len;

    ctx.strokeStyle = depth === 0 ? '#3E3024' : '#4E3F31';
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();

    if (depth >= shrubMaxDepth) {
      if (mode !== 'xray') {
        // Tiny flower/foliage sprig flecks on woody twig tips
        ctx.strokeStyle =
          arch === 'dwarf_willow'
            ? 'rgba(56, 98, 48, 0.72)'
            : 'rgba(112, 68, 104, 0.72)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + expN * 2, ey - 3.2);
        ctx.stroke();
      }
      return;
    }

    const forks = depth === 0 ? (matN < 0.45 ? 2 : 3) : 2;
    for (let f = 0; f < forks; f++) {
      const spread = (f / Math.max(1, forks - 1) - 0.5) * 1.1 + (rng() - 0.5) * 0.3;
      drawShrubTwig(
        ex,
        ey,
        len * (0.62 + rng() * 0.16),
        angle + spread + expN * 0.18,
        Math.max(0.55, width * 0.65),
        depth + 1
      );
    }
  };

  const stems = Math.max(2, Math.round(1.8 + matN * 3.2));
  for (let i = 0; i < stems; i++) {
    const spread =
      (i / Math.max(1, stems - 1) - 0.5) *
      ((arch === 'dwarf_willow' ? 1.85 : 1.35) * (0.45 + 0.55 * matN));
    const baseAngle = -Math.PI / 2 + spread + expN * 0.32;
    drawShrubTwig(x, groundY, h * (0.48 + rng() * 0.18), baseAngle, 1.35, 0);
  }

  ctx.restore();
}

function drawFallenNurseLog(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  matN: number,
  mode: RenderMode
) {
  ctx.save();
  ctx.fillStyle = mode === 'xray' ? 'rgba(94, 70, 50, 0.2)' : '#6D5844';
  ctx.strokeStyle = '#18201C';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.roundRect(x - len * 0.5, y - 9, len, 9, 4);
  ctx.fill();
  ctx.stroke();

  if (mode !== 'xray') {
    // Moss cap draping over nurse log
    ctx.fillStyle = 'rgba(52, 106, 68, 0.72)';
    ctx.beginPath();
    ctx.ellipse(x, y - 9, len * 0.42, 3.5 + matN * 2, 0, Math.PI, 0);
    ctx.fill();
  }
  ctx.restore();
}

function drawStandingSnag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  expN: number,
  mode: RenderMode
) {
  ctx.save();
  ctx.strokeStyle = mode === 'xray' ? '#8C6239' : '#7B7468';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + expN * 8, y - h);
  // Broken limb stub
  ctx.moveTo(x + expN * 4, y - h * 0.62);
  ctx.lineTo(x + expN * 4 - 11, y - h * 0.76);
  ctx.stroke();
  ctx.restore();
}

function drawHabitatComparisonGhost(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  compareHabitat: FossittHabitat,
  compareHeightM: number,
  pxPerMeterY: number,
  padTop: number,
  minX: number,
  maxX: number
) {
  ctx.save();
  const trueH = compareHeightM * pxPerMeterY;
  const maxVisibleH = Math.max(24, y - padTop - 20);
  const overflowsTop = trueH > maxVisibleH;
  const h = Math.max(10, Math.min(trueH, maxVisibleH));

  ctx.strokeStyle = 'rgba(43, 91, 120, 0.72)';
  ctx.fillStyle = 'rgba(43, 91, 120, 0.055)';
  ctx.lineWidth = 1.45;
  ctx.setLineDash([5, 4]);

  const code = compareHabitat.code;

  if (overflowsTop) {
    // When a tall woodland/parkland is compared onto a low heath/bog scale plate,
    // render its true basal structure in 1:1 scale up to the plate ceiling
    const baseW = Math.min(26, Math.max(10, trueH * 0.045));
    ctx.beginPath();
    ctx.moveTo(x - baseW * 1.15, y);
    ctx.quadraticCurveTo(x - baseW * 0.55, y - h * 0.25, x - baseW * 0.45, padTop + 16);
    ctx.lineTo(x + baseW * 0.45, padTop + 16);
    ctx.quadraticCurveTo(x + baseW * 0.55, y - h * 0.25, x + baseW * 1.15, y);
    ctx.stroke();

    // If multi-tiered woodland, also indicate subcanopy or shrub skirt if it fits within plate
    if (code === 'WN1' || code === 'WN2' || code === 'WN4' || code === 'WL1') {
      const subH = Math.min(h * 0.85, Math.max(26, trueH * 0.32));
      ctx.beginPath();
      ctx.ellipse(x - 16, y - subH * 0.52, Math.min(72, subH * 0.68), subH * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Upward continuation arrows at top of clipped silhouette
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x - 5, padTop + 14);
    ctx.lineTo(x, padTop + 7);
    ctx.lineTo(x + 5, padTop + 14);
    ctx.stroke();
  } else if (code === 'WD5') {
    // Clear straight trunk (48% height) + symmetrical manicured lollipop dome
    const trunkH = h * 0.48;
    const rw = Math.min(95, h * 0.34);
    const rh = h * 0.29;
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x - 3, y - trunkH);
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x + 3, y - trunkH);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x, y - trunkH - rh * 0.88, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (code === 'WN1' || code === 'WN2' || code === 'WN4') {
    // Asymmetric multi-tiered native woodland: low-forked spreading oak/ash skeleton + subcanopy tier
    const forkH = h * 0.24;
    const crownSpread = Math.min(105, h * 0.48);
    // Low trunk splitting into asymmetric primary limbs
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x - 2, y - forkH);
    ctx.lineTo(x - crownSpread * 0.45, y - h * 0.62);
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x + 2, y - forkH);
    ctx.lineTo(x + crownSpread * 0.42, y - h * 0.56);
    ctx.stroke();

    // Broad undulating main canopy lobes
    ctx.beginPath();
    ctx.ellipse(x - crownSpread * 0.24, y - h * 0.72, crownSpread * 0.58, h * 0.26, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x + crownSpread * 0.28, y - h * 0.64, crownSpread * 0.48, h * 0.22, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Subcanopy / understorey tier (holly, hazel, alder)
    ctx.beginPath();
    ctx.ellipse(x - crownSpread * 0.38, y - h * 0.28, crownSpread * 0.36, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (code === 'WN3') {
    // Yew woodland: broad fluted multi-stemmed trunk + stacked horizontal tabular canopy plates
    ctx.beginPath();
    ctx.moveTo(x - 7, y);
    ctx.lineTo(x - 4, y - h * 0.55);
    ctx.moveTo(x + 7, y);
    ctx.lineTo(x + 4, y - h * 0.55);
    ctx.moveTo(x, y);
    ctx.lineTo(x - 1, y - h * 0.62);
    ctx.stroke();

    const wMax = Math.min(105, h * 0.62);
    for (const [yFrac, wFrac, hFrac] of [
      [0.44, 0.98, 0.14],
      [0.64, 0.86, 0.15],
      [0.83, 0.64, 0.14],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, y - h * yFrac, wMax * wFrac, h * hFrac, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (code === 'WN5' || code === 'WN6') {
    // Riparian / Carr: multi-stem leaning overarching willows + basal tussock mound
    const wSpread = Math.min(95, h * 0.52);
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.quadraticCurveTo(x - 4, y - h * 0.52, x - wSpread * 0.3, y - h * 0.82);
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 14, y - h * 0.54, x + wSpread * 0.45, y - h * 0.72);
    ctx.moveTo(x + 6, y);
    ctx.quadraticCurveTo(x + 24, y - h * 0.36, x + wSpread * 0.72, y - h * 0.42);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x + wSpread * 0.16, y - h * 0.68, wSpread * 0.64, h * 0.28, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Basal tussock-sedge mound
    ctx.beginPath();
    ctx.ellipse(x - 18, y - Math.min(14, h * 0.1), 18, Math.min(14, h * 0.1), 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  } else if (code === 'WN7') {
    // Bog woodland: stunted leaning birch + flat-topped Scots pine umbrella crown
    const lean = Math.min(48, h * 0.32);
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.quadraticCurveTo(x - 2, y - h * 0.48, x + lean * 0.4, y - h * 0.8);
    ctx.moveTo(x + 8, y);
    ctx.quadraticCurveTo(x + 16, y - h * 0.42, x + lean * 0.85, y - h * 0.66);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x + lean * 0.55, y - h * 0.84, Math.min(72, h * 0.46), h * 0.16, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (code === 'WL1') {
    // Hedgerow: dense interlocking bank thicket + emergent standard ash/oak
    const thicketH = h * 0.34;
    const thicketW = Math.min(62, Math.max(32, h * 0.36));
    ctx.beginPath();
    ctx.ellipse(x, y - thicketH * 0.5, thicketW, thicketH * 0.55, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Standard emergent trunk & open high crown
    ctx.beginPath();
    ctx.moveTo(x, y - thicketH * 0.8);
    ctx.lineTo(x + 2, y - h * 0.65);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x + 4, y - h * 0.78, Math.min(54, h * 0.28), h * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (code === 'WS1' || code === 'CD4') {
    // Scrub / Dune scrub: dense wind-planed aerodynamic thorny mound (<5m)
    const domeW = Math.min(115, Math.max(38, h * 1.45));
    ctx.beginPath();
    ctx.moveTo(x - domeW * 0.55, y);
    ctx.bezierCurveTo(
      x - domeW * 0.48,
      y - h * 0.72,
      x + domeW * 0.15,
      y - h * 1.06,
      x + domeW * 0.55,
      y
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Interior suckering stem lines
    ctx.beginPath();
    for (const dx of [-0.2, 0, 0.22]) {
      ctx.moveTo(x + domeW * dx, y);
      ctx.lineTo(x + domeW * (dx + 0.12), y - h * 0.65);
    }
    ctx.stroke();
  } else if (code === 'HD1') {
    // Dense bracken: horizontal umbrella frond silhouettes on upright rachis stems
    const span = 76;
    for (const [dx, hf] of [
      [-28, 0.86],
      [0, 1.0],
      [28, 0.9],
    ]) {
      const topY = y - h * hf;
      ctx.beginPath();
      ctx.moveTo(x + dx, y);
      ctx.lineTo(x + dx, topY + 3);
      ctx.moveTo(x + dx - 18, topY + 6);
      ctx.quadraticCurveTo(x + dx, topY - 4, x + dx + 18, topY + 6);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(x, y - h * 0.84, span * 0.55, Math.max(6, h * 0.16), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (code === 'FS1') {
    // Reed and large sedge swamp: dense vertical plumed reed wall
    const wallW = 84;
    ctx.beginPath();
    ctx.rect(x - wallW * 0.5, y - h * 0.92, wallW, h * 0.92);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    for (let dx = -wallW * 0.42; dx <= wallW * 0.42; dx += 12) {
      ctx.moveTo(x + dx, y);
      ctx.lineTo(x + dx + 2, y - h);
    }
    ctx.stroke();
  } else if (code === 'CD2') {
    // Marram dunes: arching blade tussocks
    const tufts = [-26, 0, 26];
    for (const dx of tufts) {
      ctx.beginPath();
      ctx.moveTo(x + dx, y);
      ctx.quadraticCurveTo(x + dx - 10, y - h * 0.78, x + dx - 20, y - h * 0.88);
      ctx.moveTo(x + dx, y);
      ctx.quadraticCurveTo(x + dx + 2, y - h * 0.95, x + dx + 6, y - h);
      ctx.moveTo(x + dx, y);
      ctx.quadraticCurveTo(x + dx + 14, y - h * 0.75, x + dx + 24, y - h * 0.82);
      ctx.stroke();
    }
  } else if (code === 'ER2') {
    // Exposed calcareous rock: stepped clint & gryke block silhouette with compact fissure fern/hazel
    const blockW = 90;
    const blockH = Math.max(12, h * 0.52);
    ctx.beginPath();
    ctx.moveTo(x - blockW * 0.5, y);
    ctx.lineTo(x - blockW * 0.5, y - blockH * 0.55);
    ctx.lineTo(x - 10, y - blockH * 0.55);
    ctx.lineTo(x - 6, y + 6);
    ctx.lineTo(x + 4, y + 6);
    ctx.lineTo(x + 8, y - blockH * 0.65);
    ctx.lineTo(x + blockW * 0.5, y - blockH * 0.65);
    ctx.lineTo(x + blockW * 0.5, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x - 1, y - h * 0.62, 22, Math.max(8, h * 0.38), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (code === 'GS4') {
    // Wet grassland: vertical fanning cylindrical rush tussocks
    for (const dx of [-24, 2, 28]) {
      ctx.beginPath();
      ctx.moveTo(x + dx, y);
      ctx.lineTo(x + dx - 9, y - h * 0.88);
      ctx.moveTo(x + dx, y);
      ctx.lineTo(x + dx, y - h);
      ctx.moveTo(x + dx, y);
      ctx.lineTo(x + dx + 9, y - h * 0.85);
      ctx.stroke();
    }
  } else {
    // Heaths (HH1, HH3, HH4), Peatlands (PB1-PB3, PF1), Grasslands (GS1, GS2):
    // Hummocky dwarf-shrub / tussock / sward contour profile scaled cleanly to true meter height
    const spanW = 104;
    ctx.beginPath();
    ctx.moveTo(x - spanW * 0.5, y);
    ctx.bezierCurveTo(
      x - spanW * 0.36,
      y - h * 0.95,
      x - spanW * 0.12,
      y - h * 0.45,
      x,
      y - h
    );
    ctx.bezierCurveTo(
      x + spanW * 0.16,
      y - h * 0.52,
      x + spanW * 0.38,
      y - h * 0.88,
      x + spanW * 0.5,
      y
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Height datum tick & crisp label clamped safely inside horizontal drawing margins
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = 'rgba(43, 91, 120, 0.42)';
  ctx.beginPath();
  ctx.moveTo(x - 42, y - h);
  ctx.lineTo(x + 42, y - h);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.font = '500 10px "IBM Plex Mono", monospace';
  ctx.fillStyle = 'rgba(43, 91, 120, 0.9)';
  const labelText = overflowsTop
    ? `COMPARE · ${code} ${compareHabitat.name.toUpperCase()} (${compareHeightM}m ↑)`
    : `COMPARE · ${code} ${compareHabitat.name.toUpperCase()} (${compareHeightM}m)`;
  const textW = ctx.measureText(labelText).width;
  const clampedX = Math.max(
    minX + textW * 0.5 + 8,
    Math.min(maxX - textW * 0.5 - 8, x)
  );
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(
    labelText,
    clampedX,
    overflowsTop ? padTop + 14 : Math.max(padTop + 14, y - h - 6)
  );
  ctx.restore();
}

function drawStrataBands(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  groundY: number,
  treeScaleH: number,
  metrics: ReturnType<typeof computeArchitectureMetrics>,
  habitat: FossittHabitat
) {
  ctx.save();
  ctx.setLineDash([3, 5]);
  ctx.strokeStyle = 'rgba(45, 90, 61, 0.45)';
  ctx.lineWidth = 1;

  const bands: Array<{ y: number; label: string }> = [];
  if (habitat.group === 'W' && habitat.code !== 'WS1') {
    bands.push({ y: groundY - treeScaleH, label: `CANOPY CEILING · ${metrics.canopyHeightM}m` });
    bands.push({
      y: groundY - treeScaleH * (metrics.clearStemRatioPct / 100),
      label: `CLEAR STEM / SUBCANOPY · ${metrics.clearStemRatioPct}%`,
    });
  } else {
    bands.push({ y: groundY - Math.max(24, treeScaleH), label: `VEGETATION CANOPY · ${metrics.canopyHeightM}m` });
  }

  ctx.font = '500 10px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#2D5A3D';
  ctx.textAlign = 'left';
  for (const b of bands) {
    ctx.beginPath();
    ctx.moveTo(x0, b.y);
    ctx.lineTo(x1, b.y);
    ctx.stroke();
    ctx.fillText(b.label, x0 + 12, b.y - 5);
  }
  ctx.restore();
}

function drawArchitecturalLabels(
  ctx: CanvasRenderingContext2D,
  labels: LabelPoint[],
  x0: number,
  x1: number,
  y0: number,
  y1: number
) {
  ctx.save();
  const placedYs: number[] = [];

  for (const lbl of labels) {
    let ty = Math.max(y0 + 48, Math.min(y1 - 24, lbl.y));
    for (const py of placedYs) {
      if (Math.abs(ty - py) < 28) {
        ty = py + 28;
      }
    }
    placedYs.push(ty);

    const dir = lbl.align === 'left' ? 1 : -1;
    const tx = Math.max(x0 + 18, Math.min(x1 - 18, lbl.x + dir * 28));

    // Leader elbow line
    ctx.strokeStyle = 'rgba(24, 32, 28, 0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(lbl.x, lbl.y, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = '#18201C';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(lbl.x, lbl.y);
    ctx.lineTo(tx, ty);
    ctx.lineTo(tx + dir * 12, ty);
    ctx.stroke();

    // Label text box backdrop for crisp readability
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    const w1 = ctx.measureText(lbl.text).width;
    ctx.font = 'italic 400 10px "Plus Jakarta Sans", sans-serif';
    const w2 = lbl.subtext ? ctx.measureText(lbl.subtext).width : 0;
    const boxW = Math.max(w1, w2) + 10;
    const textStart = lbl.align === 'left' ? tx + 15 : tx - 15 - boxW;

    ctx.fillStyle = 'rgba(246, 244, 238, 0.88)';
    ctx.fillRect(textStart, ty - 11, boxW, lbl.subtext ? 24 : 14);

    ctx.fillStyle = '#18201C';
    ctx.textAlign = lbl.align;
    ctx.textBaseline = 'middle';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(lbl.text, lbl.align === 'left' ? tx + 18 : tx - 18, ty - 4);

    if (lbl.subtext) {
      ctx.fillStyle = 'rgba(24, 32, 28, 0.65)';
      ctx.font = 'italic 400 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(lbl.subtext, lbl.align === 'left' ? tx + 18 : tx - 18, ty + 8);
    }
  }
  ctx.restore();
}
