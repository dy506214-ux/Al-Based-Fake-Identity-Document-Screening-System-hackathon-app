import { useState } from 'react'
import { api } from '../api'

interface Props { onLogin: () => void }

const ChakraLarge = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
    <circle cx="36" cy="36" r="33" stroke="#FF9933" strokeWidth="1.5" opacity="0.4"/>
    <circle cx="36" cy="36" r="24" stroke="#FF9933" strokeWidth="1" opacity="0.3"/>
    <circle cx="36" cy="36" r="12" stroke="#FF9933" strokeWidth="2" opacity="0.7"/>
    {Array.from({length:24},(_,i)=>{
      const a=(i/24)*2*Math.PI, x1=36+14*Math.cos(a), y1=36+14*Math.sin(a), x2=36+33*Math.cos(a), y2=36+33*Math.sin(a)
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FF9933" strokeWidth="0.8" opacity="0.35"/>
    })}
    <circle cx="36" cy="36" r="4.5" fill="#FF9933" opacity="0.85"/>
    <circle cx="36" cy="36" r="2" fill="#fff" opacity="0.5"/>
  </svg>
)

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('admin@veridoc.gov.in')
  const [password, setPassword] = useState('admin123')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please enter credentials.'); return }
    setLoading(true)
    try {
      const data = await api.login(email, password)
      if (data.success && data.token) {
        localStorage.setItem('token', data.token)
        onLogin()
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#080a05', fontFamily:'Inter,system-ui,sans-serif', position:'relative', overflow:'hidden',
    }}>
      {/* Tactical grid */}
      <div className="tactical-grid" style={{ position:'absolute', inset:0, opacity:0.6 }}/>

      {/* Glow orb */}
      <div style={{ position:'absolute', top:'20%', left:'50%', transform:'translate(-50%,-50%)', width:600, height:600, background:'radial-gradient(ellipse,rgba(74,90,42,0.12) 0%,transparent 70%)', pointerEvents:'none' }}/>

      {/* Top stripe - tricolor inspired */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#FF9933 33.33%,#ffffff22 33.33%,#ffffff22 66.66%,rgba(19,136,8,0.6) 66.66%)' }}/>

      {/* Left decorative panel */}
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'42%', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', gap:24, padding:40 }}>
        <div style={{ textAlign:'center' }}>
          <div className="animate-spin-slow" style={{ display:'inline-block', marginBottom:12 }}>
            <ChakraLarge/>
          </div>
          <h1 style={{ fontSize:28, fontWeight:800, color:'#e8e0d0', letterSpacing:'0.06em', margin:0, lineHeight:1.2 }}>VERIDOC AI</h1>
          <p style={{ fontSize:12, color:'#FF9933', letterSpacing:'0.2em', marginTop:6, fontWeight:600 }}>DOCUMENT VERIFICATION SYSTEM</p>
          <p style={{ fontSize:11, color:'#4a5a2a', marginTop:16, lineHeight:1.6, maxWidth:280 }}>
            Advanced AI-powered document authentication and fake document detection for government and enterprise use.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, alignSelf:'stretch', maxWidth:280 }}>
          {[
            ['OCR Text Extraction','99.2% accuracy'],
            ['AI Authenticity Detection','Multi-layer analysis'],
            ['Real-time Verification','Sub-second processing'],
            ['Tamper Detection','Forensic-grade algorithms'],
          ].map(([feat,desc]) => (
            <div key={feat} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'rgba(74,90,42,0.08)', borderRadius:6, border:'1px solid rgba(74,90,42,0.18)' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#FF9933', flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'#b5c070' }}>{feat}</div>
                <div style={{ fontSize:10, color:'#4a5a2a' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize:10, color:'#2a3818', letterSpacing:'0.06em', textAlign:'center' }}>
          Government of India · Ministry of Electronics &amp; IT<br/>
          ISO 27001:2022 Certified · STQC Approved
        </div>
      </div>

      {/* Login card */}
      <div style={{
        position:'absolute', right:'8%', top:'50%', transform:'translateY(-50%)',
        width:400,
        background:'linear-gradient(145deg,#1a1e12 0%,#141810 100%)',
        border:'1px solid rgba(74,90,42,0.35)',
        borderRadius:12,
        padding:'36px 32px',
        boxShadow:'0 1px 0 rgba(255,255,255,0.07) inset, 0 24px 80px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.5)',
      }}>
        {/* Card header */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px',
            background:'rgba(255,153,51,0.1)', border:'1px solid rgba(255,153,51,0.25)', borderRadius:20,
            marginBottom:16,
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="#FF9933">
              <path d="M5 1L2 3v2.5c0 2 1.5 3.5 3 4 1.5-.5 3-2 3-4V3L5 1z"/>
            </svg>
            <span style={{ fontSize:10, fontWeight:700, color:'#FF9933', letterSpacing:'0.12em' }}>ADMIN PORTAL ACCESS</span>
          </div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'#e8e0d0', margin:0, letterSpacing:'0.02em' }}>Administrator Login</h2>
          <p style={{ fontSize:12, color:'#5a6a40', marginTop:6, margin:'6px 0 0' }}>Authorised personnel only</p>
        </div>

        <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Email */}
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'#7a8a58', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>ADMIN EMAIL / USERNAME</label>
            <div style={{ position:'relative' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="#3a4a22" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}>
                <circle cx="7" cy="5.5" r="2.5"/><path d="M1 13c0-3.31 2.69-6 6-6s6 2.69 6 6"/>
              </svg>
              <input
                className="admin-input"
                type="text"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                style={{ width:'100%', padding:'10px 12px 10px 32px', fontSize:13 }}
                placeholder="admin@veridoc.gov.in"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'#7a8a58', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>PASSWORD</label>
            <div style={{ position:'relative' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="#3a4a22" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}>
                <rect x="2" y="6" width="10" height="7" rx="1"/><path d="M4 6V4a3 3 0 0 1 6 0v2"/>
              </svg>
              <input
                className="admin-input"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e=>setPassword(e.target.value)}
                style={{ width:'100%', padding:'10px 36px 10px 32px', fontSize:13 }}
                placeholder="••••••••"
              />
              <button type="button" onClick={()=>setShowPass(p=>!p)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#3a5018', padding:2 }}>
                {showPass ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"/><circle cx="7" cy="7" r="1.5"/><line x1="2" y1="2" x2="12" y2="12"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"/><circle cx="7" cy="7" r="1.5"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <label style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer' }}>
              <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} style={{ accentColor:'#FF9933', width:13, height:13 }}/>
              <span style={{ fontSize:12, color:'#6a7a48' }}>Remember me</span>
            </label>
            <button type="button" style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#FF9933', opacity:0.8 }}>
              Forgot password?
            </button>
          </div>

          {error && (
            <div style={{ padding:'8px 12px', background:'rgba(138,56,56,0.15)', border:'1px solid rgba(138,56,56,0.3)', borderRadius:6, fontSize:12, color:'#c87878' }}>
              {error}
            </div>
          )}

          {/* Login button */}
          <button
            type="submit"
            className="btn-saffron"
            disabled={loading}
            style={{ padding:'12px', borderRadius:7, fontSize:13, fontWeight:700, letterSpacing:'0.08em', cursor:'pointer', marginTop:4 }}
          >
            {loading ? (
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation:'spin-slow 0.8s linear infinite' }}>
                  <circle cx="7" cy="7" r="5" strokeOpacity="0.3"/><path d="M7 2a5 5 0 0 1 5 5" strokeLinecap="round"/>
                </svg>
                Authenticating…
              </span>
            ) : 'LOGIN TO ADMIN PANEL'}
          </button>
        </form>

        {/* Security indicators */}
        <div style={{ marginTop:20, padding:'10px 12px', background:'rgba(42,60,18,0.3)', borderRadius:6, border:'1px solid rgba(58,138,72,0.2)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            {[
              { icon:'🔒', label:'SSL Encrypted' },
              { icon:'🛡️', label:'2FA Ready' },
              { icon:'👁️', label:'Activity Logged' },
            ].map(item => (
              <div key={item.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:9 }}>{item.icon}</span>
                <span style={{ fontSize:9, color:'#4a6a28', fontWeight:600, letterSpacing:'0.05em' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize:10, color:'#2a3a18', textAlign:'center', marginTop:12, letterSpacing:'0.04em' }}>
          Unauthorised access is strictly prohibited and monitored.
        </p>
      </div>
    </div>
  )
}
