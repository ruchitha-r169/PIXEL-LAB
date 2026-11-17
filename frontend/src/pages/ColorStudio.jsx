
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Download,
  Droplets,
  Eye,
  Image as ImageIcon,
  Layers3,
  LoaderCircle,
  MoveHorizontal,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  WandSparkles,
} from 'lucide-react'

import { useProcessing } from '../ProcessingContext'
import './ColorStudio.css'

const API = 'http://127.0.0.1:8000/color/process'

const OPERATIONS = [
  {
    id: 'negative',
    name: 'Color Negative',
    short: 'Invert RGB colors',
    icon: WandSparkles,
    category: 'Color Transformation',
    description:
      'Create a photographic negative by inverting the RGB values of every pixel.',
    theory: 's = 255 - r',
  },
  {
    id: 'slicing',
    name: 'Color Slicing',
    short: 'Highlight selected colors',
    icon: Droplets,
    category: 'Color Selection',
    description:
      'Preserve pixels near a selected color while converting other regions to grayscale.',
    theory: 'd = sqrt((R-Rt)^2 + (G-Gt)^2 + (B-Bt)^2)',
  },
  {
    id: 'pseudocolor',
    name: 'Pseudocolor',
    short: 'Artificial color mapping',
    icon: Palette,
    category: 'Intensity Mapping',
    description:
      'Map grayscale intensities to artificial colors using predefined color maps.',
    theory: 'RGB(x,y) = LUT[I(x,y)]',
  },
  {
    id: 'enhancement',
    name: 'Full-Color Enhancement',
    short: 'Adjust image colors',
    icon: SlidersHorizontal,
    category: 'Color Enhancement',
    description:
      'Adjust brightness, contrast, saturation, and individual RGB channel gains.',
    theory: 'g = alpha * (f - 127.5) + 127.5 + beta',
  },
  {
    id: 'models',
    name: 'Color Model Explorer',
    short: 'Explore five color models',
    icon: Layers3,
    category: 'Color Fundamentals',
    description:
      'Explore RGB, CMY, CMYK, HSI, and YCbCr using their individual image components.',
    theory: 'RGB → CMY / CMYK / HSI / YCbCr',
  },
  {
    id: 'segmentation',
    name: 'Color Segmentation',
    short: 'Isolate regions using HSV',
    icon: Eye,
    category: 'Color Segmentation',
    description:
      'Isolate image regions based on hue, saturation, and value thresholds.',
    theory: 'Mask = Hue Range AND Saturation AND Value',
  },
]

const DEFAULTS = {
  selected_color: '#ff0000',
  tolerance: 80,
  colormap: 'JET',
  brightness: 0,
  contrast: 1,
  saturation: 1,
  red_gain: 1,
  green_gain: 1,
  blue_gain: 1,
  hue_center: 0,
  hue_range: 15,
  sat_min: 70,
  val_min: 50,
  model: 'RGB',
}

const MODEL_DETAILS = {
  RGB: {
    title: 'RGB Color Model',
    description:
      'The additive color model represents an image using Red, Green, and Blue channels.',
    components: 'Red · Green · Blue',
  },
  CMY: {
    title: 'CMY Color Model',
    description:
      'The subtractive color model uses Cyan, Magenta, and Yellow components.',
    components: 'Cyan · Magenta · Yellow',
  },
  CMYK: {
    title: 'CMYK Color Model',
    description:
      'CMYK extends CMY with a Black component and is commonly used in printing.',
    components: 'Cyan · Magenta · Yellow · Black',
  },
  HSI: {
    title: 'HSI Color Model',
    description:
      'HSI separates color information into Hue, Saturation, and Intensity.',
    components: 'Hue · Saturation · Intensity',
  },
  YCbCr: {
    title: 'YCbCr Color Model',
    description:
      'YCbCr separates luma from blue-difference and red-difference chroma.',
    components: 'Y (Luma) · Cb · Cr',
  },
}

function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
}) {
  return (
    <div className="cs-range-field">
      <div className="cs-range-label">
        <label>{label}</label>
        <span>{value}{suffix}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
      />

      <div className="cs-range-ends">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

function SelectControl({
  label,
  value,
  options,
  onChange,
}) {
  return (
    <div className="cs-select-field">
      <label>{label}</label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

function downloadImage(dataUrl, filename) {
  if (!dataUrl) return

  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename

  document.body.appendChild(link)
  link.click()
  link.remove()
}

function Comparison({ original, processed }) {
  const [position, setPosition] = useState(50)

  return (
    <div className="cs-comparison">
      <div className="cs-comparison-canvas">
        <img
          src={processed}
          alt="Processed image"
        />

        <img
          src={original}
          alt="Original image"
          className="cs-before"
          style={{
            clipPath: `inset(0 ${100 - position}% 0 0)`,
          }}
        />

        <div
          className="cs-divider"
          style={{ left: `${position}%` }}
        >
          <span>
            <MoveHorizontal size={19} />
          </span>
        </div>

        <div className="cs-image-label cs-left">
          ORIGINAL
        </div>

        <div className="cs-image-label cs-right">
          PROCESSED
        </div>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={(event) =>
          setPosition(Number(event.target.value))
        }
        aria-label="Before and after comparison"
      />
    </div>
  )
}

function ModelPreview({ channels, model }) {
  const entries = Object.entries(channels || {})

  return (
    <div style={{ width: '100%', padding: 8 }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <span
          style={{
            display: 'inline-block',
            padding: '8px 15px',
            borderRadius: 100,
            background: '#edeaff',
            color: '#7869d5',
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {model} COLOR COMPONENTS
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(min(100%, 145px), 1fr))',
          gap: 14,
        }}
      >
        {entries.map(([name, imageUrl]) => (
          <div
            key={name}
            style={{
              padding: 12,
              borderRadius: 15,
              background: '#ffffff',
              border: '1px solid #e3e5f4',
            }}
          >
            <div
              style={{
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: 10,
                background: '#f2f4fa',
              }}
            >
              <img
                src={imageUrl}
                alt={`${model} ${name} component`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 12,
              }}
            >
              <strong style={{ fontSize: 12 }}>
                {name}
              </strong>

              <button
                type="button"
                title={`Download ${name} component`}
                onClick={() =>
                  downloadImage(
                    imageUrl,
                    `ImageEnhancementProject_${model}_${name.replaceAll(' ', '_')}.png`
                  )
                }
              >
                <Download size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <p
        style={{
          marginTop: 18,
          textAlign: 'center',
          color: '#8995ae',
          fontSize: 12,
        }}
      >
        Each component is visualized as an intensity map.
        Brighter pixels indicate larger component values.
      </p>
    </div>
  )
}

export default function ColorStudio() {
  const { setColorResult } = useProcessing()

  const [operation, setOperation] = useState('negative')
  const [settings, setSettings] = useState({ ...DEFAULTS })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState('processed')
  const [dragging, setDragging] = useState(false)
  const [autoApply, setAutoApply] = useState(false)

  const fileInput = useRef(null)
  const requestId = useRef(0)
  const abortController = useRef(null)

  const active = OPERATIONS.find(
    (item) => item.id === operation
  )

  const isModelMode = operation === 'models'
  const modelInfo = MODEL_DETAILS[settings.model]

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }

    const url = URL.createObjectURL(file)
    setPreview(url)

    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    return () => {
      requestId.current += 1
      abortController.current?.abort()
    }
  }, [])

  function invalidateResult() {
    requestId.current += 1
    abortController.current?.abort()
    abortController.current = null

    setLoading(false)
    setResult(null)
    setError('')
    setView('processed')
  }

  function updateSetting(key, value) {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }))

    invalidateResult()
  }

  function selectOperation(id) {
    if (id === operation) return

    invalidateResult()
    setOperation(id)
  }

  function chooseFile(selectedFile) {
    if (!selectedFile) return

    if (
      !['image/png', 'image/jpeg'].includes(
        selectedFile.type
      )
    ) {
      setError('Please select a PNG or JPEG image.')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('The image must be smaller than 10 MB.')
      return
    }

    invalidateResult()
    setFile(selectedFile)
  }

  async function processImage() {
    if (!file) return

    abortController.current?.abort()

    const controller = new AbortController()
    abortController.current = controller

    const id = ++requestId.current

    setLoading(true)
    setError('')

    const form = new FormData()

    form.append('file', file)
    form.append('operation', operation)

    Object.entries(settings).forEach(([key, value]) => {
      form.append(key, String(value))
    })

    try {
      const response = await fetch(API, {
        method: 'POST',
        body: form,
        signal: controller.signal,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Unable to process the image.'
        )
      }

      if (id !== requestId.current) return

      if (!data.original || !data.processed) {
        throw new Error(
          'The backend returned an incomplete result.'
        )
      }

      if (operation === 'models' && !data.channels) {
        throw new Error(
          'The backend did not return color model components.'
        )
      }

      const completedResult = {
        ...data,
        operation,
        operationName: active.name,
        settings: { ...settings },
        filename: file.name,
        source: 'color',
        processedAt: new Date().toISOString(),
      }

      setResult(data)

      // Share the completed experiment with Analysis.
      setColorResult(completedResult)

      setView('processed')
    } catch (err) {
      if (err.name === 'AbortError') return
      if (id !== requestId.current) return

      setError(
        err instanceof TypeError
          ? 'Cannot connect to FastAPI. Make sure the backend is running on port 8000.'
          : err.message
      )
    } finally {
      if (id === requestId.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!autoApply || !file) return

    const timer = setTimeout(() => {
      processImage()
    }, 450)

    return () => clearTimeout(timer)

    // Reprocess when experiment settings change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoApply, file, operation, settings])

  function reset() {
    invalidateResult()
    setSettings({ ...DEFAULTS })
    setAutoApply(false)
  }

  function renderControls() {
    if (operation === 'negative') {
      return (
        <div className="cs-information">
          <Sparkles size={23} />
          <strong>No additional parameters required</strong>
          <p>
            The negative transformation subtracts
            every RGB channel value from 255.
          </p>
        </div>
      )
    }

    if (operation === 'slicing') {
      return (
        <>
          <div className="cs-color-picker">
            <label>Target Color</label>

            <div>
              <input
                type="color"
                value={settings.selected_color}
                onChange={(event) =>
                  updateSetting(
                    'selected_color',
                    event.target.value
                  )
                }
              />

              <span>
                {settings.selected_color.toUpperCase()}
              </span>
            </div>
          </div>

          <RangeControl
            label="Color Tolerance"
            value={settings.tolerance}
            min={0}
            max={442}
            onChange={(v) =>
              updateSetting('tolerance', v)
            }
          />

          <p className="cs-hint">
            Lower tolerance selects fewer colors.
            Higher tolerance includes a wider range.
          </p>
        </>
      )
    }

    if (operation === 'pseudocolor') {
      return (
        <>
          <SelectControl
            label="Pseudocolor Map"
            value={settings.colormap}
            options={[
              'JET',
              'HOT',
              'OCEAN',
              'VIRIDIS',
              'TURBO',
              'PLASMA',
              'INFERNO',
              'BONE',
            ]}
            onChange={(v) =>
              updateSetting('colormap', v)
            }
          />

          <p className="cs-hint">
            The input is converted to grayscale,
            and a color lookup table is applied.
          </p>
        </>
      )
    }

    if (operation === 'enhancement') {
      return (
        <>
          <RangeControl
            label="Brightness"
            value={settings.brightness}
            min={-100}
            max={100}
            onChange={(v) =>
              updateSetting('brightness', v)
            }
          />

          <RangeControl
            label="Contrast"
            value={settings.contrast}
            min={0.2}
            max={3}
            step={0.1}
            onChange={(v) =>
              updateSetting('contrast', v)
            }
          />

          <RangeControl
            label="Saturation"
            value={settings.saturation}
            min={0}
            max={3}
            step={0.1}
            onChange={(v) =>
              updateSetting('saturation', v)
            }
          />

          <div className="cs-subheading">
            RGB CHANNEL BALANCE
          </div>

          <RangeControl
            label="Red Gain"
            value={settings.red_gain}
            min={0}
            max={3}
            step={0.1}
            onChange={(v) =>
              updateSetting('red_gain', v)
            }
          />

          <RangeControl
            label="Green Gain"
            value={settings.green_gain}
            min={0}
            max={3}
            step={0.1}
            onChange={(v) =>
              updateSetting('green_gain', v)
            }
          />

          <RangeControl
            label="Blue Gain"
            value={settings.blue_gain}
            min={0}
            max={3}
            step={0.1}
            onChange={(v) =>
              updateSetting('blue_gain', v)
            }
          />
        </>
      )
    }

    if (operation === 'models') {
      return (
        <>
          <SelectControl
            label="Color Model"
            value={settings.model}
            options={[
              'RGB',
              'CMY',
              'CMYK',
              'HSI',
              'YCbCr',
            ]}
            onChange={(v) =>
              updateSetting('model', v)
            }
          />

          <div className="cs-information">
            <Layers3 size={22} />

            <strong>{modelInfo.title}</strong>

            <p>{modelInfo.description}</p>

            <p>
              <strong>Components:</strong>{' '}
              {modelInfo.components}
            </p>
          </div>

          <p className="cs-hint">
            Select a color model and click Apply Effect.
            The individual components will appear
            directly in the image workspace.
          </p>
        </>
      )
    }

    if (operation === 'segmentation') {
      return (
        <>
          <RangeControl
            label="Hue Center"
            value={settings.hue_center}
            min={0}
            max={179}
            onChange={(v) =>
              updateSetting('hue_center', v)
            }
          />

          <RangeControl
            label="Hue Range"
            value={settings.hue_range}
            min={0}
            max={90}
            onChange={(v) =>
              updateSetting('hue_range', v)
            }
          />

          <RangeControl
            label="Minimum Saturation"
            value={settings.sat_min}
            min={0}
            max={255}
            onChange={(v) =>
              updateSetting('sat_min', v)
            }
          />

          <RangeControl
            label="Minimum Value"
            value={settings.val_min}
            min={0}
            max={255}
            onChange={(v) =>
              updateSetting('val_min', v)
            }
          />

          <p className="cs-hint">
            In OpenCV, hue ranges from 0 to 179.
            Red is near 0, green near 60,
            and blue near 120.
          </p>
        </>
      )
    }

    return null
  }

  return (
    <main className="cs-page">

      {/* PAGE HEADER */}

      <section className="cs-hero">
        <div>
          <div className="cs-kicker">
            <Palette size={16} />
            IMAGEENHANCEMENTPROJECT / COLOR PROCESSING
          </div>

          <h1>
            Color <span>Studio.</span>
          </h1>

          <p>
            An interactive color image processing
            laboratory for transformations,
            enhancement, segmentation,
            pseudocolor processing, and color models.
          </p>
        </div>

        <div className="cs-hero-symbol">
          <Palette size={58} strokeWidth={1.2} />
        </div>
      </section>

      {/* MODULE SELECTION */}

      <section className="cs-module-section">
        <div className="cs-section-title">
          <div>
            <span>01 / SELECT EXPERIMENT</span>
            <h2>Color Processing Modules</h2>
          </div>

          <div className="cs-module-count">
            06 INTERACTIVE MODULES
          </div>
        </div>

        <div className="cs-module-grid">
          {OPERATIONS.map((item, index) => {
            const Icon = item.icon

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  selectOperation(item.id)
                }
                className={`cs-module ${
                  operation === item.id
                    ? 'cs-module-active'
                    : ''
                }`}
              >
                <div className="cs-module-top">
                  <span className="cs-module-icon">
                    <Icon size={22} />
                  </span>

                  <span className="cs-module-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <strong>{item.name}</strong>
                <small>{item.short}</small>

                <span className="cs-module-category">
                  {item.category}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* WORKSPACE */}

      <section className="cs-workspace-section">
        <div className="cs-section-title">
          <div>
            <span>02 / INTERACTIVE WORKSPACE</span>
            <h2>{active.name}</h2>
            <p>{active.description}</p>
          </div>
        </div>

        <div className="cs-workspace-grid">

          {/* IMAGE PREVIEW */}

          <div className="cs-panel cs-image-panel">
            <div className="cs-panel-header">
              <div>
                <span>VISUAL WORKSPACE</span>
                <h3>
                  {isModelMode
                    ? 'Color Component Explorer'
                    : 'Image Preview'}
                </h3>
              </div>

              <div className="cs-status">
                <span />
                {loading
                  ? 'PROCESSING'
                  : result
                    ? 'COMPLETE'
                    : file
                      ? 'IMAGE READY'
                      : 'AWAITING IMAGE'}
              </div>
            </div>

            {!file ? (
              <div
                className={`cs-dropzone ${
                  dragging ? 'cs-dragging' : ''
                }`}
                role="button"
                tabIndex={0}
                onClick={() =>
                  fileInput.current?.click()
                }
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' ||
                    event.key === ' '
                  ) {
                    event.preventDefault()
                    fileInput.current?.click()
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() =>
                  setDragging(false)
                }
                onDrop={(event) => {
                  event.preventDefault()
                  setDragging(false)
                  chooseFile(
                    event.dataTransfer.files[0]
                  )
                }}
              >
                <div className="cs-upload-icon">
                  <UploadCloud size={38} />
                </div>

                <h3>Drop your image here</h3>
                <p>Or click to browse your computer</p>
                <small>
                  PNG / JPG / JPEG · MAX 10 MB
                </small>
              </div>
            ) : (
              <>
                <div className="cs-preview-toolbar">

                  {!isModelMode ? (
                    <div className="cs-preview-tabs">
                      <button
                        type="button"
                        className={
                          view === 'original'
                            ? 'active'
                            : ''
                        }
                        onClick={() =>
                          setView('original')
                        }
                      >
                        Original
                      </button>

                      <button
                        type="button"
                        disabled={!result}
                        className={
                          view === 'processed'
                            ? 'active'
                            : ''
                        }
                        onClick={() =>
                          setView('processed')
                        }
                      >
                        Processed
                      </button>

                      <button
                        type="button"
                        disabled={!result}
                        className={
                          view === 'compare'
                            ? 'active'
                            : ''
                        }
                        onClick={() =>
                          setView('compare')
                        }
                      >
                        Compare
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 9,
                        color: '#8172db',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      <Layers3 size={18} />
                      {settings.model} COMPONENT VIEW
                    </div>
                  )}

                  <button
                    type="button"
                    className="cs-text-button"
                    onClick={() =>
                      fileInput.current?.click()
                    }
                  >
                    Change Image
                  </button>
                </div>

                <div className="cs-preview-canvas">
                  {isModelMode && result?.channels ? (
                    <ModelPreview
                      channels={result.channels}
                      model={settings.model}
                    />
                  ) : view === 'compare' && result ? (
                    <Comparison
                      original={result.original}
                      processed={result.processed}
                    />
                  ) : (
                    <img
                      src={
                        view === 'original' || !result
                          ? preview
                          : result.processed
                      }
                      alt="Color processing preview"
                    />
                  )}

                  {loading && (
                    <div className="cs-loading-overlay">
                      <LoaderCircle
                        size={35}
                        className="cs-spin"
                      />

                      <span>
                        Processing image...
                      </span>
                    </div>
                  )}
                </div>

                <div className="cs-file-info">
                  <span title={file.name}>
                    <ImageIcon size={15} />
                    {file.name}
                  </span>

                  {result?.width && result?.height && (
                    <span>
                      {result.width} × {result.height} px
                    </span>
                  )}
                </div>
              </>
            )}

            <input
              ref={fileInput}
              type="file"
              hidden
              accept="image/png,image/jpeg"
              onChange={(event) => {
                chooseFile(event.target.files[0])
                event.target.value = ''
              }}
            />

            {error && (
              <div
                className="cs-error"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>

          {/* PROCESSING CONTROLS */}

          <aside className="cs-panel cs-controls-panel">
            <div className="cs-panel-header">
              <div>
                <span>EXPERIMENT SETTINGS</span>
                <h3>Processing Controls</h3>
              </div>

              <SlidersHorizontal size={20} />
            </div>

            <div className="cs-controls-content">
              {renderControls()}

              <div className="cs-theory">
                <span>MATHEMATICAL CONCEPT</span>
                <strong>{active.theory}</strong>
              </div>

              <label className="cs-auto-label">
                <input
                  type="checkbox"
                  checked={autoApply}
                  onChange={(event) =>
                    setAutoApply(
                      event.target.checked
                    )
                  }
                />

                <span>
                  Auto-apply changes

                  <small>
                    Automatically updates the result
                  </small>
                </span>
              </label>
            </div>

            <div className="cs-control-actions">
              <button
                className="cs-reset-btn"
                type="button"
                onClick={reset}
              >
                <RotateCcw size={16} />
                Reset
              </button>

              <button
                className="cs-apply-btn"
                type="button"
                disabled={!file || loading}
                onClick={processImage}
              >
                {loading ? (
                  <LoaderCircle
                    size={18}
                    className="cs-spin"
                  />
                ) : (
                  <Sparkles size={18} />
                )}

                {loading
                  ? 'Processing...'
                  : 'Apply Effect'}
              </button>
            </div>
          </aside>
        </div>
      </section>

      {/* RESULTS */}

      {result && (
        <section className="cs-results">

          <div className="cs-section-title">
            <div>
              <span>03 / PROCESSING RESULTS</span>

              <h2>
                {isModelMode
                  ? `${settings.model} Color Components`
                  : 'Experiment Output'}
              </h2>

              <p>{result.explanation}</p>
            </div>

            <div className="cs-success">
              <CheckCircle2 size={17} />
              PROCESSING COMPLETE
            </div>
          </div>

          {!isModelMode && (
            <div className="cs-result-grid">

              <div className="cs-panel cs-result-card">
                <span>01 / ORIGINAL</span>

                <div className="cs-result-image">
                  <img
                    src={result.original}
                    alt="Original image"
                  />
                </div>

                <h3>Input Image</h3>
                <p>Original RGB image</p>
              </div>

              <div className="cs-panel cs-result-card">
                <span>02 / PROCESSED</span>

                <div className="cs-result-image">
                  <img
                    src={result.processed}
                    alt="Processed image"
                  />
                </div>

                <h3>{active.name}</h3>
                <p>Processed output</p>
              </div>

              {result.mask && (
                <div className="cs-panel cs-result-card">
                  <span>03 / BINARY MASK</span>

                  <div className="cs-result-image">
                    <img
                      src={result.mask}
                      alt="Binary selection mask"
                    />
                  </div>

                  <h3>Selection Mask</h3>

                  <p>
                    Selected pixels:{' '}
                    {result.selected_pixels_percent}%
                  </p>
                </div>
              )}
            </div>
          )}

          {isModelMode && result.channels && (
            <div className="cs-panel cs-channel-panel">
              <div className="cs-panel-header">
                <div>
                  <span>COLOR SPACE ANALYSIS</span>
                  <h3>{modelInfo.title}</h3>
                </div>

                <Layers3 size={21} />
              </div>

              <div style={{ padding: 24 }}>
                <p
                  style={{
                    color: '#8190a9',
                    fontSize: 13,
                    marginBottom: 20,
                  }}
                >
                  {modelInfo.description}
                </p>

                <ModelPreview
                  channels={result.channels}
                  model={settings.model}
                />
              </div>
            </div>
          )}

          {/* ANALYSIS AND EXPORT */}

          <div
            className="cs-panel"
            style={{
              padding: 24,
              marginTop: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 18,
              }}
            >
              <div>
                <span className="cs-subheading">
                  04 / ANALYZE & EXPORT
                </span>

                <h3 style={{ margin: '10px 0 6px' }}>
                  Experiment Analysis
                </h3>

                <p
                  style={{
                    color: '#8190a9',
                    fontSize: 13,
                    maxWidth: 470,
                  }}
                >
                  Explore image histograms, brightness,
                  contrast, color components, comparison
                  metrics, and downloadable analysis reports.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  className="cs-reset-btn"
                  onClick={() =>
                    downloadImage(
                      result.processed,
                      `ImageEnhancementProject_${operation}.png`
                    )
                  }
                >
                  <Download size={17} />
                  Download Image
                </button>

                <Link
                  to="/analysis?source=color"
                  className="cs-apply-btn"
                  style={{
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 9,
                    padding: '13px 20px',
                  }}
                >
                  <BarChart3 size={18} />
                  View Analysis
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
