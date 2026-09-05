import { useState, useEffect } from 'react'
import type { DocRecord } from '../types'
import { api } from '../api'

interface Props { onReview: (doc: DocRecord) => void }

export default function UsersPage({ onReview }: Props) {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string|null>(null)
  const [drawerTab, setDrawerTab] = useState<'info'|'docs'|'history'>('info')

  useEffect(() => {
    api.fetchUsers()
      .then(res => {
        setUsers(res.users)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  const selectedUser = users.find(u => u._id === selectedUserId) ?? null

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  return (
    <div style={{ display:'flex', height:'100%', position:'relative' }}>
      {/* Main content */}
      <div style={{ flex:1, padding:'24px', overflowY:'auto' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, color:'#e8e0d0', margin:0 }}>User Management</h1>
            <p style={{ fontSize:12, color:'#5a6a40', margin:'4px 0 0' }}>{filtered.length} users found</p>
          </div>
          <button className="btn-primary" style={{ padding:'8px 16px', borderRadius:6, fontSize:12, cursor:'pointer' }}>
            + Add User
          </button>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, maxWidth:320 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#3a4a22' }}>
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3"/>
              <line x1="8.5" y1="8.5" x2="12" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input className="admin-input" placeholder="Search by name, email…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{ width:'100%', padding:'8px 12px 8px 29px', fontSize:12 }}/>
          </div>
        </div>

        {/* Table */}
        <div className="card-1" style={{ borderRadius:8, overflow:'hidden' }}>
          <table className="admin-table">
            <thead><tr>
              <th>ID</th><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ textAlign:'center', padding: 20 }}>Loading...</td></tr> : filtered.map((u) => (
                <tr key={u._id} style={{ cursor:'pointer' }} onClick={() => { setSelectedUserId(u._id); setDrawerTab('info') }}>
                  <td style={{ color:'#3a5018', fontSize:11, fontFamily:'monospace' }}>{u._id.substring(0,8)}...</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#4f6128,#2a3218)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#e8e0d0', flexShrink:0 }}>
                        {getInitials(u.name)}
                      </div>
                      <span style={{ fontWeight:500, color:'#d8d0c0' }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color:'#7a8a60' }}>{u.email}</td>
                  <td style={{ fontWeight:600, color:'#b5c070' }}>{u.role}</td>
                  <td>
                    <span className={u.isActive?'badge-active':'badge-suspended'} style={{ fontSize:10, padding:'2px 7px', borderRadius:3, fontWeight:600 }}>{u.isActive ? 'Active' : 'Suspended'}</span>
                  </td>
                  <td style={{ color:'#4a5a30', fontSize:11 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display:'flex', gap:6 }} onClick={e=>e.stopPropagation()}>
                      <button className="btn-ghost" style={{ padding:'4px 9px', borderRadius:4, fontSize:11, cursor:'pointer' }} onClick={() => { setSelectedUserId(u._id); setDrawerTab('info') }}>Profile</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Profile Drawer */}
      {selectedUser && (
        <>
          {/* Overlay */}
          <div onClick={() => setSelectedUserId(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:40 }}/>
          {/* Drawer */}
          <div className="animate-slide-right" style={{
            position:'fixed', right:0, top:0, bottom:0, width:480,
            background:'#141810', borderLeft:'1px solid rgba(74,90,42,0.3)',
            zIndex:50, display:'flex', flexDirection:'column', overflowY:'auto',
            boxShadow:'-8px 0 40px rgba(0,0,0,0.6)',
          }}>
            {/* Drawer header */}
            <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid rgba(74,90,42,0.2)', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#FF9933', letterSpacing:'0.1em' }}>USER PROFILE</span>
                <button onClick={() => setSelectedUserId(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#5a6a40', padding:4 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                  </svg>
                </button>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#4f6128,#2a3218)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'#e8e0d0', border:'2px solid rgba(255,153,51,0.3)', flexShrink:0 }}>
                  {getInitials(selectedUser.name)}
                </div>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:'#e8e0d0' }}>{selectedUser.name}</div>
                  <div style={{ fontSize:11, color:'#5a6a40', marginTop:2 }}>{selectedUser._id}</div>
                  <span className={selectedUser.isActive?'badge-active':'badge-suspended'} style={{ fontSize:10, padding:'2px 8px', borderRadius:3, fontWeight:600, marginTop:4, display:'inline-block' }}>{selectedUser.isActive ? 'Active' : 'Suspended'}</span>
                </div>
              </div>
            </div>

            <div style={{ padding:'20px 24px', flex:1 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {/* Info grid */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    ['Full Name', selectedUser.name],
                    ['User ID', selectedUser._id],
                    ['Email', selectedUser.email],
                    ['Role', selectedUser.role],
                    ['Account Status', selectedUser.isActive ? 'Active' : 'Suspended'],
                    ['Joined', new Date(selectedUser.createdAt).toLocaleDateString()],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background:'rgba(42,50,24,0.4)', borderRadius:6, padding:'10px 12px', border:'1px solid rgba(74,90,42,0.15)' }}>
                      <div style={{ fontSize:10, color:'#4a5a30', fontWeight:600, letterSpacing:'0.06em', marginBottom:4 }}>{label.toUpperCase()}</div>
                      <div style={{ fontSize:12, color:'#c8c0b0', fontWeight:500 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
