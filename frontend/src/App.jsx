
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
  BookOpen,
  ChartNoAxesCombined,
  CircleDot,
  Focus,
  Image as ImageIcon,
  Palette,
  ScanLine,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Waves,
} from 'lucide-react'

import Studio from './pages/Studio'
import ColorStudio from './pages/ColorStudio'
import Analysis from './pages/Analysis'
import { ProcessingContext } from './ProcessingContext'

import './App.css'

// ----------------------------------------------------
// IMAGE ENHANCEMENT PIPELINE
// ----------------------------------------------------

const stages = [
  {
    name: 'Original Image',
    icon: ImageIcon,
    description:
      'The original RGB image is used as the reference for enhancement.',
    formula: 'f(x, y)',
  },
  {
    name: 'Noise Reduction',
    icon: Waves,
    description:
      'Median and averaging filters reduce unwanted intensity variations.',
    formula: 'Median / Box Filter',
  },
  {
    name: 'Laplacian Edge Extraction',
    icon: ScanLine,
    description:
      'A second-order derivative operator detects rapid intensity changes.',
    formula: 'Laplacian = d²f/dx² + d²f/dy²',
  },
  {
    name: 'Image Sharpening',
    icon: Focus,
    description:
      'The Laplacian response is used to emphasize image details.',
    formula: 'g = f - alpha * Laplacian(f)',
  },
  {
    name: 'Gamma Correction',
    icon: Sun,
    description:
      'A nonlinear intensity transformation adjusts image brightness.',
    formula: 's = c * r^gamma',
  },
]

// ----------------------------------------------------
// NAVIGATION BAR
// ----------------------------------------------------

function Navbar() {
  const links = [
    {
      path: '/',
      label: 'Explore',
      icon: BookOpen,
    },
    {
      path: '/studio',
      label: 'Studio',
      icon: SlidersHorizontal,
    },
    {
      path: '/color-studio',
      label: 'Color Studio',
      icon: Palette,
    },
    {
      path: '/analysis',
      label: 'Analysis',
      icon: ChartNoAxesCombined,
    },
  ]

  return (
    <header className="nav-shell">

      <Link to="/" className="brand">
        <div className="brand-mark">
          <Aperture size={26} strokeWidth={1.8} />
        </div>

        <div className="brand-copy">
          <strong>
            PixelLab
            <span className="brand-dot">.</span>
          </strong>

          <small>
            REFINE · ENHANCE · REVEAL
          </small>
        </div>
      </Link>

      <nav
        className="navigation"
        aria-label="Main navigation"
      >
        {links.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `navigation-link ${
                isActive ? 'is-active' : ''
              }`
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

// ----------------------------------------------------
// EXPLORE PAGE
// ----------------------------------------------------

function Explore() {
  const [selected, setSelected] = useState(2)

  const current = stages[selected]
  const CurrentIcon = current.icon

  return (
    <main className="main-content">

      {/* HERO SECTION */}

      <section className="hero-panel">

        <div className="hero-copy">

          <div className="section-kicker">
            <Sparkles size={15} />
            DIGITAL IMAGE PROCESSING
          </div>

          <h1>
            A clearer perspective
            <br />
            <span>on every pixel.</span>
          </h1>

          <p>
            Discover the science of image enhancement
            and color image processing through an
            interactive digital image processing laboratory.
          </p>

          <div className="hero-buttons">

            <Link
              to="/studio"
              className="button-primary"
            >
              Enhancement Studio
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/color-studio"
              className="button-outline"
            >
              Explore Color Studio
              <Palette size={18} />
            </Link>

          </div>

          <div className="hero-facts">

            <div>
              <strong>05</strong>
              <span>Enhancement Stages</span>
            </div>

            <div className="fact-divider" />

            <div>
              <strong>06</strong>
              <span>Color Modules</span>
            </div>

            <div className="fact-divider" />

            <div>
              <strong>RGB</strong>
              <span>Image Processing</span>
            </div>

          </div>

        </div>

        <div className="hero-visual">

          <div className="hero-orbit orbit-outer" />
          <div className="hero-orbit orbit-inner" />

          <div className="hero-preview preview-front">

            <div
              style={{
                minHeight: 260,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 18,
                background:
                  'linear-gradient(135deg, #eee8ff, #dcefff)',
                color: '#8172e5',
              }}
            >
              <Aperture
                size={110}
                strokeWidth={1}
              />
            </div>

            <span className="image-chip">
              <Sparkles size={13} />
              IMAGE PROCESSING
            </span>

          </div>

        </div>

      </section>

      {/* PROCESSING PIPELINE */}

      <section
        className="pipeline-section"
        id="pipeline"
      >

        <div className="section-heading">

          <div>

            <div className="section-kicker">
              <CircleDot size={14} />
              INTERACTIVE WORKFLOW
            </div>

            <h2>
              Inside the Enhancement Engine
            </h2>

            <p>
              Explore each stage of the classical
              image enhancement pipeline.
            </p>

          </div>

        </div>

        <div className="pipeline-panel">

          <div className="pipeline-toolbar">
            <span>
              PIXELLAB / PROCESSING FLOW
            </span>

            <span>
              INTERACTIVE DEMONSTRATION
            </span>
          </div>

          <div className="pipeline-nodes">

            {stages.map((stage, index) => {
              const Icon = stage.icon

              return (
                <div
                  className="node-group"
                  key={stage.name}
                >

                  <button
                    type="button"
                    className={`pipeline-node ${
                      selected === index
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() =>
                      setSelected(index)
                    }
                  >

                    <span className="node-index">
                      {String(index).padStart(2, '0')}
                    </span>

                    <span className="node-icon">
                      <Icon size={26} />
                    </span>

                    <strong>
                      {stage.name}
                    </strong>

                    <small>
                      Stage {index + 1}
                    </small>

                  </button>

                </div>
              )
            })}

          </div>

          <div className="pipeline-detail">

            <div className="detail-information">

              <span className="detail-eyebrow">
                SELECTED MODULE / {selected}
              </span>

              <div className="detail-title">

                <div className="detail-icon">
                  <CurrentIcon size={25} />
                </div>

                <h3>
                  {current.name}
                </h3>

              </div>

              <p className="detail-lead">
                {current.description}
              </p>

              <div className="formula-panel">

                <span>
                  MATHEMATICAL FOUNDATION
                </span>

                <strong>
                  {current.formula}
                </strong>

              </div>

              {selected === 2 && (
                <div className="kernel-panel">

                  <span>
                    4-NEIGHBOR LAPLACIAN KERNEL
                  </span>

                  <div className="kernel-matrix">

                    {[
                      0, 1, 0,
                      1, -4, 1,
                      0, 1, 0,
                    ].map((value, index) => (
                      <span key={index}>
                        {value}
                      </span>
                    ))}

                  </div>

                </div>
              )}

            </div>

            <div className="detail-preview">

              <div className="detail-preview-heading">
                <span>
                  PROCESSING CONCEPT
                </span>
              </div>

              <div
                style={{
                  minHeight: 220,
                  display: 'grid',
                  placeItems: 'center',
                  color: '#8172e5',
                }}
              >
                <CurrentIcon
                  size={85}
                  strokeWidth={1}
                />
              </div>

              <div className="detail-preview-footer">
                <span>
                  Conceptual illustration
                </span>

                <span>
                  MODULE {selected} / 04
                </span>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* COLOR STUDIO INTRODUCTION */}

      <section className="launch-panel">

        <div className="launch-symbol">
          <Palette size={31} />
        </div>

        <div>

          <div className="section-kicker">
            COLOR IMAGE PROCESSING
          </div>

          <h2>
            Discover the World of Color
          </h2>

          <p>
            Experiment with color negatives,
            color slicing, pseudocolor,
            full-color enhancement, color models,
            and HSV segmentation.
          </p>

        </div>

        <Link
          to="/color-studio"
          className="button-primary"
        >
          Launch Color Studio
          <ArrowRight size={18} />
        </Link>

      </section>

      {/* ANALYSIS INTRODUCTION */}

      <section
        className="launch-panel"
        style={{ marginTop: 24 }}
      >

        <div className="launch-symbol">
          <ChartNoAxesCombined size={31} />
        </div>

        <div>

          <div className="section-kicker">
            QUANTITATIVE IMAGE EVALUATION
          </div>

          <h2>
            Analyze Every Enhancement
          </h2>

          <p>
            Compare original and enhanced images
            using histograms, brightness, contrast,
            MSE, PSNR, and SSIM.
          </p>

        </div>

        <Link
          to="/analysis"
          className="button-primary"
        >
          Open Analysis
          <ArrowRight size={18} />
        </Link>

      </section>

    </main>
  )
}

// ----------------------------------------------------
// MAIN APPLICATION
// ----------------------------------------------------

export default function App() {

  const [
    processingResult,
    setProcessingResult,
  ] = useState(null)

  return (

    <ProcessingContext.Provider
      value={{
        processingResult,
        setProcessingResult,
      }}
    >

      <BrowserRouter>

        <div className="app-shell">

          <div className="ambient ambient-one" />
          <div className="ambient ambient-two" />

          <Navbar />

          <Routes>

            <Route
              path="/"
              element={<Explore />}
            />

            <Route
              path="/studio"
              element={<Studio />}
            />

            <Route
              path="/color-studio"
              element={<ColorStudio />}
            />

            <Route
              path="/analysis"
              element={<Analysis />}
            />

          </Routes>

          <footer className="app-footer">

            <span>
              © PixelLab · Digital Image Processing
            </span>

            <span>
              REFINE. ENHANCE. REVEAL.
            </span>

          </footer>

        </div>

      </BrowserRouter>

    </ProcessingContext.Provider>
  )
}
