import React, { useState } from 'react'
import type { PageType } from '../types'

interface LayoutProps {
  currentPage: PageType
  onNavigate: (p: PageType) => void
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  onLogout: () => void
  children: React.ReactNode
}

const PAGE_TITLES: Record<PageType, string> = {
  dashboard: 'Dashboard',
  users: 'User Management',
  documents: 'Document Verification',
  review: 'Document Review',
  history: 'Verification History',
  notifications: 'Notifications',
  settings: 'Settings',
  profile: 'Admin Profile',
}

const ChakraIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="22" stroke="#FF9933" strokeWidth="1.5" opacity="0.6"/>
    <circle cx="24" cy="24" r="8" stroke="#FF9933" strokeWidth="1.5" opacity="0.8"/>
    {Array.from({length:24},(_,i)=>{
      const a=(i/24)*2*Math.PI, x1=24+10*Math.cos(a), y1=24+10*Math.sin(a), x2=24+22*Math.cos(a), y2=24+22*Math.sin(a)
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FF9933" strokeWidth="0.7" opacity="0.5"/>
    })}
    <circle cx="24" cy="24" r="3" fill="#FF9933" opacity="0.7"/>
  </svg>
)

interface NavGroup { label: string; items: { id: PageType; icon: string; label: string }[] }

const NAV: NavGroup[] = [
  { label: 'MAIN', items: [
    { id:'dashboard',  icon:'⬛', label:'Dashboard' },
    { id:'users',      icon:'👤', label:'Users' },
    { id:'documents',  icon:'📄', label:'Documents' },
    { id:'documents',  icon:'✅', label:'Verification' },
    { id:'history',    icon:'📋', label:'Verification History' },
  ]},
  { label: 'SYSTEM', items: [
    { id:'notifications', icon:'🔔', label:'Notifications' },
    { id:'settings',      icon:'⚙️',  label:'Settings' },
    { id:'profile',       icon:'👤', label:'Profile' },
  ]},
]

const NavIcons: Record<string,React.ReactElement> = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
      <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="6" cy="5" r="2.5"/><path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5"/>
      <circle cx="12" cy="5" r="2" opacity=".6"/><path d="M12 9c1.66 0 3 1.34 3 3" opacity=".6"/>
    </svg>
  ),
  documents: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 2h7l3 3v9H3V2z" fillOpacity=".8"/><path d="M10 2v3h3" fill="none" stroke="currentColor" strokeWidth="1"/>
      <line x1="5" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1" fill="none"/>
      <line x1="5" y1="9.5" x2="11" y2="9.5" stroke="currentColor" strokeWidth="1" fill="none"/>
      <line x1="5" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="1" fill="none"/>
    </svg>
  ),
  verification: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2L9.5 5.5H13L10 7.5L11.5 11L8 9L4.5 11L6 7.5L3 5.5H6.5L8 2Z"/>
    </svg>
  ),
  history: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6"/><polyline points="8,4 8,8 11,10"/>
    </svg>
  ),
  notifications: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a5 5 0 0 0-5 5v3l-1 1.5v.5h12v-.5L13 9V6a5 5 0 0 0-5-5z"/>
      <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0"/>
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 5a3 3 0 1 0 0 6A3 3 0 0 0 8 5z" opacity=".8"/>
      <path d="M6.5 1.5h3l.5 1.5 1.5-.5 2 2-.5 1.5 1.5.5v3l-1.5.5.5 1.5-2 2-1.5-.5-.5 1.5h-3l-.5-1.5-1.5.5-2-2 .5-1.5-1.5-.5v-3l1.5-.5-.5-1.5 2-2 1.5.5z" fillOpacity=".5"/>
    </svg>
  ),
  profile: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="5.5" r="3"/>
      <path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6"/>
    </svg>
  ),
}

const navRows: Array<{ id: PageType; iconKey: string; label: string; group: string }> = [
  { id:'dashboard',     iconKey:'dashboard',     label:'Dashboard',            group:'MAIN' },
  { id:'users',         iconKey:'users',          label:'Users',                group:'MAIN' },
  { id:'documents',     iconKey:'documents',      label:'Documents',            group:'MAIN' },
  { id:'documents',     iconKey:'verification',   label:'Verification',         group:'MAIN' },
  { id:'history',       iconKey:'history',        label:'Verification History', group:'MAIN' },
  { id:'notifications', iconKey:'notifications',  label:'Notifications',        group:'SYSTEM' },
  { id:'settings',      iconKey:'settings',       label:'Settings',             group:'SYSTEM' },
  { id:'profile',       iconKey:'profile',        label:'Profile',              group:'SYSTEM' },
]

export default function Layout({ currentPage, onNavigate, isSidebarOpen, onToggleSidebar, onLogout, children }: LayoutProps) {
  const [notifCount] = useState(4)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div style={{ display:'flex', height:'100%', background:'#0d0f08', fontFamily:'Inter,system-ui,sans-serif' }}>
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside style={{
        width: isSidebarOpen ? 248 : 64,
        minWidth: isSidebarOpen ? 248 : 64,
        background:'#080a05',
        borderRight:'1px solid rgba(74,90,42,0.25)',
        display:'flex',
        flexDirection:'column',
        transition:'width 0.25s ease, min-width 0.25s ease',
        overflow:'hidden',
        position:'relative',
        zIndex:10,
        boxShadow:'4px 0 24px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid rgba(74,90,42,0.2)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ flexShrink:0 }}>
              <ChakraIcon size={32}/>
            </div>
            {isSidebarOpen && (
              <div style={{ overflow:'hidden' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#e8e0d0', letterSpacing:'0.05em', lineHeight:1.2 }}>VERIDOC AI</div>
                <div style={{ fontSize:9, fontWeight:600, color:'#FF9933', letterSpacing:'0.15em', marginTop:2, textTransform:'uppercase' }}>Admin Portal</div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'12px 10px' }}>
          {(['MAIN','SYSTEM'] as const).map(group => {
            const rows = navRows.filter(r=>r.group===group)
            return (
              <div key={group} style={{ marginBottom:16 }}>
                {isSidebarOpen && (
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.15em', color:'#3a5018', padding:'0 6px 8px', textTransform:'uppercase' }}>{group}</div>
                )}
                {rows.map((row,i) => {
                  const isActive = currentPage === row.id && (row.label==='Dashboard'||row.label==='Users'||row.label==='Documents'||row.label==='Verification History'||currentPage===row.id)
                  const active = (row.id === currentPage) || (row.label==='Verification' && currentPage==='documents') || (row.label==='Verification' && currentPage==='review')
                  return (
                    <div
                      key={i}
                      className={`nav-item${active ? ' active' : ''}`}
                      onClick={() => onNavigate(row.id)}
                      style={{ justifyContent: isSidebarOpen ? 'flex-start' : 'center', padding: isSidebarOpen ? '9px 12px' : '9px 0', marginBottom:2 }}
                      title={!isSidebarOpen ? row.label : undefined}
                    >
                      <span className="nav-accent" style={{ display: isSidebarOpen ? 'block':'none' }}/>
                      <span style={{ display:'flex', alignItems:'center', color:'inherit', flexShrink:0 }}>
                        {NavIcons[row.iconKey]}
                      </span>
                      {isSidebarOpen && <span style={{ fontSize:13 }}>{row.label}</span>}
                    </div>
                  )
                })}
              </div>
            )
          })}
          {/* Logout */}
          <div
            className="nav-item"
            onClick={onLogout}
            style={{ color:'#8a4040', marginTop:8, justifyContent: isSidebarOpen ? 'flex-start' : 'center', padding: isSidebarOpen ? '9px 12px' : '9px 0' }}
            title={!isSidebarOpen ? 'Logout' : undefined}
          >
            <span className="nav-accent" style={{ display: isSidebarOpen ? 'block':'none', background:'transparent' }}/>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
            {isSidebarOpen && <span style={{ fontSize:13 }}>Logout</span>}
          </div>
        </nav>

        {/* Security indicator */}
        {isSidebarOpen && (
          <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(74,90,42,0.2)', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#4a9a4a', boxShadow:'0 0 6px #4a9a4a' }}/>
              <span style={{ fontSize:10, color:'#5a7a3a', letterSpacing:'0.06em' }}>SECURE CONNECTION</span>
            </div>
            <div style={{ fontSize:9, color:'#3a4a22', marginTop:4, letterSpacing:'0.04em' }}>SSL/TLS ENCRYPTED · ADMIN ONLY</div>
          </div>
        )}
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
        {/* Header */}
        <header style={{
          height:56,
          background:'rgba(10,12,6,0.95)',
          borderBottom:'1px solid rgba(74,90,42,0.25)',
          display:'flex',
          alignItems:'center',
          gap:16,
          padding:'0 20px',
          flexShrink:0,
          backdropFilter:'blur(8px)',
          zIndex:9,
        }}>
          {/* Toggle */}
          <button
            onClick={onToggleSidebar}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#7a8a58', padding:4, display:'flex', alignItems:'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <rect y="3" width="18" height="1.5" rx="0.75"/><rect y="8.25" width="18" height="1.5" rx="0.75"/>
              <rect y="13.5" width="18" height="1.5" rx="0.75"/>
            </svg>
          </button>

          {/* Breadcrumb */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, color:'#3a5018', letterSpacing:'0.06em' }}>ADMIN</span>
            <span style={{ color:'#3a5018', fontSize:11 }}>›</span>
            <span style={{ fontSize:14, fontWeight:600, color:'#e8e0d0', letterSpacing:'0.02em' }}>{PAGE_TITLES[currentPage]}</span>
          </div>

          {/* Search */}
          <div style={{ flex:1, maxWidth:400, position:'relative' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#5a6a40' }}>
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              className="admin-input"
              placeholder="Search users, documents..."
              style={{ width:'100%', padding:'7px 12px 7px 32px', fontSize:12 }}
            />
          </div>

          <div style={{ flex:1 }}/>

          {/* Notifications */}
          <button style={{ position:'relative', background:'rgba(74,90,42,0.12)', border:'1px solid rgba(74,90,42,0.25)', borderRadius:6, padding:'6px 8px', cursor:'pointer', color:'#8b9a5a', display:'flex' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a5 5 0 0 0-5 5v3l-1 1.5v.5h12v-.5L13 9V6a5 5 0 0 0-5-5z"/>
              <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0"/>
            </svg>
            {notifCount > 0 && (
              <span style={{ position:'absolute', top:-4, right:-4, background:'#FF9933', color:'#1a0800', fontSize:9, fontWeight:700, borderRadius:'50%', width:14, height:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {notifCount}
              </span>
            )}
          </button>

          {/* Admin profile */}
          <div style={{ position:'relative' }}>
            <div
              onClick={() => setProfileOpen(p=>!p)}
              style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'6px 12px', borderRadius:6, background:'rgba(74,90,42,0.1)', border:'1px solid rgba(74,90,42,0.2)', transition:'all 0.15s' }}
            >
              <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#4f6128,#2a3218)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#e8e0d0', border:'1px solid rgba(255,153,51,0.3)' }}>
                SA
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:'#e8e0d0', lineHeight:1.2 }}>Admin User</div>
                <div style={{ fontSize:10, color:'#FF9933', letterSpacing:'0.04em' }}>Super Admin</div>
              </div>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="#5a6a40">
                <polyline points="2,4 5,7 8,4"/>
              </svg>
            </div>
            {profileOpen && (
              <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background:'#141810', border:'1px solid rgba(74,90,42,0.3)', borderRadius:8, padding:8, minWidth:160, zIndex:100, boxShadow:'0 8px 32px rgba(0,0,0,0.6)' }}>
                {[['Profile','profile'],['Settings','settings']].map(([label,page]) => (
                  <div key={page} onClick={()=>{onNavigate(page as PageType); setProfileOpen(false)}} style={{ padding:'8px 12px', fontSize:12, color:'#b8b098', borderRadius:4, cursor:'pointer' }}
                    onMouseOver={e=>(e.currentTarget.style.background='rgba(74,90,42,0.15)')}
                    onMouseOut={e=>(e.currentTarget.style.background='transparent')}
                  >{label}</div>
                ))}
                <div style={{ height:1, background:'rgba(74,90,42,0.2)', margin:'4px 0' }}/>
                <div onClick={onLogout} style={{ padding:'8px 12px', fontSize:12, color:'#c87878', borderRadius:4, cursor:'pointer' }}
                  onMouseOver={e=>(e.currentTarget.style.background='rgba(138,56,56,0.12)')}
                  onMouseOut={e=>(e.currentTarget.style.background='transparent')}
                >Sign Out</div>
              </div>
            )}
          </div>

          {/* Auth status */}
          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 8px', background:'rgba(42,60,18,0.3)', borderRadius:4, border:'1px solid rgba(58,138,72,0.2)' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="#4a9a4a">
              <path d="M5 1L2 3v2.5c0 2 1.5 3.5 3 4 1.5-.5 3-2 3-4V3L5 1z"/>
            </svg>
            <span style={{ fontSize:9, color:'#4a9a4a', letterSpacing:'0.06em', fontWeight:600 }}>ADMIN</span>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
