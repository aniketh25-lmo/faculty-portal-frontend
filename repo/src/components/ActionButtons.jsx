import { useState } from 'react'

import { BACKEND_URL, SCRAPER_URL } from '../constants'

export default function ActionButtons() {
  const [status, setStatus] = useState('')

  async function downloadPublications() {
    setStatus('Generating Excel from database...')
    try {
      const response = await fetch(`${BACKEND_URL}/export/publications`)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = 'publications_master.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      setStatus('Download started ✔')
    } catch (err) {
      console.error(err)
      setStatus('Download failed ❌ (backend waking up?)')
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-6 justify-center pt-6">
        <a
          href={SCRAPER_URL}
          className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 transition shadow-lg shadow-blue-600/30 text-lg font-semibold text-center"
        >
          Download Academic Pulse Pro v3.0
        </a>

        <button
          onClick={downloadPublications}
          className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/30 text-lg font-semibold"
        >
          Download Consolidated Report
        </button>
      </div>

      {status && (
        <p className="text-sm text-slate-500 pt-4">{status}</p>
      )}
    </>
  )
}
