import { useRef, useState } from 'react';
import { ControlDeck } from './components/ControlDeck';
import { FossittPdfView } from './components/FossittPdfView';
import { HabitatCanvas, HabitatCanvasHandle } from './components/HabitatCanvas';
import { MorphologyIndex } from './components/MorphologyIndex';
import { StrataStrip } from './components/StrataStrip';
import { SuccessionStrip } from './components/SuccessionStrip';
import {
  FOSSITT_HABITATS,
  FossittHabitat,
  HABITAT_GROUPS,
  HabitatGroupId,
  HabitatParameters,
} from './data/fossittHabitats';
import { RenderMode } from './engine/habitatRenderer';

type ActiveTab = 'studio' | 'index' | 'succession' | 'pdf';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [selectedGroup, setSelectedGroup] = useState<HabitatGroupId>('W');
  const [selectedHabitat, setSelectedHabitat] = useState<FossittHabitat>(
    FOSSITT_HABITATS[0]
  );
  const [params, setParams] = useState<HabitatParameters>(
    FOSSITT_HABITATS[0].idealParams
  );
  const [renderMode, setRenderMode] = useState<RenderMode>('textured');
  const [compareCode, setCompareCode] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);

  const compareHabitat = compareCode
    ? FOSSITT_HABITATS.find((h) => h.code === compareCode) ?? null
    : null;

  const canvasRef = useRef<HabitatCanvasHandle>(null);

  const groupHabitats = FOSSITT_HABITATS.filter(
    (h) => h.group === selectedGroup
  );

  const handleSelectGroup = (groupId: HabitatGroupId) => {
    setSelectedGroup(groupId);
    const first = FOSSITT_HABITATS.find((h) => h.group === groupId);
    if (first) {
      setSelectedHabitat(first);
      setParams({ ...first.idealParams });
      if (compareCode === first.code) setCompareCode(null);
    }
  };

  const handleSelectHabitat = (habitat: FossittHabitat) => {
    setSelectedGroup(habitat.group);
    setSelectedHabitat(habitat);
    setParams({ ...habitat.idealParams });
    if (compareCode === habitat.code) setCompareCode(null);
  };

  const handleOpenFromIndex = (habitat: FossittHabitat) => {
    handleSelectHabitat(habitat);
    setActiveTab('studio');
  };

  const handleApplyStageInStudio = (stageParams: HabitatParameters) => {
    setParams({ ...stageParams });
    setActiveTab('studio');
  };

  const handleExportSection = () => {
    if (activeTab !== 'studio') {
      setActiveTab('studio');
      setTimeout(() => {
        canvasRef.current?.exportPng();
      }, 120);
      return;
    }
    canvasRef.current?.exportPng();
  };

  const navItems: Array<{ id: ActiveTab; label: string }> = [
    { id: 'studio', label: 'Habitat Studio' },
    { id: 'index', label: 'Morphology Index' },
    { id: 'succession', label: 'Succession Strip' },
    { id: 'pdf', label: 'Fossitt PDF' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4EF] text-[#18201C]">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 bg-[#F5F4EF]/95 backdrop-blur-xs border-b border-[#DCD9CF]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className="font-display text-lg font-semibold tracking-tight text-[#18201C] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Fossitt Atlas
          </button>

          <nav
            aria-label="Primary sections"
            className="flex items-center gap-6 overflow-x-auto"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[#18201C] border-[#2D5A3D]'
                      : 'text-[#555E58] border-transparent hover:text-[#18201C]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleExportSection}
              className="px-4 py-2 text-xs font-medium rounded-md bg-[#18201C] text-white hover:bg-[#2D5A3D] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              Export Section
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {activeTab === 'studio' && (
          <>
            {/* Fossitt Classification Selector Toolbar */}
            <section
              aria-label="Fossitt habitat selector"
              className="bg-white border border-[#DCD9CF] rounded-lg p-3 space-y-2.5"
            >
              <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EBE9E2] rounded-md w-fit">
                {HABITAT_GROUPS.map((grp) => {
                  const isActive = selectedGroup === grp.id;
                  return (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => handleSelectGroup(grp.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-white text-[#18201C] shadow-xs'
                          : 'text-[#555E58] hover:text-[#18201C]'
                      }`}
                    >
                      {grp.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {groupHabitats.map((hab) => {
                  const isSelected = hab.code === selectedHabitat.code;
                  return (
                    <button
                      key={hab.code}
                      type="button"
                      onClick={() => handleSelectHabitat(hab)}
                      className={`px-3 py-1.5 text-xs rounded border whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#2D5A3D] text-white border-[#2D5A3D]'
                          : 'bg-[#FAF9F5] text-[#3E4742] border-[#E2DFD5] hover:border-[#18201C] hover:text-[#18201C]'
                      }`}
                    >
                      <span
                        className={`font-mono font-medium ${
                          isSelected ? 'text-white/90' : 'text-[#2D5A3D]'
                        }`}
                      >
                        {hab.code}
                      </span>
                      <span>{hab.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Two-Zone Sandbox Layout: Interactive Architectural Stage + Parametric Sliders */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_380px] gap-5 items-start">
              <div className="space-y-5 min-w-0">
                <HabitatCanvas
                  ref={canvasRef}
                  habitat={selectedHabitat}
                  params={params}
                  mode={renderMode}
                  onModeChange={setRenderMode}
                  compareCode={compareCode}
                  compareHabitat={compareHabitat}
                  onCompareCodeChange={setCompareCode}
                  showLabels={showLabels}
                  onToggleLabels={() => setShowLabels((prev) => !prev)}
                  onResetIdeal={() =>
                    setParams({ ...selectedHabitat.idealParams })
                  }
                />

                <StrataStrip habitat={selectedHabitat} />
              </div>

              <ControlDeck
                habitat={selectedHabitat}
                params={params}
                onChange={setParams}
                onApplyPreset={(preset) => setParams({ ...preset })}
              />
            </div>
          </>
        )}

        {activeTab === 'index' && (
          <MorphologyIndex
            selectedCode={selectedHabitat.code}
            onSelectHabitat={handleOpenFromIndex}
          />
        )}

        {activeTab === 'succession' && (
          <SuccessionStrip
            habitat={selectedHabitat}
            mode={renderMode}
            onApplyStageInStudio={handleApplyStageInStudio}
          />
        )}

        {activeTab === 'pdf' && <FossittPdfView habitat={selectedHabitat} />}
      </main>
    </div>
  );
}
