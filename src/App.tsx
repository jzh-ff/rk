import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Knowledge from './pages/Knowledge'
import Practice from './pages/Practice'
import MockExam from './pages/MockExam'
import CaseStudy from './pages/CaseStudy'
import WrongBook from './pages/WrongBook'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="knowledge" element={<Knowledge />} />
        <Route path="practice" element={<Practice />} />
        <Route path="mock" element={<MockExam />} />
        <Route path="case" element={<CaseStudy />} />
        <Route path="wrong" element={<WrongBook />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
