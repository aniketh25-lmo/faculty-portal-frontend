import ActionButtons from './ActionButtons'

export default function Hero() {
  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <div className="text-center max-w-3xl space-y-10">
        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
          Academic Publication Intelligence
        </h2>
        <p className="text-slate-400 text-lg leading-relaxed">
          Automated extraction, consolidation, and analytics of faculty research
          publications from Google Scholar, Scopus, and Web of Science.
        </p>
        <ActionButtons />
      </div>
    </main>
  )
}
