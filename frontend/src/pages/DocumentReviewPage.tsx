import { useState } from 'react'
import { api } from '../api'

interface Props { doc: any; onBack: () => void }

/* ── Mock OCR data for the preview ─────────────────── */
const OCR_FIELDS = [
  { field:'Full Name',     user:'Prakhar Sharma',       official:'Prakhar Sharma',       status:'match'   },
  { field:'Date of Birth', user:'12/05/2005',            official:'12/05/2005',            status:'match'   },
  { field:'Roll Number',   user:'2024001234',            official:'2024001234',            status:'match'   },
  { field:'School',        user:'DAV Public School',     official:'DAV Public School',     status:'match'   },
  { field:'Board',         user:'CBSE',                  official:'CBSE',                  status:'match'   },
  { field:'Year',          user:'2024',                  official:'2024',                  status:'match'   },
  { field:'Total Marks',   user:'450/500',               official:'450/500',               status:'match'   },
  { field:'Grade',         user:'A+',                    official:'A+',                    status:'match'   },
]

const MISMATCH_OCR_FIELDS = [
  { field:'Full Name',     user:'Rahul Kumar',           official:'Rahul Verma',           status:'mismatch' },
  { field:'Date of Birth', user:'15/08/2004',            official:'15/08/2004',            status:'match'    },
  { field:'Roll Number',   user:'2023005678',            official:'2023005679',            status:'mismatch' },
  { field:'School',        user:'Kendriya Vidyalaya',    official:'Kendriya Vidyalaya',    status:'match'    },
  { field:'Board',         user:'CBSE',                  official:'CBSE',                  status:'match'    },
  { field:'Year',          user:'2023',                  official:'2023',                  status:'match'    },
  { field:'Total Marks',   user:'385/500',               official:'385/500',               status:'match'    },
  { field:'Grade',         user:'B+',                    official:'B+',                    status:'match'    },
]

const AI_SCORES_MATCH = { authenticity:94, ocr:98, dataMatch:100, similarity:96 }
const AI_SCORES_MISMATCH = { authenticity:42, ocr:96, dataMatch:62, similarity:71 }

const REJECTION_REASONS = [
  'Information mismatch',
  'Document unclear',
  'Invalid document',
  'Missing information',
  'Suspected forgery',
  'Other',
]

/* ── Document paper mockup ───────────────────────── */
const MarksheetMockup = ({ isOfficial, mismatch }: { isOfficial: boolean; mismatch?: boolean }) => {
  const name = mismatch ? (isOfficial ? 'Rahul Verma' : 'Rahul Kumar') : 'Prakhar Sharma'
  const roll = mismatch ? (isOfficial ? '2023005679' : '2023005678') : '2024001234'
  const year = mismatch ? '2023' : '2024'
  const bg = isOfficial ? '#f8f4ea' : '#f5f0e6'
  return (
    <div style={{ background: bg, color:'#1a1a12', borderRadius:4, padding:'20px 22px', minHeight:360, fontSize:10, fontFamily:'"Times New Roman",serif', position:'relative', overflow:'hidden' }}>
      {/* Watermark */}
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%) rotate(-30deg)', fontSize:48, fontWeight:900, color:'rgba(0,100,0,0.04)', whiteSpace:'nowrap', pointerEvents:'none', letterSpacing:4 }}>
        {isOfficial ? 'OFFICIAL' : 'SUBMITTED'}
      </div>
      {/* Header */}
      <div style={{ textAlign:'center', borderBottom:'2px solid #1a4a0a', paddingBottom:12, marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', border:'2px solid #1a4a0a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:900, color:'#1a4a0a', textAlign:'center', lineHeight:1.1 }}>
            CBSE<br/>INDIA
          </div>
        </div>
        <div style={{ fontSize:13, fontWeight:700, letterSpacing:2, color:'#1a1a12' }}>CENTRAL BOARD OF SECONDARY EDUCATION</div>
        <div style={{ fontSize:10, color:'#4a4a3a', letterSpacing:1 }}>NEW DELHI – 110092</div>
        <div style={{ fontSize:11, fontWeight:600, marginTop:6, color:'#1a3a0a' }}>MARK SHEET – CLASS X EXAMINATION, {year}</div>
      </div>
      {/* Student info */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:14 }}>
        {[['Student Name',name],['Roll Number',roll],['School','DAV Public School, Delhi'],['Date of Birth',mismatch?'15/08/2004':'12/05/2005']].map(([l,v]) => (
          <div key={l}>
            <span style={{ color:'#6a6a52', fontWeight:600 }}>{l}: </span>
            <span style={{ color:'#1a1a0a', fontWeight:mismatch&&l==='Student Name'&&!isOfficial?700:400 }}>{v}</span>
          </div>
        ))}
      </div>
      {/* Marks table */}
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:9 }}>
        <thead>
          <tr style={{ background:'#1a4a0a', color:'#fff' }}>
            {['Subject','Max Marks','Marks Obt.','Grade'].map(h => <th key={h} style={{ padding:'5px 7px', textAlign:'left', fontWeight:700 }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {[['English','100',mismatch?'78':'88','A+'],['Hindi','100',mismatch?'72':'85','A+'],['Mathematics','100',mismatch?'88':'95','A+'],['Science','100',mismatch?'75':'90','A+'],['Social Studies','100',mismatch?'72':'92','A+']].map(([s,m,o,g]) => (
            <tr key={s} style={{ background:'#f5f0e2', borderBottom:'1px solid #d0c8a0' }}>
              {[s,m,o,g].map((v,i) => <td key={i} style={{ padding:'4px 7px', color:'#2a2a18' }}>{v}</td>)}
            </tr>
          ))}
          <tr style={{ background:'#e8e0c8', fontWeight:700 }}>
            <td style={{ padding:'5px 7px' }}>TOTAL</td>
            <td style={{ padding:'5px 7px' }}>500</td>
            <td style={{ padding:'5px 7px' }}>{mismatch?'385':'450'}</td>
            <td style={{ padding:'5px 7px' }}>{mismatch?'B+':'A+'}</td>
          </tr>
        </tbody>
      </table>
      {/* Footer */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:18, paddingTop:10, borderTop:'1px solid #c0b890' }}>
        <div>
          <div style={{ borderTop:'1px solid #2a2a18', width:100, marginTop:20, paddingTop:4, fontSize:8, textAlign:'center' }}>Controller of Examinations</div>
        </div>
        <div style={{ textAlign:'right', fontSize:8, color:'#6a6a52' }}>
          <div>Printed: {isOfficial?'Authorised Copy':'Scanned Copy'}</div>
          <div>Verify at: cbse.gov.in</div>
        </div>
        {isOfficial && (
          <div style={{ width:40, height:40, borderRadius:'50%', border:'2px solid #1a4a0a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:6, color:'#1a4a0a', textAlign:'center', marginTop:-8 }}>
            OFFICIAL<br/>SEAL
          </div>
        )}
      </div>
    </div>
  )
}

/* ── AI score ring ───────────────────────────────── */
const ScoreRing = ({ value, label, color }: { value:number; label:string; color:string }) => {
  const r = 28, c = 2*Math.PI*r, filled = (value/100)*c
  return (
    <div style={{ textAlign:'center' }}>
      <svg width="72" height="72" viewBox="0 0 72 72" style={{ display:'block', margin:'0 auto 6px' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(74,90,42,0.15)" strokeWidth="6"/>
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${filled} ${c}`} strokeLinecap="round"
          style={{ transform:'rotate(-90deg)', transformOrigin:'center' }}/>
        <text x="36" y="41" textAnchor="middle" fontSize="14" fontWeight="800" fill={color}>{value}</text>
      </svg>
      <div style={{ fontSize:10, color:'#6a7a50', lineHeight:1.3 }}>{label}</div>
    </div>
  )
}

/* ── Document panel ──────────────────────────────── */
const DocPanel = ({ title, badge, isOfficial, mismatch }: { title:string; badge:string; isOfficial:boolean; mismatch?:boolean }) => {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [scanning, setScanning] = useState(false)

  const triggerScan = () => { setScanning(true); setTimeout(()=>setScanning(false),2500) }

  return (
    <div className="card-2" style={{ borderRadius:8, display:'flex', flexDirection:'column', overflow:'hidden', flex:1 }}>
      {/* Panel header */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(74,90,42,0.2)', background:'rgba(26,30,18,0.6)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:24, height:24, borderRadius:4, background:isOfficial?'rgba(58,138,72,0.2)':'rgba(42,90,138,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill={isOfficial?'#68c87a':'#7899cc'}>
              <path d="M2 1h6l3 3v7H2V1z"/><path d="M8 1v3h3" fill="none" stroke={isOfficial?'#68c87a':'#7899cc'} strokeWidth="0.7"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'#e8e0d0' }}>{title}</div>
            <div style={{ fontSize:10, color:'#4a5a30' }}>{badge}</div>
          </div>
        </div>
        {/* Controls */}
        <div style={{ display:'flex', gap:4 }}>
          {[
            { tip:'Zoom In',  icon:<path d="M5 2a3 3 0 1 0 0 6A3 3 0 0 0 5 2zM1.5 5h7M5 1.5v7M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>, action:()=>setZoom(z=>Math.min(z+0.2,3)) },
            { tip:'Zoom Out', icon:<path d="M5 2a3 3 0 1 0 0 6A3 3 0 0 0 5 2zM1.5 5h7M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>, action:()=>setZoom(z=>Math.max(z-0.2,0.5)) },
            { tip:'Rotate',   icon:<path d="M9 3A5 5 0 1 0 9.5 7M9 3V1M9 3H7" stroke="currentColor" strokeWidth="1.2" fill="none"/>, action:()=>setRotation(r=>(r+90)%360) },
            { tip:'Reset',    icon:<><line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2"/><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.2"/></>, action:()=>{setZoom(1);setRotation(0)} },
          ].map(({tip,icon,action}) => (
            <button key={tip} onClick={action} title={tip} style={{ width:26, height:26, borderRadius:4, background:'rgba(74,90,42,0.12)', border:'1px solid rgba(74,90,42,0.25)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#7a8a58' }}>
              <svg width="12" height="12" viewBox="0 0 12 12">{icon}</svg>
            </button>
          ))}
          <button onClick={triggerScan} title="AI Scan" style={{ padding:'0 8px', height:26, borderRadius:4, background:'rgba(255,153,51,0.12)', border:'1px solid rgba(255,153,51,0.25)', cursor:'pointer', fontSize:9, color:'#FF9933', fontWeight:700 }}>
            SCAN
          </button>
        </div>
      </div>

      {/* Document viewport */}
      <div style={{ flex:1, overflow:'hidden', background:'#0d0f08', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', minHeight:280, padding:16 }}>
        {scanning && (
          <div className="animate-scan" style={{ position:'absolute', left:16, right:16, height:2, background:'linear-gradient(90deg,transparent,#FF9933,transparent)', zIndex:10, pointerEvents:'none' }}/>
        )}
        <div style={{ transform:`scale(${zoom}) rotate(${rotation}deg)`, transition:'transform 0.2s ease', transformOrigin:'center', maxWidth:'100%' }}>
          <MarksheetMockup isOfficial={isOfficial} mismatch={mismatch}/>
        </div>
        <div style={{ position:'absolute', bottom:8, right:8, fontSize:9, color:'#2a3818', background:'rgba(0,0,0,0.4)', padding:'2px 6px', borderRadius:3 }}>
          {Math.round(zoom*100)}% · {rotation}°
        </div>
      </div>
    </div>
  )
}

export default function DocumentReviewPage({ doc, onBack }: Props) {
  const isMismatch = doc.validationStatus === 'REJECTED' || doc.riskLevel === 'HIGH' || doc.riskLevel === 'CRITICAL'
  const ocrFields = isMismatch ? MISMATCH_OCR_FIELDS : OCR_FIELDS
  const aiScores = isMismatch ? AI_SCORES_MISMATCH : AI_SCORES_MATCH
  const overallStatus = isMismatch ? 'mismatch' : doc.validationStatus === 'NEEDS_REVIEW' ? 'review' : 'match'

  const [decision, setDecision] = useState<'VALIDATED'|'REJECTED'|'NEEDS_REVIEW'|null>(
    doc.validationStatus === 'VALIDATED' ? 'VALIDATED' : doc.validationStatus === 'REJECTED' ? 'REJECTED' : null
  )
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejReasons, setRejReasons] = useState<string[]>([])
  const [rejNote, setRejNote] = useState('')
  const [confirmed, setConfirmed] = useState(doc.reviewStatus === 'COMPLETED')
  const [submitting, setSubmitting] = useState(false)

  const matchCount = ocrFields.filter(f=>f.status==='match').length
  const mismatchCount = ocrFields.filter(f=>f.status==='mismatch').length

  const submitAction = async (newStatus: 'VALIDATED'|'REJECTED'|'NEEDS_REVIEW', comment: string = '') => {
    setSubmitting(true)
    try {
      await api.submitReview(doc._id, newStatus, comment)
      setDecision(newStatus)
      setConfirmed(true)
      setShowRejectModal(false)
    } catch (err) {
      console.error('Failed to submit review', err)
      alert('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmReject = () => {
    if (rejReasons.length === 0 && !rejNote.trim()) return
    const reasonText = [...rejReasons, rejNote].filter(Boolean).join('; ')
    submitAction('REJECTED', reasonText)
  }

  const handleApprove = () => submitAction('VALIDATED')
  const handleReview = () => submitAction('NEEDS_REVIEW')

  const StatusCard = () => {
    if (overallStatus === 'match') return (
      <div style={{ background:'rgba(58,138,72,0.12)', border:'1px solid rgba(58,138,72,0.3)', borderRadius:8, padding:'20px 24px', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:8 }}>✅</div>
        <div style={{ fontSize:18, fontWeight:800, color:'#68c87a', letterSpacing:'0.06em' }}>MATCHED</div>
        <div style={{ fontSize:12, color:'#5a8a60', marginTop:6 }}>All required information matches the official document.</div>
        <div style={{ fontSize:11, color:'#3a5a38', marginTop:4 }}>{matchCount}/{ocrFields.length} fields verified</div>
      </div>
    )
    if (overallStatus === 'mismatch') return (
      <div style={{ background:'rgba(138,56,56,0.12)', border:'1px solid rgba(138,56,56,0.3)', borderRadius:8, padding:'20px 24px', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:8 }}>❌</div>
        <div style={{ fontSize:18, fontWeight:800, color:'#c87878', letterSpacing:'0.06em' }}>MISMATCH DETECTED</div>
        <div style={{ fontSize:12, color:'#8a5858', marginTop:6 }}>Multiple information fields do not match the official document.</div>
        <div style={{ fontSize:11, color:'#6a3838', marginTop:4 }}>{mismatchCount} mismatch{mismatchCount>1?'es':''} · {matchCount} fields matched</div>
      </div>
    )
    return (
      <div style={{ background:'rgba(138,100,32,0.12)', border:'1px solid rgba(138,100,32,0.3)', borderRadius:8, padding:'20px 24px', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:8 }}>⚠️</div>
        <div style={{ fontSize:18, fontWeight:800, color:'#cc9944', letterSpacing:'0.06em' }}>NEEDS MANUAL REVIEW</div>
        <div style={{ fontSize:12, color:'#8a7040', marginTop:6 }}>The system detected inconsistencies requiring administrator review.</div>
      </div>
    )
  }

  return (
    <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:20 }}>
      {/* Back + title */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onBack} className="btn-ghost" style={{ padding:'7px 12px', borderRadius:6, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="8,2 3,6 8,10"/></svg>
          Back
        </button>
        <div>
          <h1 style={{ fontSize:18, fontWeight:700, color:'#e8e0d0', margin:0 }}>Document Review — {doc.documentType}</h1>
          <p style={{ fontSize:11, color:'#5a6a40', margin:'3px 0 0' }}>User: {doc.user?.name || 'Unknown'} · {doc._id} · Submitted: {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}</p>
        </div>
        <div style={{ flex:1 }}/>
        {confirmed && (
          <div style={{ padding:'6px 14px', borderRadius:6, background:decision==='VALIDATED'?'rgba(58,138,72,0.15)':decision==='REJECTED'?'rgba(138,56,56,0.15)':'rgba(138,100,32,0.15)', border:`1px solid ${decision==='VALIDATED'?'rgba(58,138,72,0.3)':decision==='REJECTED'?'rgba(138,56,56,0.3)':'rgba(138,100,32,0.3)'}`, fontSize:12, fontWeight:700, color:decision==='VALIDATED'?'#68c87a':decision==='REJECTED'?'#c87878':'#cc9944' }}>
            {decision==='VALIDATED'?'✓ VERIFIED':decision==='REJECTED'?'✕ REJECTED':'⚠ FLAGGED FOR REVIEW'}
          </div>
        )}
      </div>

      {/* ── Two documents side by side ────────────── */}
      <div>
        <div style={{ fontSize:12, fontWeight:700, color:'#8b9a5a', letterSpacing:'0.1em', marginBottom:10 }}>DOCUMENT COMPARISON</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <DocPanel title="User Submitted Document" badge="Submitted by user for verification" isOfficial={false} mismatch={isMismatch}/>
          <DocPanel title="Official Reference Document" badge="Verified official record from authority" isOfficial={true} mismatch={isMismatch}/>
        </div>
      </div>

      {/* ── OCR Comparison ───────────────────────── */}
      <div className="card-2" style={{ borderRadius:8, padding:'20px' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#e8e0d0', marginBottom:4 }}>OCR Extraction Comparison</div>
        <div style={{ fontSize:11, color:'#5a6a40', marginBottom:16 }}>Extracted text from both documents, field-by-field analysis</div>
        <table className="admin-table" style={{ tableLayout:'fixed' }}>
          <colgroup>
            <col style={{ width:'22%' }}/>
            <col style={{ width:'30%' }}/>
            <col style={{ width:'30%' }}/>
            <col style={{ width:'18%' }}/>
          </colgroup>
          <thead><tr>
            <th>Field</th><th>User Document</th><th>Official Document</th><th>Result</th>
          </tr></thead>
          <tbody>
            {ocrFields.map(f => (
              <tr key={f.field} style={{ background:f.status==='mismatch'?'rgba(138,56,56,0.07)':'transparent' }}>
                <td style={{ fontWeight:600, color:'#8b9a5a' }}>{f.field}</td>
                <td style={{ color:f.status==='mismatch'?'#c87878':'#d0c8b8', fontWeight:f.status==='mismatch'?600:400 }}>{f.user}</td>
                <td style={{ color:f.status==='mismatch'?'#c87878':'#d0c8b8', fontWeight:f.status==='mismatch'?600:400 }}>{f.official}</td>
                <td>
                  {f.status === 'match' && (
                    <span style={{ display:'flex', alignItems:'center', gap:5, color:'#68c87a', fontSize:12, fontWeight:700 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#68c87a" strokeWidth="2"><polyline points="2.5,7 5.5,10 11.5,4"/></svg>
                      MATCHED
                    </span>
                  )}
                  {f.status === 'mismatch' && (
                    <span style={{ display:'flex', alignItems:'center', gap:5, color:'#c87878', fontSize:12, fontWeight:700 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#c87878" strokeWidth="2"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg>
                      MISMATCH
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── AI Analysis ──────────────────────────── */}
      <div className="card-2" style={{ borderRadius:8, padding:'20px' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#e8e0d0', marginBottom:4 }}>AI / OCR Analysis</div>
        <div style={{ fontSize:11, color:'#5a6a40', marginBottom:20 }}>Multi-layer forensic analysis powered by VeriDoc AI Engine v3.2</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
          <ScoreRing value={aiScores.authenticity} label="Authenticity Score" color={aiScores.authenticity>80?'#68c87a':aiScores.authenticity>60?'#cc9944':'#c87878'}/>
          <ScoreRing value={aiScores.ocr} label="OCR Confidence" color="#7899cc"/>
          <ScoreRing value={aiScores.dataMatch} label="Data Match Score" color={aiScores.dataMatch===100?'#68c87a':aiScores.dataMatch>70?'#cc9944':'#c87878'}/>
          <ScoreRing value={aiScores.similarity} label="Document Similarity" color={aiScores.similarity>80?'#68c87a':'#cc9944'}/>
        </div>
        <div style={{ marginTop:20, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {[
            { label:'Suspicious Regions Detected', value: isMismatch?'2 regions':'None detected', color:isMismatch?'#c87878':'#68c87a' },
            { label:'Detected Inconsistencies', value: isMismatch?'Name & Roll Number mismatch':'No inconsistencies', color:isMismatch?'#c87878':'#68c87a' },
            { label:'Font Analysis', value: isMismatch?'Minor variations detected':'Fonts consistent', color:isMismatch?'#cc9944':'#68c87a' },
          ].map(item => (
            <div key={item.label} style={{ background:'rgba(42,50,24,0.4)', borderRadius:6, padding:'12px 14px', border:'1px solid rgba(74,90,42,0.18)' }}>
              <div style={{ fontSize:10, color:'#4a5a30', fontWeight:600, letterSpacing:'0.06em', marginBottom:4 }}>{item.label.toUpperCase()}</div>
              <div style={{ fontSize:12, color:item.color, fontWeight:600 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Verification Result ───────────────────── */}
      <div>
        <div style={{ fontSize:12, fontWeight:700, color:'#8b9a5a', letterSpacing:'0.1em', marginBottom:10 }}>VERIFICATION RESULT</div>
        <StatusCard/>
      </div>

      {/* ── Admin Final Decision ──────────────────── */}
      {!confirmed && (
        <div className="card-3" style={{ borderRadius:8, padding:'24px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#e8e0d0', marginBottom:4 }}>Admin Final Decision</div>
          <div style={{ fontSize:11, color:'#5a6a40', marginBottom:20 }}>Your decision will be recorded and the user will be notified.</div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <button className="btn-primary" onClick={handleApprove} disabled={submitting} style={{ padding:'12px 28px', borderRadius:7, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,8 6.5,11.5 13,5"/></svg>
              {submitting ? 'PROCESSING...' : 'APPROVE / VERIFY'}
            </button>
            <button className="btn-danger" onClick={() => setShowRejectModal(true)} disabled={submitting} style={{ padding:'12px 28px', borderRadius:7, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
              REJECT
            </button>
            <button className="btn-saffron" onClick={handleReview} disabled={submitting} style={{ padding:'12px 28px', borderRadius:7, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 8A6 6 0 1 1 8 2"/><path d="M14 2l-6 6"/><path d="M10 2h4v4"/></svg>
              REQUEST RE-UPLOAD
            </button>
          </div>
        </div>
      )}

      {confirmed && (
        <div style={{ padding:'16px 24px', background:'rgba(42,50,24,0.4)', borderRadius:8, border:'1px solid rgba(74,90,42,0.25)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#e8e0d0' }}>Decision recorded</div>
            <div style={{ fontSize:11, color:'#5a6a40', marginTop:2 }}>Action complete</div>
            {decision === 'REJECTED' && rejReasons.length > 0 && (
              <div style={{ fontSize:11, color:'#c87878', marginTop:4 }}>Reason: {rejReasons.join(', ')}{rejNote?` — ${rejNote}`:''}</div>
            )}
          </div>
          <button className="btn-ghost" style={{ padding:'7px 14px', borderRadius:6, fontSize:12, cursor:'pointer' }} onClick={() => { setConfirmed(false); setDecision(null) }}>
            Revise Decision
          </button>
        </div>
      )}

      {/* ── Rejection Modal ───────────────────────── */}
      {showRejectModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }} onClick={()=>setShowRejectModal(false)}>
          <div onClick={e=>e.stopPropagation()} className="animate-fade-in" style={{ background:'#1d2113', border:'1px solid rgba(74,90,42,0.35)', borderRadius:10, padding:'28px 32px', width:480, maxWidth:'90vw', boxShadow:'0 24px 80px rgba(0,0,0,0.8)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ width:32, height:32, borderRadius:6, background:'rgba(138,56,56,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#c87878" strokeWidth="1.8"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:'#e8e0d0' }}>Reject Document</div>
                <div style={{ fontSize:11, color:'#5a6a40' }}>Select reason(s) for rejection</div>
              </div>
              <button onClick={()=>setShowRejectModal(false)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#5a6a40' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
              </button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
              {REJECTION_REASONS.map(r => (
                <label key={r} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'8px 12px', borderRadius:5, background:rejReasons.includes(r)?'rgba(138,56,56,0.1)':'transparent', border:`1px solid ${rejReasons.includes(r)?'rgba(138,56,56,0.3)':'rgba(74,90,42,0.15)'}`, transition:'all 0.12s' }}>
                  <input type="checkbox" checked={rejReasons.includes(r)} onChange={e=>setRejReasons(prev=>e.target.checked?[...prev,r]:prev.filter(x=>x!==r))} style={{ accentColor:'#c87878', width:14, height:14 }}/>
                  <span style={{ fontSize:13, color:'#c8c0b0' }}>{r}</span>
                </label>
              ))}
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, fontWeight:600, color:'#7a8a58', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>ADDITIONAL NOTE (OPTIONAL)</label>
              <textarea className="admin-input" value={rejNote} onChange={e=>setRejNote(e.target.value)} rows={3} placeholder="Enter additional explanation…"
                style={{ width:'100%', padding:'9px 12px', fontSize:12, resize:'vertical' }}/>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn-ghost" onClick={()=>setShowRejectModal(false)} disabled={submitting} style={{ padding:'9px 20px', borderRadius:6, fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button className="btn-danger" onClick={handleConfirmReject} disabled={submitting || (rejReasons.length===0&&!rejNote.trim())}
                style={{ padding:'9px 20px', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer', opacity:(rejReasons.length===0&&!rejNote.trim())?0.5:1 }}>
                {submitting ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
