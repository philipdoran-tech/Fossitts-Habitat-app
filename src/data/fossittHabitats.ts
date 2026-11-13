export type HabitatGroupId =
  | 'W'
  | 'H'
  | 'P'
  | 'G'
  | 'C'
  | 'E'
  | 'F';

export interface HabitatGroup {
  id: HabitatGroupId;
  code: string;
  label: string;
  shortLabel: string;
}

export type SubstrateProfile =
  | 'acid_podzol'
  | 'calcareous_loam'
  | 'limestone_pavement'
  | 'alluvial_gley'
  | 'river_margin'
  | 'waterlogged_carr'
  | 'deep_raised_peat'
  | 'blanket_peat'
  | 'rich_fen_peat'
  | 'dune_sand'
  | 'montane_scree'
  | 'swamp_silt'
  | 'improved_loam';

export type SpeciesArchetype =
  | 'sessile_oak'
  | 'pedunculate_oak'
  | 'ash'
  | 'downy_birch'
  | 'holly'
  | 'hazel'
  | 'yew'
  | 'alder'
  | 'willow_carr'
  | 'scots_pine'
  | 'hawthorn_blackthorn'
  | 'gorse'
  | 'rowan'
  | 'sycamore_parkland'
  | 'ling_heather'
  | 'bell_heather'
  | 'dwarf_willow'
  | 'bracken'
  | 'black_bog_rush'
  | 'tussock_sedge'
  | 'cottongrass'
  | 'common_reed'
  | 'marram_grass'
  | 'soft_rush'
  | 'tall_meadow_grass'
  | 'fine_turf_grass'
  | 'woodland_ferns'
  | 'sphagnum_carpet'
  | 'bryophyte_rock';

export interface HabitatSpecies {
  common: string;
  latin: string;
  stratum: 'canopy' | 'subcanopy' | 'shrub' | 'field' | 'ground';
  archetype: SpeciesArchetype;
  dominancePct: number;
  architecturalRole: string;
}

export interface HabitatParameters {
  /** 0 = deep closed-canopy shade, 100 = full open overhead & lateral light */
  light: number;
  /** 0 = skeletal/shallow/drained/extreme, 100 = deep/moist/saturated/fertile */
  soil: number;
  /** 0 = pioneer colonising, 50 = pole/thicket, 100 = veteran old-growth */
  maturity: number;
  /** 0 = sheltered valley, 100 = Atlantic gale / heavy browsing */
  exposure: number;
}

export interface SliderLabels {
  lightLow: string;
  lightHigh: string;
  soilTitle: string;
  soilLow: string;
  soilHigh: string;
  maturityLow: string;
  maturityHigh: string;
  exposureLow: string;
  exposureHigh: string;
}

export interface FossittHabitat {
  code: string;
  name: string;
  group: HabitatGroupId;
  subgroup: string;
  fossittPage: number; // printed book page in Fossitt (2000)
  pdfPage: number; // 1-indexed page inside attached PDF
  annexICode?: string;
  annexIPriority?: boolean;
  substrate: SubstrateProfile;
  /** Architectural canopy ceiling in ideal mature sheltered conditions (meters) */
  maxNaturalHeightM: number;
  /** Minimum height under extreme stunting/wind/shallow soil (meters) */
  minStuntedHeightM: number;
  /** Whether trees naturally form multi-stem stools or sinuous spreading crowns */
  multiStemTendency: number; // 0..1
  /** Default ideal semi-natural parameter profile */
  idealParams: HabitatParameters;
  sliderLabels: SliderLabels;
  /** Visual morphological signature phrases (concise, no prose walls) */
  formCue: string;
  rootCue: string;
  species: HabitatSpecies[];
}

export const HABITAT_GROUPS: HabitatGroup[] = [
  { id: 'W', code: 'W', label: 'Woodland & Scrub', shortLabel: 'Woodland' },
  { id: 'H', code: 'H', label: 'Heath & Bracken', shortLabel: 'Heath' },
  { id: 'P', code: 'P', label: 'Peatlands', shortLabel: 'Peatlands' },
  { id: 'G', code: 'G', label: 'Grassland & Marsh', shortLabel: 'Grassland' },
  { id: 'C', code: 'C', label: 'Coastland', shortLabel: 'Coastland' },
  { id: 'E', code: 'E', label: 'Exposed Rock', shortLabel: 'Rock' },
  { id: 'F', code: 'F', label: 'Freshwater Swamps', shortLabel: 'Swamps' },
];

export const FOSSITT_HABITATS: FossittHabitat[] = [
  // ================= WOODLAND AND SCRUB =================
  {
    code: 'WN1',
    name: 'Oak-birch-holly woodland',
    group: 'W',
    subgroup: 'Semi-natural woodland',
    fossittPage: 50,
    pdfPage: 51,
    annexICode: '91A0',
    substrate: 'acid_podzol',
    maxNaturalHeightM: 18,
    minStuntedHeightM: 4.5,
    multiStemTendency: 0.42,
    idealParams: { light: 38, soil: 48, maturity: 80, exposure: 30 },
    sliderLabels: {
      lightLow: 'Closed canopy shade',
      lightHigh: 'Open glade & edge',
      soilTitle: 'Soil depth & mor humus',
      soilLow: 'Shallow rocky podzol',
      soilHigh: 'Deep humid mor humus',
      maturityLow: 'Birch-oak sapling cohort',
      maturityHigh: 'Gnarled veteran & deadwood',
      exposureLow: 'Sheltered glen',
      exposureHigh: 'Wind-sheared upland slope',
    },
    formCue: 'Sinuous crooked oak limbs · dense evergreen holly sub-canopy · mossy epiphyte drape',
    rootCue: 'Wide surface plates gripping boulders over leached acid podzol',
    species: [
      { common: 'Sessile Oak', latin: 'Quercus petraea', stratum: 'canopy', archetype: 'sessile_oak', dominancePct: 42, architecturalRole: 'Twisted phototropic canopy frame' },
      { common: 'Downy Birch', latin: 'Betula pubescens', stratum: 'canopy', archetype: 'downy_birch', dominancePct: 16, architecturalRole: 'Slender pioneer & gap filler' },
      { common: 'Holly', latin: 'Ilex aquifolium', stratum: 'subcanopy', archetype: 'holly', dominancePct: 22, architecturalRole: 'Dense evergreen mid-tier' },
      { common: 'Rowan', latin: 'Sorbus aucuparia', stratum: 'subcanopy', archetype: 'rowan', dominancePct: 6, architecturalRole: 'Light feathery edge tier' },
      { common: 'Bilberry & Hard Fern', latin: 'Vaccinium / Blechnum', stratum: 'field', archetype: 'woodland_ferns', dominancePct: 10, architecturalRole: 'Acid dwarf-shrub & fern carpet' },
      { common: 'Woodland Bryophytes', latin: 'Hylocomium / Polytrichum', stratum: 'ground', archetype: 'bryophyte_rock', dominancePct: 4, architecturalRole: 'Thick boulder & bark moss' },
    ],
  },
  {
    code: 'WN2',
    name: 'Oak-ash-hazel woodland',
    group: 'W',
    subgroup: 'Semi-natural woodland',
    fossittPage: 50,
    pdfPage: 51,
    substrate: 'calcareous_loam',
    maxNaturalHeightM: 20,
    minStuntedHeightM: 3.8,
    multiStemTendency: 0.72,
    idealParams: { light: 44, soil: 62, maturity: 78, exposure: 25 },
    sliderLabels: {
      lightLow: 'Continuous canopy closure',
      lightHigh: 'Open ash-glade light',
      soilTitle: 'Soil depth & calcareous base',
      soilLow: 'Fissured limestone rock',
      soilHigh: 'Deep fertile brown earth',
      maturityLow: 'Multi-stem hazel thicket',
      maturityHigh: 'Multi-tier veteran oak & ash',
      exposureLow: 'Sheltered esker hollow',
      exposureHigh: 'Exposed limestone terrace',
    },
    formCue: 'Open airy ash candelabra · heavy elbowed oak boughs · multi-stemmed arching hazel stools',
    rootCue: 'Deep calcareous loam roots or gnarled fissures penetrating limestone joints',
    species: [
      { common: 'Ash', latin: 'Fraxinus excelsior', stratum: 'canopy', archetype: 'ash', dominancePct: 30, architecturalRole: 'High light-filtering crown' },
      { common: 'Pedunculate Oak', latin: 'Quercus robur', stratum: 'canopy', archetype: 'pedunculate_oak', dominancePct: 24, architecturalRole: 'Broad elbowed upper boughs' },
      { common: 'Hazel', latin: 'Corylus avellana', stratum: 'subcanopy', archetype: 'hazel', dominancePct: 30, architecturalRole: 'Multi-stemmed arching stool lattice' },
      { common: 'Lady & Male Ferns', latin: 'Athyrium / Dryopteris', stratum: 'field', archetype: 'woodland_ferns', dominancePct: 16, architecturalRole: 'Vernal herb & fern tier' },
    ],
  },
  {
    code: 'WN3',
    name: 'Yew woodland',
    group: 'W',
    subgroup: 'Semi-natural woodland',
    fossittPage: 51,
    pdfPage: 52,
    annexICode: '91J0',
    annexIPriority: true,
    substrate: 'limestone_pavement',
    maxNaturalHeightM: 14,
    minStuntedHeightM: 4.0,
    multiStemTendency: 0.8,
    idealParams: { light: 20, soil: 28, maturity: 88, exposure: 28 },
    sliderLabels: {
      lightLow: 'Deep evergreen gloom',
      lightHigh: 'Broken rocky canopy',
      soilTitle: 'Limestone fissure & humus',
      soilLow: 'Bare karst clints',
      soilHigh: 'Humus-filled grykes',
      maturityLow: 'Young columnar yew',
      maturityHigh: 'Ancient fluted multi-trunks',
      exposureLow: 'Sheltered limestone basin',
      exposureHigh: 'Exposed karst ridge',
    },
    formCue: 'Fluted multi-stemmed red-ochre trunks · dense horizontal tabular evergreen plates · bare shaded floor',
    rootCue: 'Surface-hugging roots wedged into deep vertical limestone grykes',
    species: [
      { common: 'Yew', latin: 'Taxus baccata', stratum: 'canopy', archetype: 'yew', dominancePct: 74, architecturalRole: 'Dense dark tabular canopy' },
      { common: 'Hazel', latin: 'Corylus avellana', stratum: 'subcanopy', archetype: 'hazel', dominancePct: 10, architecturalRole: 'Sparse shade-suppressed edge' },
      { common: 'Limestone Mosses', latin: 'Thamnobryum / Neckera', stratum: 'ground', archetype: 'bryophyte_rock', dominancePct: 16, architecturalRole: 'Lush boulder bryophyte mat' },
    ],
  },
  {
    code: 'WN4',
    name: 'Wet pedunculate oak-ash woodland',
    group: 'W',
    subgroup: 'Semi-natural woodland',
    fossittPage: 51,
    pdfPage: 52,
    annexICode: '91E0',
    annexIPriority: true,
    substrate: 'alluvial_gley',
    maxNaturalHeightM: 19,
    minStuntedHeightM: 6.0,
    multiStemTendency: 0.45,
    idealParams: { light: 42, soil: 76, maturity: 78, exposure: 22 },
    sliderLabels: {
      lightLow: 'Dense alluvial canopy',
      lightHigh: 'Open flood-channel gaps',
      soilTitle: 'Winter waterlogging & gley depth',
      soilLow: 'Seasonal dry drumlin clay',
      soilHigh: 'Flooded alluvial channels',
      maturityLow: 'Young alder-ash pole stand',
      maturityHigh: 'Buttressed veteran oaks & snags',
      exposureLow: 'Sheltered floodplain',
      exposureHigh: 'Exposed river valley',
    },
    formCue: 'Broad buttressed oaks & tall ash above flooded seasonal depressions · alder lining wet channels',
    rootCue: 'Shallow wide-spreading root plates avoiding winter anoxic gley subsoil',
    species: [
      { common: 'Pedunculate Oak', latin: 'Quercus robur', stratum: 'canopy', archetype: 'pedunculate_oak', dominancePct: 34, architecturalRole: 'Dominant wide alluvial crown' },
      { common: 'Ash', latin: 'Fraxinus excelsior', stratum: 'canopy', archetype: 'ash', dominancePct: 24, architecturalRole: 'Upright flood-plain canopy' },
      { common: 'Alder', latin: 'Alnus glutinosa', stratum: 'subcanopy', archetype: 'alder', dominancePct: 22, architecturalRole: 'Channel-edge buttressed tier' },
      { common: 'Meadowsweet & Sedges', latin: 'Filipendula / Carex remota', stratum: 'field', archetype: 'tall_meadow_grass', dominancePct: 20, architecturalRole: 'Lush seasonal-wet ground layer' },
    ],
  },
  {
    code: 'WN5',
    name: 'Riparian woodland',
    group: 'W',
    subgroup: 'Semi-natural woodland',
    fossittPage: 52,
    pdfPage: 53,
    substrate: 'river_margin',
    maxNaturalHeightM: 13,
    minStuntedHeightM: 3.5,
    multiStemTendency: 0.85,
    idealParams: { light: 58, soil: 82, maturity: 66, exposure: 45 },
    sliderLabels: {
      lightLow: 'Enclosed gallery tunnel',
      lightHigh: 'Open braided river island',
      soilTitle: 'Flood scour & river silt',
      soilLow: 'Coarse cobble shingle bar',
      soilHigh: 'Silty tidal-flooded bank',
      maturityLow: 'Flexible osier shoots',
      maturityHigh: 'Leaning flood-scarred willows',
      exposureLow: 'Slow lowland backwater',
      exposureHigh: 'Spate flood & debris scour',
    },
    formCue: 'Leaning multi-stemmed gallery willows arching over water · silt-coated bases · caught flood debris',
    rootCue: 'Fibrous adventitious roots anchoring shifting river silt & shingle bars',
    species: [
      { common: 'White & Crack Willow', latin: 'Salix alba / fragilis', stratum: 'canopy', archetype: 'willow_carr', dominancePct: 42, architecturalRole: 'Leaning overarching river gallery' },
      { common: 'Rusty & Osier Willow', latin: 'Salix cinerea / viminalis', stratum: 'shrub', archetype: 'willow_carr', dominancePct: 28, architecturalRole: 'Flexible flood-tolerant thicket' },
      { common: 'Alder', latin: 'Alnus glutinosa', stratum: 'canopy', archetype: 'alder', dominancePct: 16, architecturalRole: 'Bank-stabilising occasional stem' },
      { common: 'Reed Canary-grass', latin: 'Phalaris arundinacea', stratum: 'field', archetype: 'common_reed', dominancePct: 14, architecturalRole: 'Tall silt-trapping margin belt' },
    ],
  },
  {
    code: 'WN6',
    name: 'Wet willow-alder-ash woodland',
    group: 'W',
    subgroup: 'Semi-natural woodland',
    fossittPage: 52,
    pdfPage: 53,
    substrate: 'waterlogged_carr',
    maxNaturalHeightM: 12,
    minStuntedHeightM: 3.5,
    multiStemTendency: 0.9,
    idealParams: { light: 48, soil: 90, maturity: 74, exposure: 25 },
    sliderLabels: {
      lightLow: 'Closed carr canopy',
      lightHigh: 'Open fen-pool glades',
      soilTitle: 'Water table & fen peat saturation',
      soilLow: 'Damp spring-fed mineral soil',
      soilHigh: 'Permanently flooded carr peat',
      maturityLow: 'Colonising willow scrub',
      maturityHigh: 'Layering carr & tussock islands',
      exposureLow: 'Sheltered lakeshore basin',
      exposureHigh: 'Wind-rocked saturated peat',
    },
    formCue: 'Decumbent layering willow stems touching pools · buttressed alder · giant tussock-sedge pedestals',
    rootCue: 'Surface pancake root mats & elevated tussock pedestals above anoxic water',
    species: [
      { common: 'Rusty Willow', latin: 'Salix cinerea ssp. oleifolia', stratum: 'canopy', archetype: 'willow_carr', dominancePct: 40, architecturalRole: 'Arching self-layering multi-stems' },
      { common: 'Alder', latin: 'Alnus glutinosa', stratum: 'canopy', archetype: 'alder', dominancePct: 28, architecturalRole: 'Swollen buttressed fen trunks' },
      { common: 'Greater Tussock-sedge', latin: 'Carex paniculata', stratum: 'field', archetype: 'tussock_sedge', dominancePct: 22, architecturalRole: '1m dry micro-island pedestals' },
      { common: 'Common Reed', latin: 'Phragmites australis', stratum: 'field', archetype: 'common_reed', dominancePct: 10, architecturalRole: 'Open wet glade emergents' },
    ],
  },
  {
    code: 'WN7',
    name: 'Bog woodland',
    group: 'W',
    subgroup: 'Semi-natural woodland',
    fossittPage: 53,
    pdfPage: 54,
    annexICode: '91D0',
    annexIPriority: true,
    substrate: 'deep_raised_peat',
    maxNaturalHeightM: 9.5,
    minStuntedHeightM: 2.5,
    multiStemTendency: 0.7,
    idealParams: { light: 56, soil: 72, maturity: 70, exposure: 48 },
    sliderLabels: {
      lightLow: 'Dense birch thicket',
      lightHigh: 'Open bog-pine mosaic',
      soilTitle: 'Peat wetness & acrotelm',
      soilLow: 'Drained cutover peat margin',
      soilHigh: 'Saturated ombrotrophic peat',
      maturityLow: 'Pioneer birch seedlings',
      maturityHigh: 'Gnarled leaning birch & pine',
      exposureLow: 'Sheltered bog hollow',
      exposureHigh: 'Exposed windswept bog dome',
    },
    formCue: 'Stunted, leaning & twisted Downy Birch · flat-topped Scots Pine · Sphagnum & heather floor',
    rootCue: 'Ultra-shallow horizontal pancake roots floating in upper 30cm aerated peat',
    species: [
      { common: 'Downy Birch', latin: 'Betula pubescens', stratum: 'canopy', archetype: 'downy_birch', dominancePct: 52, architecturalRole: 'Stunted twisted multi-stem canopy' },
      { common: 'Scots Pine', latin: 'Pinus sylvestris', stratum: 'canopy', archetype: 'scots_pine', dominancePct: 14, architecturalRole: 'Flat-topped open crown' },
      { common: 'Ling & Bilberry', latin: 'Calluna / Vaccinium', stratum: 'field', archetype: 'ling_heather', dominancePct: 20, architecturalRole: 'Woody dwarf-shrub understorey' },
      { common: 'Bog Mosses', latin: 'Sphagnum / Polytrichum', stratum: 'ground', archetype: 'sphagnum_carpet', dominancePct: 14, architecturalRole: 'Continuous hummock carpet' },
    ],
  },
  {
    code: 'WS1',
    name: 'Scrub',
    group: 'W',
    subgroup: 'Scrub / transitional woodland',
    fossittPage: 55,
    pdfPage: 56,
    annexICode: '5130',
    substrate: 'calcareous_loam',
    maxNaturalHeightM: 4.8,
    minStuntedHeightM: 1.2,
    multiStemTendency: 0.95,
    idealParams: { light: 74, soil: 42, maturity: 65, exposure: 55 },
    sliderLabels: {
      lightLow: 'Closed impenetrable thicket',
      lightHigh: 'Open mosaic with grass',
      soilTitle: 'Soil depth & fertility',
      soilLow: 'Thin rocky limestone margin',
      soilHigh: 'Deep damp marginal soil',
      maturityLow: 'Colonising gorse & bramble',
      maturityHigh: 'Dense 4.5m spinose canopy',
      exposureLow: 'Sheltered abandoned field',
      exposureHigh: 'Wind-sculpted aerodynamic dome',
    },
    formCue: 'Canopy < 5m · dense interlocking thorny cages of hawthorn, blackthorn & gorse · aerodynamic edge',
    rootCue: 'Extensive suckering clonal root networks binding shallow or marginal soils',
    species: [
      { common: 'Hawthorn & Blackthorn', latin: 'Crataegus / Prunus spinosa', stratum: 'shrub', archetype: 'hawthorn_blackthorn', dominancePct: 52, architecturalRole: 'Dense spinose suckering dome' },
      { common: 'Gorse', latin: 'Ulex europaeus', stratum: 'shrub', archetype: 'gorse', dominancePct: 34, architecturalRole: 'Armoured evergreen mound' },
      { common: 'Stunted Hazel', latin: 'Corylus avellana', stratum: 'shrub', archetype: 'hazel', dominancePct: 14, architecturalRole: 'Low multi-stem thicket' },
    ],
  },
  {
    code: 'WL1',
    name: 'Hedgerows',
    group: 'W',
    subgroup: 'Linear woodland / scrub',
    fossittPage: 57,
    pdfPage: 58,
    substrate: 'calcareous_loam',
    maxNaturalHeightM: 11,
    minStuntedHeightM: 1.8,
    multiStemTendency: 0.85,
    idealParams: { light: 78, soil: 65, maturity: 72, exposure: 42 },
    sliderLabels: {
      lightLow: 'Shaded overgrown lane',
      lightHigh: 'Open field boundary',
      soilTitle: 'Earth bank & ditch moisture',
      soilLow: 'Dry stony bank',
      soilHigh: 'Deep bank with wet ditch',
      maturityLow: 'Recently laid / flailed hedge',
      maturityHigh: 'Dense hedge with standard ash',
      exposureLow: 'Sheltered lowland field',
      exposureHigh: 'Wind-sheared western bank',
    },
    formCue: 'Linear <4m wide strip on raised earth bank beside ditch · interwoven thorny base + standard trees',
    rootCue: 'Interlaced bank-binding roots above adjacent drainage ditch water level',
    species: [
      { common: 'Hawthorn & Blackthorn', latin: 'Crataegus / Prunus', stratum: 'shrub', archetype: 'hawthorn_blackthorn', dominancePct: 58, architecturalRole: 'Laid interlocking stockproof core' },
      { common: 'Standard Ash / Oak', latin: 'Fraxinus / Quercus', stratum: 'canopy', archetype: 'ash', dominancePct: 20, architecturalRole: 'Emergent boundary standards' },
      { common: 'Gorse & Bramble', latin: 'Ulex / Rubus', stratum: 'shrub', archetype: 'gorse', dominancePct: 22, architecturalRole: 'Lower thorny bank skirt' },
    ],
  },
  {
    code: 'WD5',
    name: 'Scattered trees and parkland',
    group: 'W',
    subgroup: 'Highly modified woodland',
    fossittPage: 54,
    pdfPage: 55,
    substrate: 'improved_loam',
    maxNaturalHeightM: 22,
    minStuntedHeightM: 12,
    multiStemTendency: 0.05,
    idealParams: { light: 92, soil: 80, maturity: 85, exposure: 25 },
    sliderLabels: {
      lightLow: 'Closer tree cluster (<30%)',
      lightHigh: 'Isolated open specimen',
      soilTitle: 'Deep cultivated parkland loam',
      soilLow: 'Compacted amenity turf',
      soilHigh: 'Deep fertile estate soil',
      maturityLow: 'Staked young standard',
      maturityHigh: 'Clear-stemmed mature specimen',
      exposureLow: 'Sheltered estate demesne',
      exposureHigh: 'Exposed open pasture',
    },
    formCue: 'Reference foil: <30% canopy · tall clear-stemmed single trunks · symmetrical crowns · zero shrub tier',
    rootCue: 'Deep unimpeded symmetrical tap and lateral roots beneath mown or grazed sward',
    species: [
      { common: 'Parkland Oak / Beech / Lime', latin: 'Quercus / Fagus / Tilia', stratum: 'canopy', archetype: 'sycamore_parkland', dominancePct: 25, architecturalRole: 'Clear-stemmed specimen dome' },
      { common: 'Amenity / Ryegrass Turf', latin: 'Lolium / Agrostis', stratum: 'ground', archetype: 'fine_turf_grass', dominancePct: 75, architecturalRole: 'Uniform grazed/mown sward' },
    ],
  },

  // ================= HEATH AND DENSE BRACKEN =================
  {
    code: 'HH1',
    name: 'Dry siliceous heath',
    group: 'H',
    subgroup: 'Heath',
    fossittPage: 35,
    pdfPage: 36,
    annexICode: '4030',
    substrate: 'acid_podzol',
    maxNaturalHeightM: 2.2,
    minStuntedHeightM: 0.35,
    multiStemTendency: 0.9,
    idealParams: { light: 90, soil: 30, maturity: 68, exposure: 62 },
    sliderLabels: {
      lightLow: 'Scrub-invaded edge',
      lightHigh: 'Open upland moor',
      soilTitle: 'Acid podzol & shallow peat (<15cm)',
      soilLow: 'Bare rocky gritstone',
      soilHigh: 'Humic peaty podzol',
      maturityLow: 'Pioneer pioneer heather',
      maturityHigh: 'Woody degenerate heather mounds',
      exposureLow: 'Sheltered lowland heath',
      exposureHigh: 'Exposed coastal/hill ridge',
    },
    formCue: '>25% dwarf shrubs · woody gnarled Ling cushions · low prostrate Western Gorse domes',
    rootCue: 'Fine ericoid mycorrhizal mats in shallow acid podzol (<15cm peat)',
    species: [
      { common: 'Ling & Bell Heather', latin: 'Calluna vulgaris / Erica cinerea', stratum: 'shrub', archetype: 'ling_heather', dominancePct: 54, architecturalRole: 'Wind-contoured woody cushion' },
      { common: 'Western Gorse', latin: 'Ulex gallii', stratum: 'shrub', archetype: 'gorse', dominancePct: 28, architecturalRole: 'Low cushion dome (not scrub)' },
      { common: 'Wavy Hair-grass', latin: 'Deschampsia flexuosa', stratum: 'field', archetype: 'fine_turf_grass', dominancePct: 18, architecturalRole: 'Interstitial fine grass matrix' },
    ],
  },
  {
    code: 'HH3',
    name: 'Wet heath',
    group: 'H',
    subgroup: 'Heath',
    fossittPage: 36,
    pdfPage: 37,
    annexICode: '4010',
    substrate: 'blanket_peat',
    maxNaturalHeightM: 1.4,
    minStuntedHeightM: 0.3,
    multiStemTendency: 0.9,
    idealParams: { light: 92, soil: 65, maturity: 70, exposure: 65 },
    sliderLabels: {
      lightLow: 'Tall Molinia tussock shade',
      lightHigh: 'Open dwarf-shrub slope',
      soilTitle: 'Shallow wet peat (15–50cm)',
      soilLow: 'Thin peaty gley (15cm)',
      soilHigh: 'Saturated 50cm peat transition',
      maturityLow: 'Post-burn pioneer flush',
      maturityHigh: 'Mature moss-rich wet heath',
      exposureLow: 'Lower sheltered slope',
      exposureHigh: 'Exposed Atlantic hillside',
    },
    formCue: '15–50cm wet peat · tussocky Purple Moor-grass interspersed with Ling & Cross-leaved Heath',
    rootCue: 'Shallow peat-binding rhizomes & dense Hylocomium / Sphagnum moss weft',
    species: [
      { common: 'Cross-leaved Heath & Ling', latin: 'Erica tetralix / Calluna', stratum: 'shrub', archetype: 'bell_heather', dominancePct: 42, architecturalRole: 'Low wet-tolerant shrublet' },
      { common: 'Purple Moor-grass', latin: 'Molinia caerulea', stratum: 'field', archetype: 'tussock_sedge', dominancePct: 40, architecturalRole: 'Dense fibrous tussock mounds' },
      { common: 'Heath Mosses', latin: 'Sphagnum / Hylocomium', stratum: 'ground', archetype: 'sphagnum_carpet', dominancePct: 18, architecturalRole: 'Continuous damp moss mat' },
    ],
  },
  {
    code: 'HH4',
    name: 'Montane heath',
    group: 'H',
    subgroup: 'Heath',
    fossittPage: 37,
    pdfPage: 38,
    annexICode: '4060',
    substrate: 'montane_scree',
    maxNaturalHeightM: 0.55,
    minStuntedHeightM: 0.08,
    multiStemTendency: 1.0,
    idealParams: { light: 96, soil: 25, maturity: 80, exposure: 92 },
    sliderLabels: {
      lightLow: 'Cloud-shrouded ridge',
      lightHigh: 'Exposed summit light',
      soilTitle: 'Shallow eroding mineral/peat',
      soilLow: 'Loose summit blockfield',
      soilHigh: 'Damp peat-pocket ridge',
      maturityLow: 'Colonising moss cushions',
      maturityHigh: 'Ancient wind-contoured mats',
      exposureLow: 'Leeward mountain saddle',
      exposureHigh: 'Extreme Atlantic summit gale',
    },
    formCue: 'Extreme wind-contoured prostrate architecture · Dwarf Willow (<5cm) · Racomitrium moss hummocks',
    rootCue: 'Creeping woody stems & runners anchored beneath loose frost-shattered scree',
    species: [
      { common: 'Dwarf Willow & Juniper', latin: 'Salix herbacea / Juniperus', stratum: 'shrub', archetype: 'dwarf_willow', dominancePct: 36, architecturalRole: 'Ground-hugging espalier mat' },
      { common: 'Crowberry & Ling', latin: 'Empetrum / Calluna', stratum: 'shrub', archetype: 'ling_heather', dominancePct: 38, architecturalRole: 'Wind-sheared 10cm woody carpet' },
      { common: 'Woolly Fringe-moss', latin: 'Racomitrium lanuginosum', stratum: 'ground', archetype: 'bryophyte_rock', dominancePct: 26, architecturalRole: 'Domed silver-green hummocks' },
    ],
  },
  {
    code: 'HD1',
    name: 'Dense bracken',
    group: 'H',
    subgroup: 'Dense bracken',
    fossittPage: 38,
    pdfPage: 39,
    substrate: 'acid_podzol',
    maxNaturalHeightM: 2.0,
    minStuntedHeightM: 0.7,
    multiStemTendency: 0.8,
    idealParams: { light: 82, soil: 55, maturity: 75, exposure: 38 },
    sliderLabels: {
      lightLow: 'Sub-canopy shading',
      lightHigh: 'Open south-facing slope',
      soilTitle: 'Free-draining deep acid soil',
      soilLow: 'Shallow rocky hill soil',
      soilHigh: 'Deep brown podzolic loam',
      maturityLow: 'Spring crosier emergence',
      maturityHigh: 'Dense 1.8m arching frond canopy',
      exposureLow: 'Sheltered valley bracken',
      exposureHigh: 'Wind-broken ridge margin',
    },
    formCue: '>50% interlocking arching fern canopy (1–1.8m) · deep persistent winter frond thatch suppressing herbs',
    rootCue: 'Massive horizontal subterranean rhizome network at 15–40cm depth',
    species: [
      { common: 'Bracken', latin: 'Pteridium aquilinum', stratum: 'field', archetype: 'bracken', dominancePct: 82, architecturalRole: 'Umbrella-like seasonal canopy' },
      { common: 'Acid Grasses', latin: 'Agrostis / Deschampsia', stratum: 'ground', archetype: 'fine_turf_grass', dominancePct: 18, architecturalRole: 'Suppressed under-thatch remnant' },
    ],
  },

  // ================= PEATLANDS =================
  {
    code: 'PB1',
    name: 'Raised bog',
    group: 'P',
    subgroup: 'Bogs',
    fossittPage: 41,
    pdfPage: 42,
    annexICode: '7110',
    annexIPriority: true,
    substrate: 'deep_raised_peat',
    maxNaturalHeightM: 3.5,
    minStuntedHeightM: 0.25,
    multiStemTendency: 0.7,
    idealParams: { light: 95, soil: 88, maturity: 85, exposure: 50 },
    sliderLabels: {
      lightLow: 'Marginal birch encroachment',
      lightHigh: 'Open treeless bog dome',
      soilTitle: 'Peat dome hydrology & water table',
      soilLow: 'Drained drying margin',
      soilHigh: 'Intact saturated hummock-pool dome',
      maturityLow: 'Regenerating cutover surface',
      maturityHigh: 'Deep 8m ancient domed mire',
      exposureLow: 'Sheltered midland basin',
      exposureHigh: 'Windswept central dome',
    },
    formCue: 'Microtopographic hummock-hollow architecture · Sphagnum cushions · pool-edge cottongrass & sundews',
    rootCue: 'Rootless living Sphagnum acrotelm over 3–12m saturated ombrotrophic peat',
    species: [
      { common: 'Ling & Cross-leaved Heath', latin: 'Calluna / Erica tetralix', stratum: 'shrub', archetype: 'ling_heather', dominancePct: 28, architecturalRole: 'Dry hummock crest dwarf shrub' },
      { common: 'Cottongrasses & Deergrass', latin: 'Eriophorum / Trichophorum', stratum: 'field', archetype: 'cottongrass', dominancePct: 34, architecturalRole: 'Hollow & lawn tuft matrix' },
      { common: 'Bog Mosses', latin: 'Sphagnum capillifolium / cuspidatum', stratum: 'ground', archetype: 'sphagnum_carpet', dominancePct: 38, architecturalRole: 'Dome-building sponge matrix' },
    ],
  },
  {
    code: 'PB2',
    name: 'Upland blanket bog',
    group: 'P',
    subgroup: 'Bogs',
    fossittPage: 42,
    pdfPage: 43,
    annexICode: '7130',
    annexIPriority: true,
    substrate: 'blanket_peat',
    maxNaturalHeightM: 0.9,
    minStuntedHeightM: 0.15,
    multiStemTendency: 0.85,
    idealParams: { light: 96, soil: 78, maturity: 80, exposure: 72 },
    sliderLabels: {
      lightLow: 'Misted plateau light',
      lightHigh: 'Open mountain plateau',
      soilTitle: 'Peat depth (1–2m) & integrity',
      soilLow: 'Overgrazed / eroding peat haggs',
      soilHigh: 'Intact active Sphagnum blanket',
      maturityLow: 'Recovering bare peat',
      maturityHigh: 'Intact deep blanket mire',
      exposureLow: 'Gentle upland saddle',
      exposureHigh: 'Exposed mountain ridge (>150m)',
    },
    formCue: 'Low windswept mantle of Deergrass, Cottongrass & Ling over 1–2m peat · hummock-pool drainage',
    rootCue: 'Fibrous sedge root mat knitting together wet upland blanket peat',
    species: [
      { common: 'Ling & Bilberry', latin: 'Calluna / Vaccinium', stratum: 'shrub', archetype: 'ling_heather', dominancePct: 30, architecturalRole: 'Low windswept dwarf-shrub layer' },
      { common: 'Deergrass & Cottongrass', latin: 'Trichophorum / Eriophorum', stratum: 'field', archetype: 'cottongrass', dominancePct: 44, architecturalRole: 'Fibrous tussock & plume cover' },
      { common: 'Sphagnum & Racomitrium', latin: 'Sphagnum / Racomitrium', stratum: 'ground', archetype: 'sphagnum_carpet', dominancePct: 26, architecturalRole: 'Water-retaining living skin' },
    ],
  },
  {
    code: 'PB3',
    name: 'Lowland blanket bog',
    group: 'P',
    subgroup: 'Bogs',
    fossittPage: 43,
    pdfPage: 44,
    annexICode: '7130',
    annexIPriority: true,
    substrate: 'blanket_peat',
    maxNaturalHeightM: 1.3,
    minStuntedHeightM: 0.25,
    multiStemTendency: 0.8,
    idealParams: { light: 95, soil: 92, maturity: 82, exposure: 68 },
    sliderLabels: {
      lightLow: 'Oceanic mist',
      lightHigh: 'Open Atlantic seaboard',
      soilTitle: 'Oceanic peat pools & wetness',
      soilLow: 'Drained / sheep-grazed margin',
      soilHigh: 'Pool-studded Atlantic bog',
      maturityLow: 'Degraded algae-crusted peat',
      maturityHigh: 'Intact Schoenus pool complex',
      exposureLow: 'Sheltered western hollow',
      exposureHigh: 'Atlantic seaboard gales (>1250mm rain)',
    },
    formCue: 'Grassy oceanic architecture · Black Bog-rush tussocks · Bog-myrtle · pool & swallow-hole network',
    rootCue: 'Dense Schoenus tussock crowns above 1.5–7m saturated Atlantic peat',
    species: [
      { common: 'Black Bog-rush', latin: 'Schoenus nigricans', stratum: 'field', archetype: 'black_bog_rush', dominancePct: 48, architecturalRole: 'Dominant grassy arching tussock' },
      { common: 'Bog-myrtle', latin: 'Myrica gale', stratum: 'shrub', archetype: 'bell_heather', dominancePct: 22, architecturalRole: 'Aromatic flush & pool-edge shrub' },
      { common: 'Sphagnum Pools', latin: 'Sphagnum / Eriocaulon', stratum: 'ground', archetype: 'sphagnum_carpet', dominancePct: 30, architecturalRole: 'Submerged pool & lawn carpet' },
    ],
  },
  {
    code: 'PF1',
    name: 'Rich fen and flush',
    group: 'P',
    subgroup: 'Fens and flushes',
    fossittPage: 45,
    pdfPage: 46,
    annexICode: '7210',
    annexIPriority: true,
    substrate: 'rich_fen_peat',
    maxNaturalHeightM: 2.1,
    minStuntedHeightM: 0.45,
    multiStemTendency: 0.75,
    idealParams: { light: 88, soil: 86, maturity: 78, exposure: 35 },
    sliderLabels: {
      lightLow: 'Tall sedge-reed shading',
      lightHigh: 'Open calcareous fen basin',
      soilTitle: 'Calcareous groundwater & marl',
      soilLow: 'Damp mineral flush edge',
      soilHigh: 'Spring-fed calcareous fen peat',
      maturityLow: 'Low small-sedge flush',
      maturityHigh: 'Tall Schoenus & Cladium tussocks',
      exposureLow: 'Sheltered limestone valley',
      exposureHigh: 'Exposed lakeside fen',
    },
    formCue: 'Elevated Black Bog-rush tussocks hosting dry-crown heathers above wet brown-moss calcareous pools',
    rootCue: 'Deep tussock pedestals anchored in mineral-rich calcareous fen peat',
    species: [
      { common: 'Black Bog-rush', latin: 'Schoenus nigricans', stratum: 'field', archetype: 'black_bog_rush', dominancePct: 46, architecturalRole: 'Dry-topped tussock islands' },
      { common: 'Great Fen-sedge', latin: 'Cladium mariscus', stratum: 'field', archetype: 'common_reed', dominancePct: 30, architecturalRole: 'Tall serrated architectural clumps' },
      { common: 'Fen Brown Mosses', latin: 'Scorpidium / Campylium', stratum: 'ground', archetype: 'sphagnum_carpet', dominancePct: 24, architecturalRole: 'Calcareous pool moss carpet' },
    ],
  },

  // ================= GRASSLAND AND MARSH =================
  {
    code: 'GS1',
    name: 'Dry calcareous and neutral grassland',
    group: 'G',
    subgroup: 'Semi-natural grassland',
    fossittPage: 28,
    pdfPage: 29,
    annexICode: '6210',
    annexIPriority: true,
    substrate: 'calcareous_loam',
    maxNaturalHeightM: 2.8,
    minStuntedHeightM: 0.15,
    multiStemTendency: 0.65,
    idealParams: { light: 92, soil: 35, maturity: 68, exposure: 48 },
    sliderLabels: {
      lightLow: 'Encroaching hazel/juniper',
      lightHigh: 'Open esker/limestone sward',
      soilTitle: 'Calcareous soil depth',
      soilLow: 'Shallow rocky limestone',
      soilHigh: 'Deep neutral old pasture',
      maturityLow: 'Short grazed herb turf',
      maturityHigh: 'Species-rich sward + <25% shrub',
      exposureLow: 'Sheltered esker hollow',
      exposureHigh: 'Exposed dry ridge & heavy grazing',
    },
    formCue: 'Low dense species-rich turf (up to 45 spp/m²) · scattered <25% stunted juniper & hawthorn',
    rootCue: 'Fine fibrous root network in free-draining calcareous mineral soil',
    species: [
      { common: 'Blue Moor-grass & Quaking-grass', latin: 'Sesleria / Briza media', stratum: 'field', archetype: 'fine_turf_grass', dominancePct: 82, architecturalRole: 'Fine flower-rich grass matrix' },
      { common: 'Scattered Juniper / Hazel', latin: 'Juniperus / Corylus', stratum: 'shrub', archetype: 'gorse', dominancePct: 18, architecturalRole: 'Sparse <25% structural accents' },
    ],
  },
  {
    code: 'GS2',
    name: 'Dry meadows and grassy verges',
    group: 'G',
    subgroup: 'Semi-natural grassland',
    fossittPage: 30,
    pdfPage: 31,
    annexICode: '6510',
    substrate: 'calcareous_loam',
    maxNaturalHeightM: 1.7,
    minStuntedHeightM: 0.25,
    multiStemTendency: 0.3,
    idealParams: { light: 88, soil: 65, maturity: 76, exposure: 25 },
    sliderLabels: {
      lightLow: 'Hedgerow-shaded verge',
      lightHigh: 'Open unimproved hay meadow',
      soilTitle: 'Soil moisture & fertility',
      soilLow: 'Dry gravelly road embankment',
      soilHigh: 'Deep mesotrophic meadow loam',
      maturityLow: 'Post-hay-cut short aftermath',
      maturityHigh: 'Tall 1.5m flowering umbellifer tier',
      exposureLow: 'Sheltered meadow',
      exposureHigh: 'Wind-laid tall grass stems',
    },
    formCue: 'Two-tier architectural sward · tall tussocky False Oat-grass & Cow Parsley bound by climbing vetches',
    rootCue: 'Deep tussock-forming fibrous roots in unploughed mineral soils',
    species: [
      { common: 'False Oat-grass & Cock’s-foot', latin: 'Arrhenatherum / Dactylis', stratum: 'field', archetype: 'tall_meadow_grass', dominancePct: 64, architecturalRole: 'Tall tussock structural frame' },
      { common: 'Cow Parsley & Knapweed', latin: 'Anthriscus / Centaurea', stratum: 'field', archetype: 'tall_meadow_grass', dominancePct: 36, architecturalRole: 'Emergent umbel & flower heads' },
    ],
  },
  {
    code: 'GS4',
    name: 'Wet grassland',
    group: 'G',
    subgroup: 'Semi-natural grassland',
    fossittPage: 31,
    pdfPage: 32,
    annexICode: '6410',
    substrate: 'alluvial_gley',
    maxNaturalHeightM: 1.5,
    minStuntedHeightM: 0.25,
    multiStemTendency: 0.5,
    idealParams: { light: 90, soil: 80, maturity: 70, exposure: 35 },
    sliderLabels: {
      lightLow: 'Willow-fringed callow',
      lightHigh: 'Open floodplain meadow',
      soilTitle: 'Gley waterlogging & flood duration',
      soilLow: 'Damp clay-loam slope',
      soilHigh: 'Seasonally flooded Shannon callow',
      maturityLow: 'Grazed wet pasture',
      maturityHigh: 'Rush-tussock & iris architecture',
      exposureLow: 'Sheltered basin',
      exposureHigh: 'Exposed river callow',
    },
    formCue: 'Vertical rush clumps (Juncus) & Yellow Iris blades punctuating damp meadowsweet sward',
    rootCue: 'Shallow aerenchymatous roots in heavy poorly-drained gley soil',
    species: [
      { common: 'Soft & Jointed Rush', latin: 'Juncus effusus / articulatus', stratum: 'field', archetype: 'soft_rush', dominancePct: 52, architecturalRole: 'Vertical cylindrical tussocks' },
      { common: 'Meadowsweet & Yellow Iris', latin: 'Filipendula / Iris pseudacorus', stratum: 'field', archetype: 'tall_meadow_grass', dominancePct: 48, architecturalRole: 'Broadleaved wetland clump accent' },
    ],
  },

  // ================= COASTLAND =================
  {
    code: 'CD2',
    name: 'Marram dunes',
    group: 'C',
    subgroup: 'Sand dune systems',
    fossittPage: 75,
    pdfPage: 76,
    annexICode: '2120',
    substrate: 'dune_sand',
    maxNaturalHeightM: 1.4,
    minStuntedHeightM: 0.3,
    multiStemTendency: 0.9,
    idealParams: { light: 98, soil: 35, maturity: 65, exposure: 82 },
    sliderLabels: {
      lightLow: 'Overcast coastal mist',
      lightHigh: 'Blazing open mobile dune',
      soilTitle: 'Sand stability & moisture',
      soilLow: 'Dry mobile wind-blown sand',
      soilHigh: 'Damp dune-base transition',
      maturityLow: 'Embryonic sand-couch tuft',
      maturityHigh: 'Tall 15m marram-bound ridge',
      exposureLow: 'Leeward sheltered dune slope',
      exposureHigh: 'Severe Atlantic wind & blow-out',
    },
    formCue: 'Steep mobile sand ridges stitched together by dense arching Marram tussocks · bare sand blow-outs',
    rootCue: 'Multi-metre vertical & horizontal rhizome lattice stimulated by sand burial',
    species: [
      { common: 'Marram', latin: 'Ammophila arenaria', stratum: 'field', archetype: 'marram_grass', dominancePct: 76, architecturalRole: 'Sand-trapping arching tussocks' },
      { common: 'Sea-holly & Sand Sedge', latin: 'Eryngium / Carex arenaria', stratum: 'ground', archetype: 'fine_turf_grass', dominancePct: 24, architecturalRole: 'Linear rhizomatous sand runners' },
    ],
  },
  {
    code: 'CD4',
    name: 'Dune scrub and woodland',
    group: 'C',
    subgroup: 'Sand dune systems',
    fossittPage: 77,
    pdfPage: 78,
    annexICode: '2160',
    substrate: 'dune_sand',
    maxNaturalHeightM: 6.5,
    minStuntedHeightM: 1.2,
    multiStemTendency: 0.9,
    idealParams: { light: 72, soil: 48, maturity: 74, exposure: 78 },
    sliderLabels: {
      lightLow: 'Dense shaded scrub thicket',
      lightHigh: 'Open dune-hollow mosaic',
      soilTitle: 'Humus accumulation in dune sand',
      soilLow: 'Raw calcareous shell sand',
      soilHigh: 'Stabilised humus-rich dune',
      maturityLow: 'Early Burnet Rose & gorse',
      maturityHigh: 'Wind-planed coastal woodland',
      exposureLow: 'Sheltered hind-dune hollow',
      exposureHigh: 'Salt-spray sheared coastal edge',
    },
    formCue: 'Dramatic salt-sheared aerodynamic wedge canopy rising away from sea wind · spinose dune thicket',
    rootCue: 'Deep spreading roots anchoring stabilised calcareous sand ridges',
    species: [
      { common: 'Hawthorn & Sea-buckthorn', latin: 'Crataegus / Hippophae', stratum: 'shrub', archetype: 'hawthorn_blackthorn', dominancePct: 62, architecturalRole: 'Salt-pruned thorny wedge' },
      { common: 'Juniper & Elder', latin: 'Juniperus / Sambucus', stratum: 'shrub', archetype: 'gorse', dominancePct: 38, architecturalRole: 'Dune-fixing evergreen & woody' },
    ],
  },

  // ================= EXPOSED ROCK =================
  {
    code: 'ER2',
    name: 'Exposed calcareous rock',
    group: 'E',
    subgroup: 'Exposed rock',
    fossittPage: 60,
    pdfPage: 61,
    annexICode: '8240',
    annexIPriority: true,
    substrate: 'limestone_pavement',
    maxNaturalHeightM: 2.2,
    minStuntedHeightM: 0.15,
    multiStemTendency: 0.95,
    idealParams: { light: 94, soil: 22, maturity: 78, exposure: 75 },
    sliderLabels: {
      lightLow: 'Shaded vertical gryke microclimate',
      lightHigh: 'Exposed horizontal limestone clint',
      soilTitle: 'Gryke fissure soil pocket depth',
      soilLow: 'Bare shattered karst (>80% rock)',
      soilHigh: 'Soil-pocketed terraced pavement',
      maturityLow: 'Pioneer ferns & crust lichens',
      maturityHigh: 'Bonsai hazel & crevice flora',
      exposureLow: 'Sheltered limestone terrace',
      exposureHigh: 'Wind-scoured Burren plateau',
    },
    formCue: 'Architectural clint-and-gryke grid · woodland ferns & bonsai hazel hidden inside humid vertical fissures',
    rootCue: 'Compressed roots wedged deep inside cool moist limestone grykes',
    species: [
      { common: 'Bonsai Crevice Hazel', latin: 'Corylus avellana', stratum: 'shrub', archetype: 'hazel', dominancePct: 26, architecturalRole: 'Wind-planed gryke-rooted dwarf' },
      { common: 'Maidenhair & Hart’s-tongue', latin: 'Adiantum / Asplenium', stratum: 'field', archetype: 'woodland_ferns', dominancePct: 46, architecturalRole: 'Sheltered fissure fern tier' },
      { common: 'Mountain Avens & Moss', latin: 'Dryas octopetala', stratum: 'ground', archetype: 'bryophyte_rock', dominancePct: 28, architecturalRole: 'Prostrate clint-edge cushion' },
    ],
  },

  // ================= FRESHWATER SWAMPS =================
  {
    code: 'FS1',
    name: 'Reed and large sedge swamps',
    group: 'F',
    subgroup: 'Swamps',
    fossittPage: 25,
    pdfPage: 26,
    substrate: 'swamp_silt',
    maxNaturalHeightM: 3.1,
    minStuntedHeightM: 1.0,
    multiStemTendency: 0.8,
    idealParams: { light: 94, soil: 92, maturity: 75, exposure: 40 },
    sliderLabels: {
      lightLow: 'Dense self-shading reed wall',
      lightHigh: 'Open lakeside swamp fringe',
      soilTitle: 'Standing water depth & silt',
      soilLow: 'Saturated seasonal margin',
      soilHigh: 'Deep standing water (0.8m)',
      maturityLow: 'Early summer shoot emergence',
      maturityHigh: 'Tall dense plumed reedbed',
      exposureLow: 'Sheltered backwater bay',
      exposureHigh: 'Wave-washed lakeshore',
    },
    formCue: 'Monodominant vertical reed architecture (2–3m) · lacking understorey stratification · standing water',
    rootCue: 'Anaerobic mud & floating scraw rhizome mat submerged year-round',
    species: [
      { common: 'Common Reed & Bulrush', latin: 'Phragmites / Typha latifolia', stratum: 'field', archetype: 'common_reed', dominancePct: 76, architecturalRole: 'Dense unstratified vertical culms' },
      { common: 'Greater Tussock-sedge', latin: 'Carex paniculata', stratum: 'field', archetype: 'tussock_sedge', dominancePct: 24, architecturalRole: 'Mounded emergent pedestals' },
    ],
  },
];

export interface ArchitectureMetrics {
  canopyHeightM: number;
  clearStemRatioPct: number;
  crownSpreadRatio: number;
  rootDepthM: number;
  strataCount: number;
  windLeanDeg: number;
  deadwoodIndexPct: number;
  lightTransmissionPct: number;
}

export function computeArchitectureMetrics(
  habitat: FossittHabitat,
  params: HabitatParameters
): ArchitectureMetrics {
  const lightN = params.light / 100;
  const soilN = params.soil / 100;
  const matN = params.maturity / 100;
  const expN = params.exposure / 100;

  // Realistic developmental ontogeny:
  // Pioneer whips (matN < 0.2) start low (1.2-2.6m in woodlands), rising through pole stage to veteran height
  const juvenileBaseM = habitat.maxNaturalHeightM > 6 ? 1.15 : habitat.minStuntedHeightM * 0.55;
  const ageHeightCurve = Math.pow(matN, 0.88);
  const matureTargetM =
    habitat.minStuntedHeightM +
    (habitat.maxNaturalHeightM - habitat.minStuntedHeightM) * (0.45 + 0.55 * soilN);
  const heightPotential =
    juvenileBaseM + (matureTargetM - juvenileBaseM) * (0.04 + 0.96 * ageHeightCurve);

  const windSuppression = 1 - expN * (habitat.maxNaturalHeightM > 4 ? 0.52 : 0.65);
  const competitionBoost =
    habitat.maxNaturalHeightM > 4 ? 1 + (1 - lightN) * (0.06 + 0.12 * matN) : 1;
  const canopyHeightM = Math.max(
    0.08,
    Number((heightPotential * windSuppression * competitionBoost).toFixed(1))
  );

  // Clear stem ratio: whips/seedlings (matN < 0.2) have almost zero clear bole (feathered/leafy stems),
  // rising during pole stem-exclusion and leveling off in mature/veteran stands
  const baseClearStem =
    habitat.code === 'WD5'
      ? 48
      : habitat.maxNaturalHeightM < 3
      ? 0
      : Math.max(0, (1 - habitat.multiStemTendency) * 38);
  const ageBoleFactor = Math.max(0, Math.min(1, (matN - 0.12) / 0.58));
  const clearStemRatioPct = Math.round(
    Math.min(
      65,
      Math.max(
        0,
        baseClearStem * (0.55 + 0.65 * (1 - lightN)) * ageBoleFactor * (1 - expN * 0.45)
      )
    )
  );

  // Crown spread-to-height ratio: whips are narrow/vertical (~0.18-0.28x),
  // pole trees are slender conical (~0.4-0.55x), mature/veteran trees widen into broad sympodial crowns
  const ageSpreadFactor = 0.22 + 0.78 * Math.pow(matN, 0.85);
  const crownSpreadRatio = Number(
    (
      (0.32 +
        lightN * 0.55 +
        habitat.multiStemTendency * 0.22 +
        expN * 0.16) *
      ageSpreadFactor
    ).toFixed(2)
  );

  // Root depth: restricted by waterlogged peat/gley or shallow karst rock, deepest in calcareous/podzol loam
  const isWetRootRestricted =
    habitat.substrate === 'waterlogged_carr' ||
    habitat.substrate === 'deep_raised_peat' ||
    habitat.substrate === 'blanket_peat' ||
    habitat.substrate === 'alluvial_gley' ||
    habitat.substrate === 'swamp_silt';
  const maxRoot = isWetRootRestricted ? 0.65 : habitat.substrate === 'limestone_pavement' ? 1.15 : 2.3;
  const rootDepthM = Number(
    Math.max(0.14, maxRoot * (0.35 + 0.65 * (isWetRootRestricted ? 1 - soilN * 0.45 : soilN)) * (0.2 + 0.8 * matN)).toFixed(2)
  );

  // Vertical strata count (pioneer stands have 1-2 strata; mature woodlands up to 4-5 tiers)
  const rawStrata =
    habitat.code === 'WD5' || habitat.code === 'FS1'
      ? 2
      : habitat.group === 'W'
      ? 1 + Math.round(matN * 2.6 + (1 - expN * 0.5) * 0.6)
      : habitat.group === 'H' || habitat.group === 'P'
      ? 1 + (matN > 0.28 ? 1 : 0) + (matN > 0.6 ? 1 : 0)
      : 1 + (matN > 0.5 ? 1 : 0);
  const strataCount = Math.min(5, Math.max(1, rawStrata));

  const windLeanDeg = Math.round(expN * (habitat.code === 'WD5' ? 12 : 34));
  const deadwoodIndexPct =
    habitat.code === 'WD5'
      ? Math.round(matN * 12)
      : Math.round(Math.max(0, (matN - 0.38) * 1.38 * (1 + expN * 0.25)) * 100);
  const lightTransmissionPct = Math.round(
    Math.min(98, Math.max(4, lightN * 78 + (1 - matN) * 22 + (habitat.code === 'WN3' ? -15 : 0)))
  );

  return {
    canopyHeightM,
    clearStemRatioPct,
    crownSpreadRatio,
    rootDepthM,
    strataCount,
    windLeanDeg,
    deadwoodIndexPct: Math.min(100, deadwoodIndexPct),
    lightTransmissionPct,
  };
}
