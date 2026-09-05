import { useState } from 'react'
import type { PageType, DocRecord } from './types'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import DocumentsPage from './pages/DocumentsPage'
import DocumentReviewPage from './pages/DocumentReviewPage'
import VerificationHistoryPage from './pages/VerificationHistoryPage'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard')
  const [reviewDoc, setReviewDoc] = useState<DocRecord | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />
  }

  const handleReview = (doc: DocRecord) => {
    setReviewDoc(doc)
    setCurrentPage('review')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPage} />
      case 'users':
        return <UsersPage onReview={handleReview} />
      case 'documents':
        return <DocumentsPage onReview={handleReview} />
      case 'review':
        return reviewDoc
          ? <DocumentReviewPage doc={reviewDoc} onBack={() => setCurrentPage('documents')} />
          : <DocumentsPage onReview={handleReview} />
      case 'history':
        return <VerificationHistoryPage />
      default:
        return (
          <div style={{ padding:40, textAlign:'center' }}>
            <div style={{ fontSize:14, color:'#5a6a40', marginBottom:12 }}>This section is coming soon.</div>
            <button
              className="btn-ghost"
              onClick={() => setCurrentPage('dashboard')}
              style={{ padding:'8px 20px', borderRadius:6, fontSize:13, cursor:'pointer' }}
            >
              Return to Dashboard
            </button>
          </div>
        )
    }
  }

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={() => setIsSidebarOpen(s => !s)}
      onLogout={() => {
        localStorage.removeItem('token')
        setIsLoggedIn(false)
      }}
    >
      {renderPage()}
    </Layout>
  )
}
