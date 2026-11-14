
import { ChartNoAxesColumn } from 'lucide-react'

export default function Analysis() {
  return (
    <main className="page placeholder-page">
      <div className="placeholder-panel glass">
        <ChartNoAxesColumn size={42} />
        <div className="eyebrow">IMAGE ANALYSIS</div>
        <h1>Understand the transformation.</h1>
        <p>
          Original and enhanced intensity histograms,
          brightness statistics, and contrast analysis
          will appear here.
        </p>
        <span className="coming-soon">Upcoming feature</span>
      </div>
    </main>
  )
}
