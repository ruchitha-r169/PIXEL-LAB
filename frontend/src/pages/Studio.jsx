
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  UploadCloud,
  Waves,
  ScanLine,
  Focus,
  Sun,
  Download,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
  LoaderCircle,
  MoveHorizontal,
  Eye,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { useProcessing } from '../ProcessingContext'
import './Studio.css'

const DEFAULTS = {
  method: 'Median',
  kernel: 3,
  strength: 0.5,
  gamma: 1,
}

const STAGES = [
  {
    id: 'original',
    label: 'Original Image',
    backendKey: 'Original',
    icon: ImageIcon,
  },
  {
    id: 'noise',
    label: 'Noise Reduction',
    backendKey: 'Smoothed',
    icon: Waves,
  },
  {
    id: 'edges',
    label: 'Edge Extraction (Laplacian)',
    backendKey: 'Laplacian',
    icon: ScanLine,
  },
  {
    id: 'sharpening',
    label: 'Image Sharpening',
    backendKey: 'Sharpened',
    icon: Focus,
  },
  {
    id: 'gamma',
    label: 'Gamma Correction',
    backendKey: 'Final',
    icon: Sun,
  },
  {
    id: 'final',
    label: 'Final Enhanced Image',
    backendKey: 'Final',
    icon: Sparkles,
  },
]

function Comparison({ before, after }) {
  const [position, setPosition] = useState(50)

  return (
    <div className="comparison-container">
      <div className="comparison-image">
        <img src={after} alt="Enhanced result" />

        <img
          src={before}
          alt="Original image"
          className="comparison-before"
          style={{
            clipPath: `inset(0 ${100 - position}% 0 0)`,
          }}
        />

        <div
          className="comparison-divider"
          style={{ left: `${position}%` }}
        >
          <div className="comparison-handle">
            <MoveHorizontal size={22} />
          </div>
        </div>

        <span className="comparison-label label-before">
          BEFORE
        </span>
        <span className="comparison-label label-after">
          AFTER
        </span>
      </div>

      <input
        className="comparison-range"
        type="range"
        min="0"
        max="100"
        value={position}
        aria-label="Comparison slider"
        onChange={(event) =>
          setPosition(Number(event.target.value))
        }
      />
    </div>
  )
}

export default function Studio() {
  const { processingResult, setProcessingResult } = useProcessing()

  const [file, setFile] = useState(null)
  const [originalUrl, setOriginalUrl] = useState(null)
  const [settings, setSettings] = useState({ ...DEFAULTS })
  const [selectedStage, setSelectedStage] = useState('original')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showComparison, setShowComparison] = useState(false)

  const inputRef = useRef(null)
  const result = processingResult

  useEffect(() => {
    if (!file) {
      setOriginalUrl(null)
      return
    }

    const url = URL.createObjectURL(file)
    setOriginalUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [file])

  const activeStage =
    STAGES.find((stage) => stage.id === selectedStage) ||
    STAGES[0]

  const displayedImage = result
    ? result.stages[activeStage.backendKey]
    : originalUrl

  function clearResult() {
    setProcessingResult(null)
    setSelectedStage('original')
    setShowComparison(false)
  }

  function updateSetting(name, value) {
    setSettings((previous) => ({
      ...previous,
      [name]: value,
    }))
    clearResult()
    setError('')
  }

  function handleFile(selectedFile) {
    if (!selectedFile) return

    if (!['image/png', 'image/jpeg'].includes(selectedFile.type)) {
      setError('Please select a PNG or JPEG image.')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Please select an image smaller than 10 MB.')
      return
    }

    setFile(selectedFile)
    clearResult()
    setError('')
  }

  async function processImage() {
    if (!file || loading) return

    setLoading(true)
    setError('')

    const form = new FormData()
    form.append('file', file)
    form.append('method', settings.method)
    form.append('kernel_size', String(settings.kernel))
    form.append('strength', String(settings.strength))
    form.append('gamma', String(settings.gamma))

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/process',
        {
          method: 'POST',
          body: form,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Image processing failed.'
        )
      }

      const required = [
        'Original',
        'Smoothed',
        'Laplacian',
        'Sharpened',
        'Final',
      ]

      if (
        !data.stages ||
        required.some(
          (key) => typeof data.stages[key] !== 'string'
        ) ||
        !data.analysis
      ) {
        throw new Error(
          'Backend response is incomplete. Restart FastAPI with the updated backend.py.'
        )
      }

      setProcessingResult(data)
      setSelectedStage('final')
      setShowComparison(false)
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Cannot connect to FastAPI. Check port 8000.'
          : err.message || 'Processing failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setSettings({ ...DEFAULTS })
    clearResult()
    setError('')
  }

  function chooseStage(id) {
    setSelectedStage(id)
    setShowComparison(false)
  }

  function downloadImage() {
    if (!result) return

    const link = document.createElement('a')
    link.href = result.stages.Final
    link.download = 'PixelLab_Enhanced.png'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <main className="main-content studio-page">
      <div className="studio-heading">
        <div>
          <div className="section-kicker">
            <Sparkles size={15} />
            PIXELLAB / ENHANCEMENT STUDIO
          </div>

          <h1>Enhancement Studio</h1>

          <p>
            Upload an image, adjust processing parameters,
            and explore the complete enhancement workflow.
          </p>
        </div>

        <div className="studio-heading-actions">
          <button
            type="button"
            className="studio-secondary-btn"
            onClick={reset}
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            type="button"
            className="studio-primary-btn"
            disabled={!file || loading}
            onClick={processImage}
          >
            {loading ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Sparkles size={17} />
            )}
            {loading ? 'Processing...' : 'Enhance Image'}
          </button>
        </div>
      </div>

      <div className="studio-layout">
        <section className="studio-card workspace-card">
          <div className="studio-card-header">
            <div>
              <span className="studio-overline">
                IMAGE WORKSPACE
              </span>
              <h2>Live Preview</h2>
            </div>

            <span className="studio-status">
              <span className="status-dot" />
              {result
                ? 'PROCESSED'
                : file
                  ? 'IMAGE LOADED'
                  : 'READY'}
            </span>
          </div>

          <div className="workspace-content">
            {!file ? (
              <div
                className="studio-dropzone"
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    inputRef.current?.click()
                  }
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  handleFile(event.dataTransfer.files[0])
                }}
              >
                <div className="upload-symbol">
                  <UploadCloud size={38} />
                </div>
                <h3>Drop your image here</h3>
                <p>or click to browse from your device</p>
                <span>PNG · JPG · JPEG · MAX 10 MB</span>
              </div>
            ) : (
              <>
                <div className="preview-toolbar">
                  <div className="preview-tabs">
                    {STAGES.map((stage) => (
                      <button
                        key={stage.id}
                        type="button"
                        disabled={
                          !result && stage.id !== 'original'
                        }
                        className={
                          selectedStage === stage.id
                            ? 'tab-active'
                            : ''
                        }
                        onClick={() => chooseStage(stage.id)}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="workspace-image">
                  {showComparison && result ? (
                    <Comparison
                      before={result.stages.Original}
                      after={result.stages.Final}
                    />
                  ) : (
                    <img
                      src={displayedImage}
                      alt={activeStage.label}
                    />
                  )}
                </div>

                <div className="workspace-bottom">
                  <span>
                    {file.name}
                    {result && ` · ${activeStage.label}`}
                  </span>

                  <button
                    type="button"
                    className="change-image-btn"
                    onClick={() => inputRef.current?.click()}
                  >
                    <ImageIcon size={15} />
                    Change Image
                  </button>
                </div>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            hidden
            onChange={(event) => {
              handleFile(event.target.files[0])
              event.target.value = ''
            }}
          />
        </section>

        <aside className="studio-card controls-card">
          <div className="studio-card-header">
            <div>
              <span className="studio-overline">
                PROCESSING PARAMETERS
              </span>
              <h2>Enhancement Controls</h2>
            </div>
            <Sparkles size={19} className="controls-header-icon" />
          </div>

          <div className="control-section">
            <div className="control-title">
              <Waves size={19} />
              <div>
                <strong>Noise Reduction</strong>
                <small>Median and averaging filters</small>
              </div>
            </div>

            <label htmlFor="filter-method">Filter Method</label>

            <select
              id="filter-method"
              value={settings.method}
              onChange={(event) =>
                updateSetting('method', event.target.value)
              }
            >
              <option value="Median">Median Filter</option>
              <option value="Box (Averaging)">
                Box (Averaging)
              </option>
            </select>

            <div className="slider-heading">
              <label htmlFor="kernel-size">Kernel Size</label>
              <span>
                {settings.kernel} × {settings.kernel}
              </span>
            </div>

            <input
              id="kernel-size"
              type="range"
              min="3"
              max="11"
              step="2"
              value={settings.kernel}
              onChange={(event) =>
                updateSetting(
                  'kernel',
                  Number(event.target.value)
                )
              }
            />

            <p className="control-hint">
              Reduces noise before edge detection.
            </p>
          </div>

          <div className="control-section">
            <div className="control-title">
              <ScanLine size={19} />
              <div>
                <strong>Edge Extraction (Laplacian)</strong>
                <small>Second-order derivative operator</small>
              </div>
            </div>

            <label>4-Neighbor Laplacian Kernel</label>

            <div className="kernel-display">
              {[0, 1, 0, 1, -4, 1, 0, 1, 0].map(
                (value, index) => (
                  <span key={index}>{value}</span>
                )
              )}
            </div>

            <p className="control-hint">
              Detects intensity changes and produces
              a visual edge map.
            </p>

            <button
              type="button"
              className="studio-secondary-btn"
              style={{ width: '100%', marginTop: 18 }}
              disabled={!result}
              onClick={() => chooseStage('edges')}
            >
              <Eye size={17} />
              View Extracted Edges
            </button>
          </div>

          <div className="control-section">
            <div className="control-title">
              <Focus size={19} />
              <div>
                <strong>Image Sharpening</strong>
                <small>Laplacian detail enhancement</small>
              </div>
            </div>

            <div className="slider-heading">
              <label htmlFor="strength">
                Sharpening Strength
              </label>
              <span>{settings.strength.toFixed(1)}</span>
            </div>

            <input
              id="strength"
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={settings.strength}
              onChange={(event) =>
                updateSetting(
                  'strength',
                  Number(event.target.value)
                )
              }
            />
          </div>

          <div className="control-section">
            <div className="control-title">
              <Sun size={19} />
              <div>
                <strong>Gamma Correction</strong>
                <small>Brightness transformation</small>
              </div>
            </div>

            <div className="slider-heading">
              <label htmlFor="gamma">Gamma Value</label>
              <span>{settings.gamma.toFixed(1)}</span>
            </div>

            <input
              id="gamma"
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={settings.gamma}
              onChange={(event) =>
                updateSetting(
                  'gamma',
                  Number(event.target.value)
                )
              }
            />

            <p className="control-hint">
              Below 1 brightens · Above 1 darkens
            </p>
          </div>
        </aside>
      </div>

      {error && (
        <div className="studio-error" role="alert">
          {error}
        </div>
      )}

      <section className="studio-card studio-workflow-card">
        <div className="studio-card-header">
          <div>
            <span className="studio-overline">
              DIGITAL IMAGE PROCESSING
            </span>
            <h2>Processing Workflow</h2>
          </div>

          <span className="studio-status">
            {result ? 'COMPLETE' : 'AWAITING IMAGE'}
          </span>
        </div>

        <div className="studio-workflow">
          {STAGES.map((stage, index) => {
            const Icon = stage.icon

            return (
              <div key={stage.id}>
                {index > 0 && (
                  <div className="studio-workflow-arrow">
                    <ArrowDown size={17} />
                  </div>
                )}

                <button
                  type="button"
                  className={`studio-workflow-step ${
                    selectedStage === stage.id
                      ? 'workflow-active'
                      : ''
                  }`}
                  disabled={
                    !result && stage.id !== 'original'
                  }
                  onClick={() => chooseStage(stage.id)}
                >
                  <Icon size={19} />
                  <span>{stage.label}</span>
                  {result && <CheckCircle2 size={17} />}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {result && (
        <>
          <section className="studio-card results-card">
            <div className="studio-card-header">
              <div>
                <span className="studio-overline">
                  PROCESSING RESULTS
                </span>
                <h2>Enhancement Pipeline</h2>
              </div>

              <span className="studio-dimensions">
                {result.width} × {result.height} px
              </span>
            </div>

            <div className="result-grid">
              {STAGES.map((stage, index) => (
                <button
                  type="button"
                  key={stage.id}
                  className={`result-stage ${
                    selectedStage === stage.id
                      ? 'result-selected'
                      : ''
                  }`}
                  onClick={() => chooseStage(stage.id)}
                >
                  <span>
                    {String(index + 1).padStart(2, '0')}
                    {' / '}
                    {stage.label}
                  </span>

                  <img
                    src={result.stages[stage.backendKey]}
                    alt={stage.label}
                  />
                </button>
              ))}
            </div>
          </section>

          <section className="studio-card export-card">
            <div>
              <span className="studio-overline">
                FINAL OUTPUT
              </span>
              <h2>Compare, Analyze & Export</h2>
              <p>
                Compare your images, view numerical analysis,
                or download the enhanced output.
              </p>
            </div>

            <div className="export-actions">
              <button
                type="button"
                className="studio-secondary-btn"
                onClick={() =>
                  setShowComparison(!showComparison)
                }
              >
                <MoveHorizontal size={17} />
                {showComparison
                  ? 'Hide Comparison'
                  : 'Compare'}
              </button>

              <Link
                to="/analysis"
                className="studio-primary-btn"
                style={{ textDecoration: 'none' }}
              >
                <ArrowRight size={17} />
                View Analysis
              </Link>

              <button
                type="button"
                className="studio-primary-btn"
                onClick={downloadImage}
              >
                <Download size={17} />
                Download PNG
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  )
}
