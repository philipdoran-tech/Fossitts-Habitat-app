import { FossittHabitat } from '../data/fossittHabitats';

interface FossittPdfViewProps {
  habitat: FossittHabitat;
}

export function FossittPdfView({ habitat }: FossittPdfViewProps) {
  const pdfUrl = `/assets/aistudio/A_Guide_to_Habitats_in_Ireland_-_Fossitt_4b771c66.pdf#page=${habitat.pdfPage}`;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCD9CF] pb-4">
        <div>
          <div className="text-xs font-mono text-[#2D5A3D]">
            {habitat.code} · Book p. {habitat.fossittPage} (PDF page {habitat.pdfPage})
          </div>
          <h1 className="font-display text-2xl font-semibold text-[#18201C] mt-1">
            A Guide to Habitats in Ireland — Julie A. Fossitt (2000)
          </h1>
        </div>

        <a
          href={`/assets/aistudio/A_Guide_to_Habitats_in_Ireland_-_Fossitt_4b771c66.pdf#page=${habitat.pdfPage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 text-xs font-medium rounded-md bg-[#18201C] text-white hover:bg-[#2D5A3D] whitespace-nowrap shrink-0 transition-colors"
        >
          Open Full PDF in Tab
        </a>
      </div>

      <div className="bg-white border border-[#DCD9CF] rounded-lg overflow-hidden h-[680px]">
        <iframe
          key={habitat.code}
          src={pdfUrl}
          title={`Fossitt Guide to Habitats in Ireland — ${habitat.code} ${habitat.name}`}
          className="w-full h-full border-0"
        />
      </div>
    </section>
  );
}
