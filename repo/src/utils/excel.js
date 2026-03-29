import * as XLSX from 'xlsx'

// ── Strict Classification Engine (ported from Python) ──
export function getStrictType(title, sourceName) {
  const combined = `${sourceName || ''} ${title || ''}`.toUpperCase()
  if (['CONF', 'PROC', 'SYMP', 'WORKSHOP', 'INTL'].some(k => combined.includes(k))) return 'Conference'
  if (['BOOK', 'SPRINGER', 'CHAPTER', 'LECTURE NOTES'].some(k => combined.includes(k))) return 'Book_Chapter'
  if (['JOURNAL', 'TRANSACTIONS', 'LETTERS', 'IEEE', 'MDPI'].some(k => combined.includes(k))) return 'Journal'
  return 'Unmarked'
}

// ── Clean newlines/whitespace; return empty string if no real data ──
function clean(val) {
  if (!val || val === 'N/A' || val === 'null' || val === 'undefined') return ''
  return String(val).replace(/[\r\n]+/g, ' ').trim()
}

// ── Maps raw DB publication row → formatted Excel row ──
function formatPublicationRow(pub) {
  return {
    "Title": clean(pub.title),
    "Source / Journal": clean(pub.source_name),
    "Authors": clean(pub.authors_list),
    "Publication Year": pub.publication_year || '',
    "Academic Year": clean(pub.academic_year),
    "Department": clean(pub.department),
    "ISSN / ISBN": clean(pub.issn_isbn),
    "Volume / Issue / Pages": clean(pub.volume_issue_pages),
    "DOI": clean(pub.doi),
    "Paper URL": clean(pub.paper_url),
    "Abstract": clean(pub.abstract),
    "Scholar Citations": pub.scholar_citations || 0,
    "Scopus Citations": pub.scopus_citations || 0,
    "WoS Citations": pub.wos_citations || 0,
    "In Scholar": pub.in_scholar ? "Yes" : "No",
    "In Scopus": pub.in_scopus ? "Yes" : "No",
    "In WoS": pub.in_wos ? "Yes" : "No"
  }
}

// ── Maps raw DB master_authors row → formatted Excel row ──
function formatAuthorProfileRow(author) {
  return {
    "Faculty Name": clean(author.canonical_name),
    "Department": clean(author.department),
    "Organization": clean(author.preferred_organization),
    "ORCID": clean(author.orcid),
    "Scholar ID": clean(author.scholar_id),
    "Scopus ID": clean(author.scopus_id),
    "WoS Researcher ID": clean(author.wos_id),
    "Scholar Citations": author.scholar_citations || 0,
    "Scopus Citations": author.scopus_citations || 0,
    "WoS Citations": author.wos_citations || 0,
    "Scholar H-Index": author.scholar_h_index || 0,
    "Scopus H-Index": author.scopus_h_index || 0,
    "WoS H-Index": author.wos_h_index || 0,
    "Scholar i10-Index": author.scholar_i10_index || 0
  }
}

// ── Auto-size columns for publications ──
function formatPubColumns(ws) {
  ws['!cols'] = [
    { wch: 60 },  // Title
    { wch: 45 },  // Source
    { wch: 40 },  // Authors
    { wch: 14 },  // Pub Year
    { wch: 14 },  // Academic Year
    { wch: 14 },  // Department
    { wch: 18 },  // ISSN/ISBN
    { wch: 22 },  // Vol/Issue/Pages
    { wch: 28 },  // DOI
    { wch: 45 },  // Paper URL
    { wch: 40 },  // Abstract
    { wch: 16 },  // Scholar Cit
    { wch: 16 },  // Scopus Cit
    { wch: 16 },  // WoS Cit
    { wch: 12 },  // In Scholar
    { wch: 12 },  // In Scopus
    { wch: 12 },  // In WoS
  ]
}

// ── Auto-size columns for author profiles ──
function formatProfileColumns(ws) {
  ws['!cols'] = [
    { wch: 30 },  // Name
    { wch: 14 },  // Department
    { wch: 30 },  // Organization
    { wch: 22 },  // ORCID
    { wch: 22 },  // Scholar ID
    { wch: 22 },  // Scopus ID
    { wch: 22 },  // WoS ID
    { wch: 16 },  // Scholar Citations
    { wch: 16 },  // Scopus Citations
    { wch: 16 },  // WoS Citations
    { wch: 16 },  // Scholar H
    { wch: 16 },  // Scopus H
    { wch: 16 },  // WoS H
    { wch: 16 },  // i10
  ]
}

/**
 * Main Export Engine
 * @param {string} reportTitle - "Baby Vadlana" or "Institutional Master Report" 
 * @param {Array} authorProfiles - Array of raw master_authors rows (1 for faculty, N for institution)
 * @param {Array} rawPublications - Array of raw master_publications rows
 * @param {Object} filters - { yearStart, yearEnd, platform }
 */
export function generateExcelReport(reportTitle, authorProfiles, rawPublications, filters = {}) {
  // 0. Drop publications with no title (garbage rows)
  let filteredPubs = (rawPublications || []).filter(p => p.title && p.title.trim().length > 0)
  
  // 1. Pre-export Filtering
  if (filters.yearStart) {
    filteredPubs = filteredPubs.filter(p => !p.publication_year || p.publication_year >= filters.yearStart)
  }
  if (filters.yearEnd) {
    filteredPubs = filteredPubs.filter(p => !p.publication_year || p.publication_year <= filters.yearEnd)
  }
  if (filters.platform && filters.platform !== 'All') {
    if (filters.platform === 'Scholar') filteredPubs = filteredPubs.filter(p => p.in_scholar)
    if (filters.platform === 'Scopus') filteredPubs = filteredPubs.filter(p => p.in_scopus)
    if (filters.platform === 'WoS') filteredPubs = filteredPubs.filter(p => p.in_wos)
  }

  // 2. Strict Classification
  const processed = filteredPubs.map(p => ({ ...p, Category: getStrictType(p.title, p.source_name) }))

  const wb = XLSX.utils.book_new()
  const profiles = authorProfiles || []

  // ═══════════════════════════════════════════════
  // TAB 1: Faculty Profile(s)
  // ═══════════════════════════════════════════════
  if (profiles.length > 0) {
    const profileRows = profiles.map(formatAuthorProfileRow)
    const wsProfiles = XLSX.utils.json_to_sheet(profileRows)
    formatProfileColumns(wsProfiles)
    XLSX.utils.book_append_sheet(wb, wsProfiles, "Faculty Profiles")
  }

  // ═══════════════════════════════════════════════
  // TAB 2: Report Summary (Vertical Key-Value)
  // ═══════════════════════════════════════════════
  const totalScCit = processed.reduce((s, p) => s + (p.scholar_citations || 0), 0)
  const totalScoCit = processed.reduce((s, p) => s + (p.scopus_citations || 0), 0)
  const totalWosCit = processed.reduce((s, p) => s + (p.wos_citations || 0), 0)
  const journalCount = processed.filter(p => p.Category === 'Journal').length
  const confCount = processed.filter(p => p.Category === 'Conference').length
  const bookCount = processed.filter(p => p.Category === 'Book_Chapter').length
  const unmarkedCount = processed.filter(p => p.Category === 'Unmarked').length

  const summaryRows = [
    { "Metric": "Report Title", "Value": reportTitle },
    { "Metric": "Faculty Profiled", "Value": profiles.length },
    { "Metric": "", "Value": "" },
    { "Metric": "Total Publications (After Filters)", "Value": processed.length },
    { "Metric": "Journals", "Value": journalCount },
    { "Metric": "Conferences", "Value": confCount },
    { "Metric": "Book Chapters", "Value": bookCount },
    { "Metric": "Unmarked / Unclassified", "Value": unmarkedCount },
    { "Metric": "", "Value": "" },
    { "Metric": "Scholar Citations (Paper-Level Sum)", "Value": totalScCit },
    { "Metric": "Scopus Citations (Paper-Level Sum)", "Value": totalScoCit },
    { "Metric": "WoS Citations (Paper-Level Sum)", "Value": totalWosCit },
    { "Metric": "", "Value": "" },
    { "Metric": "⚠ SCOPUS DATA LIMITATION", "Value": "Due to restrictions imposed by the Scopus website, a maximum of 10 Scopus-indexed publications can be retrieved per faculty member. Additionally, paper URLs, individual citation counts, and other granular metadata from Scopus cannot be programmatically extracted. Scopus figures in this report may therefore be incomplete." },
    { "Metric": "", "Value": "" },
    { "Metric": "Report Generated", "Value": new Date().toLocaleString() },
    { "Metric": "Generated By", "Value": "AcademicPulsePro v2.0 — Faculty Research Portal" }
  ]
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
  wsSummary['!cols'] = [{ wch: 40 }, { wch: 55 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, "Report Summary")

  // ═══════════════════════════════════════════════
  // TAB 3: Master Dump (all publications, no category split)
  // ═══════════════════════════════════════════════
  const masterRows = processed.map(formatPublicationRow)
  const wsMaster = XLSX.utils.json_to_sheet(masterRows)
  formatPubColumns(wsMaster)
  XLSX.utils.book_append_sheet(wb, wsMaster, "All Publications")

  // ═══════════════════════════════════════════════
  // TABS 4-7: Category-Specific Sheets
  // ═══════════════════════════════════════════════
  const categories = ["Journal", "Conference", "Book_Chapter", "Unmarked"]
  categories.forEach(cat => {
    const catRows = processed.filter(p => p.Category === cat)
    if (catRows.length === 0) return
    const formattedRows = catRows.map(formatPublicationRow)
    const wsCat = XLSX.utils.json_to_sheet(formattedRows)
    formatPubColumns(wsCat)
    XLSX.utils.book_append_sheet(wb, wsCat, cat)
  })

  // ═══════════════════════════════════════════════
  // TRIGGER DOWNLOAD
  // ═══════════════════════════════════════════════
  const safeName = (reportTitle || 'Export').replace(/\s+/g, '_')
  const fileName = `AcademicPulse_${safeName}.xlsx`
  XLSX.writeFile(wb, fileName)
}
