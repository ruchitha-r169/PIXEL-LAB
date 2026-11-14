import Studio from './pages/Studio'
import { useState } from 'react'
import {
  BrowserRouter,
  NavLink,
  Link,
  Routes,
  Route,
} from 'react-router-dom'
import {
  Aperture,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleDot,
  Focus,
  Image as ImageIcon,
  Layers3,
  ScanLine,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Waves,
  ChartNoAxesCombined,
  MoveHorizontal,
  UploadCloud,
  Activity,
} from 'lucide-react'
import './App.css'

const stages = [
  {
    id: 'original',
    number: '00',
    name: 'Original',
    short: 'Input image',
    icon: ImageIcon,
    color: '#7e8fb4',
    description:
      'The original RGB image enters the processing pipeline without modification.',
    detail:
      'This is the reference image against which the enhancement results are compared.',
    formula: 'f(x, y)',
  },
  {
    id: 'smoothing',
    number: '01',
    name: 'Smoothing',
    short: 'Noise reduction',
    icon: Waves,
    color: '#9477e5',
    description:
      'Reduce unwanted noise using neighborhood-based spatial filtering.',
    detail:
      'Median filtering is useful for salt-and-pepper noise. Averaging filters replace each pixel with the mean of nearby pixels.',
    formula: 'Median / Box Filter',
  },
  {
    id: 'laplacian',
    number: '02',
    name: 'Laplacian',
    short: 'Edge extraction',
    icon: ScanLine,
    color: '#43a9d8',
    description:
      'Highlight rapid intensity variations using a second-order derivative.',
    detail:
      'PixelLab uses a four-neighbor Laplacian kernel with a negative center coefficient.',
    formula: '∇²f = ∂²f/∂x² + ∂²f/∂y²',
  },
  {
    id: 'sharpening',
    number: '03',
    name: 'Sharpening',
    short: 'Detail enhancement',
    icon: Focus,
    color: '#e58aaf',
    description:
      'Enhance fine structures by subtracting the signed Laplacian response.',
    detail:
      'A strength parameter controls how much the Laplacian contributes to the sharpened image.',
    formula: 'g = fₛₘₒₒₜₕ − c∇²f',
  },
  {
    id: 'gamma',
    number: '04',
    name: 'Gamma',
    short: 'Tone adjustment',
    icon: Sun,
    color: '#3baea9',
    description:
      'Apply a nonlinear transformation to adjust image brightness.',
    detail:
      'Gamma values below 1 brighten the image. Values above 1 darken it.',
    formula: 's = crᵞ',
  },
]

function Navbar() {
  const links = [
    { path: '/', label: 'Explore', icon: BookOpen },
    { path: '/studio', label: 'Studio', icon: SlidersHorizontal },
    { path: '/analysis', label: 'Analysis', icon: ChartNoAxesCombined },
  ]

  return (
    <header className="nav-shell">
      <Link to="/" className="brand">
        <div className="brand-mark">
          <Aperture size={26} strokeWidth={1.8} />
        </div>
        <div className="brand-copy">
          <strong>PixelLab<span className="brand-dot">.</span></strong>
          <small>REFINE · ENHANCE · REVEAL</small>
        </div>
      </Link>

      <nav className="navigation" aria-label="Main navigation">
        {links.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `navigation-link ${isActive ? 'is-active' : ''}`
            }
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="nav-right">
        <span className="version-pill">
          <span className="status-dot" />
          PIXELLAB 2.0
        </span>
      </div>
    </header>
  )
}

function Scene({ mode = 'original', className = '' }) {
  return (
    <svg
      className={`scene-svg scene-${mode} ${className}`}
      viewBox="0 0 640 400"
      role="img"
      aria-label={`Illustrative ${mode} image preview`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sceneSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5d6ef" />
          <stop offset="100%" stopColor="#e8d5e9" />
        </linearGradient>
        <linearGradient id="sceneLake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#83b6ce" />
          <stop offset="100%" stopColor="#507f9e" />
        </linearGradient>
        <linearGradient id="sceneHill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6b9b9b" />
          <stop offset="100%" stopColor="#4c7687" />
        </linearGradient>

        <filter id="sceneEdge">
          <feColorMatrix type="saturate" values="0" />
          <feConvolveMatrix
            order="3"
            kernelMatrix="0 1 0 1 -4 1 0 1 0"
            divisor="1"
            bias="0.5"
            preserveAlpha="true"
          />
        </filter>
      </defs>

      <g className="scene-art">
        <rect width="640" height="400" fill="url(#sceneSky)" />

        <circle cx="470" cy="94" r="49" fill="#fff3d4" opacity=".85" />

        <path
          d="M0 240 L110 125 L180 200 L290 83 L425 240 Z"
          fill="#9aabc6"
        />
        <path
          d="M170 250 L305 105 L450 252 Z"
          fill="#758fb0"
        />
        <path
          d="M252 162 L305 105 L356 162 L328 150 L305 136 L279 154 Z"
          fill="#f5f4f7"
        />
        <path
          d="M340 245 L475 140 L640 260 Z"
          fill="#7d9fae"
        />

        <path
          d="M0 250 Q110 216 225 245 T450 237 T640 252 L640 400 L0 400 Z"
          fill="url(#sceneLake)"
        />

        <path
          d="M0 278 Q135 265 240 283 T480 274 T640 288"
          fill="none"
          stroke="#c4e0e7"
          strokeWidth="5"
          opacity=".6"
        />
        <path
          d="M100 323 Q260 312 420 329 T640 327"
          fill="none"
          stroke="#b7d8e2"
          strokeWidth="3"
          opacity=".5"
        />

        <path
          d="M0 320 Q120 262 225 340 L225 400 L0 400 Z"
          fill="url(#sceneHill)"
        />
        <path
          d="M640 315 Q530 275 420 354 L420 400 L640 400 Z"
          fill="#4c7881"
        />

        <path d="M75 325 L75 220" stroke="#3f6576" strokeWidth="9" />
        <path d="M75 205 L38 270 L112 270 Z" fill="#3d7e7e" />
        <path d="M75 175 L44 236 L106 236 Z" fill="#4c938d" />

        <path d="M545 340 L545 220" stroke="#395d69" strokeWidth="10" />
        <path d="M545 190 L505 278 L585 278 Z" fill="#367e78" />
        <path d="M545 160 L512 238 L578 238 Z" fill="#4b9889" />

        <path
          d="M0 374 Q110 352 210 377 T420 370 T640 380"
          fill="none"
          stroke="#8fb9a3"
          strokeWidth="8"
          opacity=".65"
        />
      </g>

      {mode === 'laplacian' && (
        <rect
          width="640"
          height="400"
          fill="#111d38"
          opacity=".12"
        />
      )}
    </svg>
  )
}

function PreviewCard({ mode, title, label, featured = false }) {
  return (
    <div className={`preview-card ${featured ? 'preview-featured' : ''}`}>
      <div className="preview-card-top">
        <span className="preview-indicator" />
        <span>{title}</span>
        <span className="preview-mini-label">{label}</span>
      </div>
      <div className="preview-visual">
        <Scene mode={mode} />
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <div className="section-kicker">
          <Sparkles size={15} />
          THE NEXT GENERATION IMAGE LAB
        </div>

        <h1>
          A clearer perspective
          <br />
          <span>on every pixel.</span>
        </h1>

        <p>
          Explore the mathematics behind digital image enhancement
          through interactive visualizations, spatial filtering,
          and intelligent image analysis.
        </p>

        <div className="hero-buttons">
          <Link className="button-primary" to="/studio">
            Enter Studio <ArrowUpRight size={18} />
          </Link>
          <a className="button-outline" href="#pipeline">
            Explore the Pipeline <ArrowRight size={18} />
          </a>
        </div>

        <div className="hero-facts">
          <div>
            <strong>04</strong>
            <span>Core algorithms</span>
          </div>
          <div className="fact-divider" />
          <div>
            <strong>05</strong>
            <span>Processing stages</span>
          </div>
          <div className="fact-divider" />
          <div>
            <strong>RGB</strong>
            <span>Image workflow</span>
          </div>
        </div>
      </div>

      <div className="hero-visual">
        <div className="hero-orbit orbit-outer" />
        <div className="hero-orbit orbit-inner" />

        <div className="floating-tag tag-top">
          <Layers3 size={15} />
          SPATIAL PROCESSING
        </div>

        <div className="hero-preview preview-back">
          <Scene mode="original" />
        </div>

        <div className="hero-preview preview-front">
          <Scene mode="sharpening" />
          <span className="image-chip">
            <Sparkles size={13} /> ENHANCED VIEW
          </span>
        </div>

        <div className="floating-tag tag-bottom">
          <span className="status-dot" />
          IMAGE PIPELINE READY
        </div>
      </div>
    </section>
  )
}

function Pipeline() {
  const [selected, setSelected] = useState('laplacian')
  const stage = stages.find((item) => item.id === selected)
  const Icon = stage.icon

  return (
    <section className="pipeline-section" id="pipeline">
      <div className="section-heading">
        <div>
          <div className="section-kicker">
            <CircleDot size={14} />
            INTERACTIVE WORKFLOW
          </div>
          <h2>Inside the enhancement engine</h2>
          <p>
            Select any stage to discover how it contributes to
            the final image.
          </p>
        </div>
        <div className="section-heading-badge">
          <Activity size={16} />
          5-STAGE PIPELINE
        </div>
      </div>

      <div className="pipeline-panel">
        <div className="pipeline-toolbar">
          <span>
            <span className="toolbar-dot" />
            PIXELLAB / PROCESSING FLOW
          </span>
          <span>INTERACTIVE DEMONSTRATION</span>
        </div>

        <div className="pipeline-nodes">
          {stages.map((item, index) => {
            const NodeIcon = item.icon
            return (
              <div className="node-group" key={item.id}>
                <button
                  type="button"
                  className={`pipeline-node ${
                    selected === item.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelected(item.id)}
                  aria-pressed={selected === item.id}
                  style={{ '--node-accent': item.color }}
                >
                  <span className="node-index">{item.number}</span>
                  <span className="node-icon">
                    <NodeIcon size={26} strokeWidth={1.8} />
                  </span>
                  <strong>{item.name}</strong>
                  <small>{item.short}</small>
                </button>

                {index < stages.length - 1 && (
                  <div className="node-connector">
                    <span />
                    <ChevronRight size={19} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="pipeline-detail">
          <div className="detail-information">
            <span className="detail-eyebrow">
              SELECTED MODULE / {stage.number}
            </span>

            <div className="detail-title">
              <div
                className="detail-icon"
                style={{ color: stage.color }}
              >
                <Icon size={25} />
              </div>
              <h3>{stage.name}</h3>
            </div>

            <p className="detail-lead">{stage.description}</p>
            <p className="detail-body">{stage.detail}</p>

            <div className="formula-panel">
              <span>MATHEMATICAL FOUNDATION</span>
              <strong>{stage.formula}</strong>
            </div>

            {stage.id === 'laplacian' && (
              <div className="kernel-panel">
                <span>4-NEIGHBOR KERNEL</span>
                <div className="kernel-matrix">
                  <span>0</span><span>1</span><span>0</span>
                  <span>1</span><span>−4</span><span>1</span>
                  <span>0</span><span>1</span><span>0</span>
                </div>
              </div>
            )}
          </div>

          <div className="detail-preview">
            <div className="detail-preview-heading">
              <span>VISUAL CONCEPT</span>
              <span className="preview-status">
                <span className="status-dot" />
                {stage.name.toUpperCase()}
              </span>
            </div>
            <Scene mode={stage.id} />
            <div className="detail-preview-footer">
              <span>Illustrative preview</span>
              <span>MODULE {stage.number} / 04</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function VisualGallery() {
  return (
    <section className="gallery-section">
      <div className="section-heading">
        <div>
          <div className="section-kicker">
            <Layers3 size={15} />
            VISUAL EXPLORATION
          </div>
          <h2>One image. Different perspectives.</h2>
          <p>
            See illustrative examples of how spatial processing
            changes the appearance of an image.
          </p>
        </div>
      </div>

      <div className="gallery-grid">
        <PreviewCard
          mode="original"
          title="Original"
          label="INPUT"
        />
        <PreviewCard
          mode="smoothing"
          title="Smoothing"
          label="FILTER"
        />
        <PreviewCard
          mode="laplacian"
          title="Laplacian"
          label="EDGES"
        />
        <PreviewCard
          mode="gamma"
          title="Gamma"
          label="TONE"
        />
      </div>

      <p className="gallery-note">
        These visuals demonstrate the concepts. Actual results
        will depend on the uploaded image and selected parameters.
      </p>
    </section>
  )
}

function Explore() {
  return (
    <main className="main-content">
      <Hero />
      <Pipeline />
      <VisualGallery />

      <section className="launch-panel">
        <div className="launch-symbol">
          <Sparkles size={31} />
        </div>
        <div>
          <div className="section-kicker">
            YOUR CREATIVE WORKSPACE AWAITS
          </div>
          <h2>Ready to see the difference?</h2>
          <p>
            Move from visual exploration to hands-on image enhancement.
          </p>
        </div>
        <Link to="/studio" className="button-primary">
          Launch PixelLab Studio
          <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  )
}


function Analysis() {
  return (
    <main className="main-content">
      <section className="subpage-hero">
        <div className="section-kicker">
          <ChartNoAxesCombined size={15} />
          PIXELLAB / ANALYSIS
        </div>
        <h1>Image Analysis</h1>
        <p>
          Understand image enhancement through
          histograms and quantitative measurements.
        </p>
      </section>

      <div className="analysis-placeholder">
        <div className="analysis-icon">
          <ChartNoAxesCombined size={42} />
        </div>
        <h2>Discover what changed</h2>
        <p>
          Once an image is processed, this page will display
          original and enhanced intensity histograms,
          mean brightness, contrast statistics, and comparisons.
        </p>
        <div className="analysis-tags">
          <span><Check size={14} /> Intensity histograms</span>
          <span><Check size={14} /> Brightness metrics</span>
          <span><Check size={14} /> Contrast analysis</span>
        </div>
        <Link to="/studio" className="button-primary">
          Go to Studio <ArrowRight size={17} />
        </Link>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />

        <Navbar />

        <Routes>
          <Route path="/" element={<Explore />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/analysis" element={<Analysis />} />
        </Routes>

        <footer className="app-footer">
          <span>© PixelLab · Digital Image Processing</span>
          <span>REFINE. ENHANCE. REVEAL.</span>
        </footer>
      </div>
    </BrowserRouter>
  )
}
