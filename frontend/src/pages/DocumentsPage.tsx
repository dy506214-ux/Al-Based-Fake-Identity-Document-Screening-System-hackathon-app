import { useState, useEffect } from 'react'
import type { DocRecord } from '../types'
import { api } from '../api'

interface Props { onReview: (doc: DocRecord) => void }

const DOC_TYPES = ['All','Marksheet','Aadhaar Card','PAN Card','Certificate','ID Proof','Degree Certificate','Birth Certificate','Migration Certificate']
const STATUSES  = ['All','PENDING','VALIDATED','REJECTED','NEEDS_REVIEW']

export default function DocumentsPage({ onReview }: Props) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [docs, setDocs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const PER_PAGE = 20

  const loadDocuments = () => {
    setLoading(true)
    api.fetchDocuments({
      page,
      limit: PER_PAGE,
      search,
      documentType: typeFilter,
      validationStatus: statusFilter
    })
      .then(res => {
        setDocs(res.documents)
        setTotal(res.total)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadDocuments()
  }, [page, search, typeFilter, statusFilter])

  const totalPages = Math.ceil(total / PER_PAGE)

  const statusBadge = (s: string) => {
    const cls = s==='VALIDATED'?'badge-verified':s==='REJECTED'?'badge-rejected':(s==='PENDING' || s==='NEEDS_REVIEW')?'badge-review':'badge-pending'
    return <span className={cls} style={{ fontSize:10, padding:'2px 8px', borderRadius:3, fontWeight:600, letterSpacing:'0.04em', whiteSpace:'nowrap' }}>{s}</span>
  }

  const actionButton = (d: any) => {
    if (d.reviewStatus === 'PENDING' || d.validationStatus === 'NEEDS_REVIEW') {
      return (
        <button className="btn-saffron" style={{ padding:'5px 14px', borderRadius:4, fontSize:11, cursor:'pointer', fontWeight:600 }} onClick={() => onReview(d)}>
          Review
        </button>
      )
    }
    return (
      <button className="btn-ghost" style={{ padding:'5px 14px', borderRadius:4, fontSize:11, cursor:'pointer' }} onClick={() => onReview(d)}>
        View
      </button>
    )
  }

  return (
    <div style={{ padding:'24px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:'#e8e0d0', margin:0 }}>Document Verification</h1>
          <p style={{ fontSize:12, color:'#5a6a40', margin:'4px 0 0' }}>{total} documents matching filters</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-1" style={{ borderRadius:8, padding:'14px 16px', marginBottom:16 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', minWidth:220 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#3a4a22' }}>
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
              <line x1="8" y1="8" x2="11" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input className="admin-input" placeholder="Search user, document, ID…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
              style={{ width:'100%', padding:'7px 12px 7px 28px', fontSize:12 }}/>
          </div>
          <select className="admin-input" value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setPage(1)}} style={{ padding:'7px 10px', fontSize:12, cursor:'pointer', minWidth:160 }}>
            {DOC_TYPES.map(t => <option key={t} value={t} style={{ background:'#1d2113' }}>{t}</option>)}
          </select>
          <select className="admin-input" value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1)}} style={{ padding:'7px 10px', fontSize:12, cursor:'pointer', minWidth:140 }}>
            {STATUSES.map(s => <option key={s} value={s} style={{ background:'#1d2113' }}>{s}</option>)}
          </select>
          {(search||typeFilter!=='All'||statusFilter!=='All') && (
            <button className="btn-ghost" style={{ padding:'7px 12px', borderRadius:5, fontSize:11, cursor:'pointer' }} onClick={() => { setSearch(''); setTypeFilter('All'); setStatusFilter('All'); setPage(1) }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card-1" style={{ borderRadius:8, overflow:'hidden' }}>
        <table className="admin-table">
          <thead><tr>
            <th>Doc ID</th><th>User</th><th>Document Type</th><th>Status</th><th>Submitted</th><th>Verified By</th><th>Action</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign:'center', color:'#3a4a22', padding:32, fontSize:13 }}>Loading documents...</td></tr>
            ) : docs.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign:'center', color:'#3a4a22', padding:32, fontSize:13 }}>No documents match the current filters.</td></tr>
            ) : docs.map((d: any) => (
              <tr key={d._id}>
                <td style={{ fontFamily:'monospace', fontSize:11, color:'#3a5018' }}>{d._id.substring(0,8)}...</td>
                <td style={{ fontWeight:500, color:'#d0c8b8' }}>{d.user?.name || 'Unknown'}</td>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:24, height:24, borderRadius:4, background:'rgba(74,90,42,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="#6b7a40">
                        <path d="M2 1h6l3 3v7H2V1z"/><path d="M8 1v3h3" fill="none" stroke="#6b7a40" strokeWidth="0.8"/>
                      </svg>
                    </div>
                    <span style={{ color:'#b8b098' }}>{d.documentType}</span>
                  </div>
                </td>
                <td>{statusBadge(d.validationStatus || 'PENDING')}</td>
                <td style={{ color:'#4a5a30', fontSize:11 }}>{new Date(d.uploadedAt || d.createdAt).toLocaleDateString()}</td>
                <td style={{ color:'#5a6a40', fontSize:11 }}>{d.reviewedBy?.name || '—'}</td>
                <td>{actionButton(d)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid rgba(74,90,42,0.15)' }}>
            <span style={{ fontSize:12, color:'#4a5a30' }}>
              Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE,total)} of {total}
            </span>
            <div style={{ display:'flex', gap:4 }}>
              <button className="btn-ghost" disabled={page===1} onClick={()=>setPage(p=>p-1)} style={{ padding:'5px 10px', borderRadius:4, fontSize:12, cursor:page===1?'default':'pointer', opacity:page===1?0.4:1 }}>‹</button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(p => (
                <button key={p} onClick={()=>setPage(p)} style={{ padding:'5px 10px', borderRadius:4, fontSize:12, cursor:'pointer', background:page===p?'rgba(74,90,42,0.35)':'transparent', border:`1px solid ${page===p?'rgba(74,90,42,0.5)':'rgba(74,90,42,0.2)'}`, color:page===p?'#c0ce88':'#6a7a48' }}>{p}</button>
              ))}
              <button className="btn-ghost" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)} style={{ padding:'5px 10px', borderRadius:4, fontSize:12, cursor:page===totalPages?'default':'pointer', opacity:page===totalPages?0.4:1 }}>›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
