import { useState, useEffect } from 'react'
import { api } from '../api'

const ACTION_TYPES = ['All','VERIFICATION','LOGIN','UPDATE','SYSTEM']

export default function VerificationHistoryPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const PER_PAGE = 20

  const loadLogs = () => {
    setLoading(true)
    api.fetchAuditLogs({
      page,
      limit: PER_PAGE,
      search,
      action: typeFilter
    })
      .then(res => {
        setLogs(res.logs)
        setTotal(res.total)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadLogs()
  }, [page, search, typeFilter])

  const totalPages = Math.ceil(total / PER_PAGE)

  const resultBadge = (r: string) => {
    if (!r) return null;
    const cls = r==='VALIDATED'?'badge-verified':r==='REJECTED'?'badge-rejected':r==='PENDING'?'badge-pending':'badge-review'
    return <span className={cls} style={{ fontSize:10, padding:'2px 8px', borderRadius:3, fontWeight:600, letterSpacing:'0.04em' }}>{r}</span>
  }

  return (
    <div style={{ padding:'24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:'#e8e0d0', margin:0 }}>Audit & Verification History</h1>
          <p style={{ fontSize:12, color:'#5a6a40', margin:'4px 0 0' }}>{total} logs matching filters</p>
        </div>
      </div>

      <div className="card-1" style={{ borderRadius:8, padding:'14px 16px', marginBottom:16 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', minWidth:220 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#3a4a22' }}>
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
              <line x1="8" y1="8" x2="11" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input className="admin-input" placeholder="Search logs…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
              style={{ width:'100%', padding:'7px 12px 7px 28px', fontSize:12 }}/>
          </div>
          <select className="admin-input" value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setPage(1)}} style={{ padding:'7px 10px', fontSize:12, cursor:'pointer', minWidth:160 }}>
            {ACTION_TYPES.map(t => <option key={t} value={t} style={{ background:'#1d2113' }}>{t}</option>)}
          </select>
          {(search||typeFilter!=='All') && (
            <button className="btn-ghost" style={{ padding:'7px 12px', borderRadius:5, fontSize:11, cursor:'pointer' }} onClick={() => { setSearch(''); setTypeFilter('All'); setPage(1) }}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="card-1" style={{ borderRadius:8, overflow:'hidden' }}>
        <table className="admin-table">
          <thead><tr>
            <th>Log ID</th><th>Action</th><th>User / Officer</th><th>IP Address</th><th>Details</th><th>Date & Time</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign:'center', color:'#3a4a22', padding:32, fontSize:13 }}>Loading logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:'center', color:'#3a4a22', padding:32, fontSize:13 }}>No logs match the current filters.</td></tr>
            ) : logs.map(h => (
              <tr key={h._id}>
                <td style={{ fontFamily:'monospace', fontSize:11, color:'#3a5018' }}>{h._id.substring(0,8)}...</td>
                <td><span style={{ fontSize:11, fontWeight:600, color:'#b8b098', background:'rgba(255,255,255,0.05)', padding:'3px 6px', borderRadius:4 }}>{h.action}</span></td>
                <td style={{ fontWeight:500, color:'#d0c8b8' }}>{h.user?.name || h.performedBy?.name || 'System'}</td>
                <td style={{ color:'#7a8a60', fontSize:11 }}>{h.ipAddress || '—'}</td>
                <td style={{ fontSize:11, color:'#7a8a60' }}>
                  {h.details && (
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      <span style={{ color:'#c0ce88' }}>{h.details.documentType || h.details.action}</span>
                      {resultBadge(h.details.status)}
                    </div>
                  )}
                  {h.details?.reason && <span style={{ color:'#c87878', marginTop:4, display:'block' }}>Reason: {h.details.reason}</span>}
                </td>
                <td style={{ color:'#4a5a30', fontSize:11 }}>{new Date(h.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

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
