
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Layers3,
  MoveHorizontal,
  Palette,
  ScanLine,
  Sparkles,
  Sun,
} from 'lucide-react'

import { useProcessing } from '../ProcessingContext'
import './Analysis.css'

const COLORS = {
  original: '#8979e6',
  processed: '#43a9d8',
  red: '#e66b80',
  green: '#48ae8b',
  blue: '#6495ed',
}

const OPERATIONS = {
  negative: 'Color Negative',
  slicing: 'Color Slicing',
  pseudocolor: 'Pseudocolor',
  enhancement: 'Full-Color Enhancement',
  models: 'Color Model Explorer',
  segmentation: 'Color Segmentation',
}

function number(value, digits = 2) {
  if (value === null || value === undefined) {
    return 'N/A'
  }

  if (!Number.isFinite(Number(value))) {
    return 'N/A'
  }

  return Number(value).toFixed(digits)
}

function getImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () =>
      reject(new Error('Unable to load image data.'))

    image.src = dataUrl
  })
}

async function readImage(dataUrl) {
  const image = await getImage(dataUrl)

  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  const context = canvas.getContext('2d', {
    willReadFrequently: true,
  })

  if (!context) {
    throw new Error('Canvas is unavailable.')
  }

  context.drawImage(image, 0, 0)

  return {
    width: canvas.width,
    height: canvas.height,
    pixels: context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    ).data,
  }
}

function calculateStatistics(image) {
  const histogram = Array(256).fill(0)

  const rgbHistograms = {
    red: Array(256).fill(0),
    green: Array(256).fill(0),
    blue: Array(256).fill(0),
  }

  const { pixels } = image
  const count = pixels.length / 4

  let sum = 0
  let sumSquared = 0
  let min = 255
  let max = 0

  let redSum = 0
  let greenSum = 0
  let blueSum = 0

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]

    // BT.601 grayscale intensity.
    const intensity = Math.max(
      0,
      Math.min(
        255,
        Math.round(
          0.299 * r +
          0.587 * g +
          0.114 * b
        )
      )
    )

    histogram[intensity]++

    rgbHistograms.red[r]++
    rgbHistograms.green[g]++
    rgbHistograms.blue[b]++

    sum += intensity
    sumSquared += intensity * intensity

    redSum += r
    greenSum += g
    blueSum += b

    min = Math.min(min, intensity)
    max = Math.max(max, intensity)
  }

  const mean = count ? sum / count : 0

  const variance = count
    ? Math.max(0, sumSquared / count - mean * mean)
    : 0

  return {
    mean,
    std_dev: Math.sqrt(variance),
    min,
    max,
    histogram,
    rgbHistograms,
    channelMeans: {
      red: count ? redSum / count : 0,
      green: count ? greenSum / count : 0,
      blue: count ? blueSum / count : 0,
    },
  }
}

function calculateQuality(original, processed) {
  if (
    original.width !== processed.width ||
    original.height !== processed.height
  ) {
    return null
  }

  const a = original.pixels
  const b = processed.pixels

  let error = 0
  let absoluteError = 0
  let changed = 0

  const pixelCount = a.length / 4

  for (let i = 0; i < a.length; i += 4) {
    let pixelChanged = false

    for (let channel = 0; channel < 3; channel++) {
      const difference = a[i + channel] - b[i + channel]

      error += difference * difference
      absoluteError += Math.abs(difference)

      if (difference !== 0) {
        pixelChanged = true
      }
    }

    if (pixelChanged) changed++
  }

  const sampleCount = pixelCount * 3
  const mse = sampleCount ? error / sampleCount : 0
  const mae = sampleCount
    ? absoluteError / sampleCount
    : 0

  const psnr = mse === 0
    ? Infinity
    : 10 * Math.log10((255 * 255) / mse)

  return {
    mse,
    mae,
    psnr,
    changedPercent: pixelCount
      ? (changed / pixelCount) * 100
      : 0,
  }
}

function Metric({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="analysis-metric">
      <div className="analysis-metric-icon">
        <Icon size={20} />
      </div>

      <span>{label}</span>

      <div className="analysis-metric-value">
        {value}
      </div>

      <p>{description}</p>
    </div>
  )
}

function Histogram({
  values,
  title,
  color,
  description = '256 intensity bins',
}) {
  const max = Math.max(1, ...values)

  const points = values
    .map((value, index) => {
      const x = 20 + index * (660 / 255)
      const y = 195 - (value / max) * 170

      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="analysis-histogram">
      <h3 style={{ color }}>{title}</h3>

      <svg
        viewBox="0 0 700 220"
        role="img"
        aria-label={`${title} histogram`}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <line
            key={v}
            x1="20"
            x2="680"
            y1={195 - v * 170}
            y2={195 - v * 170}
            stroke="#e3e7f3"
            strokeDasharray="4 5"
          />
        ))}

        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {[0, 64, 128, 192, 255].map((v) => (
          <text
            key={v}
            x={20 + v * (660 / 255)}
            y="214"
            textAnchor="middle"
            fill="#8290a9"
            fontSize="12"
          >
            {v}
          </text>
        ))}
      </svg>

      <p>{description}</p>
    </div>
  )
}

function Comparison({ before, after }) {
  const [position, setPosition] = useState(50)

  return (
    <div className="analysis-comparison">
      <div className="analysis-comparison-image">
        <img
          src={after}
          alt="Processed color image"
        />

        <img
          src={before}
          alt="Original color image"
          className="analysis-comparison-before"
          style={{
            clipPath: `inset(0 ${100 - position}% 0 0)`,
          }}
        />

        <div
          className="analysis-comparison-line"
          style={{ left: `${position}%` }}
        >
          <span>
            <MoveHorizontal size={20} />
          </span>
        </div>

        <span className="analysis-before-label">
          ORIGINAL
        </span>

        <span className="analysis-after-label">
          PROCESSED
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={position}
        aria-label="Compare original and processed images"
        onChange={(event) =>
          setPosition(Number(event.target.value))
        }
      />
    </div>
  )
}

function ImageCard({ title, image, description }) {
  return (
    <div
      className="analysis-card"
      style={{ flex: '1 1 260px', minWidth: 0 }}
    >
      <h3>{title}</h3>

      <div
        style={{
          marginTop: 14,
          minHeight: 220,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 14,
          background: '#f5f6fc',
          overflow: 'hidden',
        }}
      >
        <img
          src={image}
          alt={title}
          style={{
            maxWidth: '100%',
            maxHeight: 320,
            objectFit: 'contain',
          }}
        />
      </div>

      {description && (
        <p
          style={{
            marginTop: 12,
            color: '#8290a9',
            fontSize: 13,
          }}
        >
          {description}
        </p>
      )}
    </div>
  )
}

function downloadImage(dataUrl, filename) {
  const anchor = document.createElement('a')

  anchor.href = dataUrl
  anchor.download = filename

  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

async function preparePdfImage(dataUrl) {
  const image = await getImage(dataUrl)

  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  const context = canvas.getContext('2d')

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0)

  return {
    data: canvas.toDataURL('image/jpeg', 0.85),
    width: canvas.width,
    height: canvas.height,
  }
}

function addPdfImage(pdf, image, x, y, w, h) {
  const scale = Math.min(
    w / image.width,
    h / image.height
  )

  const actualWidth = image.width * scale
  const actualHeight = image.height * scale

  pdf.addImage(
    image.data,
    'JPEG',
    x + (w - actualWidth) / 2,
    y + (h - actualHeight) / 2,
    actualWidth,
    actualHeight
  )
}

function drawPdfHistogram(
  pdf,
  histogram,
  x,
  y,
  width,
  height,
  color
) {
  const max = Math.max(1, ...histogram)

  const plotX = x + 5
  const plotY = y + 4
  const plotW = width - 10
  const plotH = height - 12

  pdf.setDrawColor(230, 232, 244)
  pdf.setLineWidth(0.2)

  for (let i = 0; i <= 4; i++) {
    const gy = plotY + (i / 4) * plotH

    pdf.line(
      plotX,
      gy,
      plotX + plotW,
      gy
    )
  }

  pdf.setDrawColor(...color)
  pdf.setLineWidth(0.4)

  for (let i = 1; i < histogram.length; i++) {
    const x1 = plotX + ((i - 1) / 255) * plotW
    const x2 = plotX + (i / 255) * plotW

    const y1 =
      plotY + plotH -
      (histogram[i - 1] / max) * plotH

    const y2 =
      plotY + plotH -
      (histogram[i] / max) * plotH

    pdf.line(x1, y1, x2, y2)
  }

  pdf.setFontSize(8)
  pdf.setTextColor(110, 120, 145)

  ;[0, 64, 128, 192, 255].forEach((value) => {
    pdf.text(
      String(value),
      plotX + (value / 255) * plotW,
      y + height - 2,
      { align: 'center' }
    )
  })
}

async function createPdfReport(result, analysis) {
  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
  })

  const margin = 17
  const pageWidth = 210
  const contentWidth = pageWidth - margin * 2

  const operationName =
    OPERATIONS[result.operation] || result.operation

  let page = 1

  function header(subtitle) {
    pdf.setFillColor(244, 241, 255)
    pdf.rect(0, 0, pageWidth, 37, 'F')

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(17)
    pdf.setTextColor(75, 65, 150)
    pdf.text('ImageEnhancementProject', margin, 18)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text(subtitle, margin, 27)
  }

  function heading(text, y) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(48, 58, 95)
    pdf.text(text, margin, y)
  }

  function body(text, y, maxWidth = contentWidth) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(85, 95, 115)

    const lines = pdf.splitTextToSize(
      String(text),
      maxWidth
    )

    pdf.text(lines, margin, y)

    return y + lines.length * 5
  }

  function footer() {
    pdf.setFontSize(8)
    pdf.setTextColor(140, 145, 160)

    pdf.text(
      'ImageEnhancementProject | Color Image Processing',
      margin,
      286
    )

    pdf.text(
      `Page ${page}`,
      193,
      286,
      { align: 'right' }
    )
  }

  const originalImage = await preparePdfImage(
    result.original
  )

  const processedImage = await preparePdfImage(
    result.processed
  )

  // PAGE 1: Experiment overview

  header('Color Image Processing Analysis Report')

  body(
    `Generated: ${new Date().toLocaleString()}`,
    45
  )

  body(`Operation: ${operationName}`, 53)

  body(
    `Resolution: ${analysis.width} x ${analysis.height} pixels`,
    61
  )

  heading('1. Image Comparison', 76)

  pdf.setFontSize(10)
  pdf.setTextColor(60, 65, 100)

  pdf.text('Original Image', margin, 88)
  pdf.text('Processed Image', 111, 88)

  pdf.setFillColor(247, 248, 253)

  pdf.roundedRect(
    margin, 93, 82, 75, 3, 3, 'F'
  )

  pdf.roundedRect(
    111, 93, 82, 75, 3, 3, 'F'
  )

  addPdfImage(
    pdf,
    originalImage,
    margin + 3,
    96,
    76,
    69
  )

  addPdfImage(
    pdf,
    processedImage,
    114,
    96,
    76,
    69
  )

  heading('2. Experiment Description', 184)

  let y = body(
    result.explanation ||
      `The image was processed using ${operationName}.`,
    194
  )

  heading('3. Processing Parameters', y + 13)

  y += 23

  const settings = Object.entries(
    result.settings || {}
  ).filter(([key]) => {
    const relevant = {
      negative: [],
      slicing: ['selected_color', 'tolerance'],
      pseudocolor: ['colormap'],
      enhancement: [
        'brightness',
        'contrast',
        'saturation',
        'red_gain',
        'green_gain',
        'blue_gain',
      ],
      models: ['model'],
      segmentation: [
        'hue_center',
        'hue_range',
        'sat_min',
        'val_min',
      ],
    }

    return (relevant[result.operation] || [])
      .includes(key)
  })

  if (settings.length === 0) {
    y = body(
      'No additional parameters required.',
      y
    )
  } else {
    settings.forEach(([key, value]) => {
      y = body(
        `${key.replaceAll('_', ' ')}: ${value}`,
        y + 1
      )
    })
  }

  footer()

  // PAGE 2: Histograms and statistics

  pdf.addPage()
  page++

  header('Histograms and Image Statistics')

  heading('4. Grayscale Intensity Histograms', 49)

  pdf.setFontSize(10)
  pdf.text('Original Image', margin, 61)

  drawPdfHistogram(
    pdf,
    analysis.original.histogram,
    margin,
    65,
    contentWidth,
    66,
    [137, 121, 230]
  )

  pdf.text('Processed Image', margin, 145)

  drawPdfHistogram(
    pdf,
    analysis.processed.histogram,
    margin,
    149,
    contentWidth,
    66,
    [67, 169, 216]
  )

  heading('5. Image Statistics', 228)

  const rows = [
    [
      'Mean Brightness',
      number(analysis.original.mean),
      number(analysis.processed.mean),
    ],
    [
      'Contrast (Std. Dev.)',
      number(analysis.original.std_dev),
      number(analysis.processed.std_dev),
    ],
    [
      'Minimum Intensity',
      String(analysis.original.min),
      String(analysis.processed.min),
    ],
    [
      'Maximum Intensity',
      String(analysis.original.max),
      String(analysis.processed.max),
    ],
  ]

  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')

  pdf.text('Measurement', margin, 239)
  pdf.text('Original', 112, 239)
  pdf.text('Processed', 153, 239)

  pdf.setFont('helvetica', 'normal')

  rows.forEach((row, index) => {
    const rowY = 247 + index * 8

    pdf.text(row[0], margin, rowY)
    pdf.text(row[1], 112, rowY)
    pdf.text(row[2], 153, rowY)
  })

  footer()

  // PAGE 3: Quantitative comparison

  pdf.addPage()
  page++

  header('Quantitative Evaluation')

  heading('6. Image Comparison Metrics', 50)

  if (result.operation === 'models') {
    body(
      'Color model exploration decomposes an image into color-space components. The processed RGB preview may be unchanged, so image-difference metrics are not meaningful for this experiment.',
      63
    )
  } else {
    const metrics = [
      ['MSE', number(analysis.quality?.mse, 4)],
      [
        'PSNR',
        analysis.quality?.psnr === Infinity
          ? 'Infinity dB'
          : `${number(analysis.quality?.psnr)} dB`,
      ],
      ['MAE', number(analysis.quality?.mae, 4)],
      [
        'Changed Pixels',
        `${number(analysis.quality?.changedPercent)}%`,
      ],
    ]

    metrics.forEach(([label, value], index) => {
      const yy = 65 + index * 15

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.setTextColor(60, 65, 100)
      pdf.text(label, margin, yy)

      pdf.setFont('helvetica', 'normal')
      pdf.text(value, 87, yy)
    })
  }

  heading('7. Interpretation', 136)

  let textY = body(
    `Brightness difference: ${number(analysis.brightnessChange)} intensity units. Contrast difference: ${number(analysis.contrastChange)} intensity units.`,
    146
  )

  textY = body(
    'MSE, MAE and PSNR describe numerical differences between the original and processed images. They do not directly measure perceptual quality or the success of a color transformation.',
    textY + 9
  )

  if (result.selected_pixels_percent != null) {
    textY = body(
      `Selected pixels: ${number(result.selected_pixels_percent)}%.`,
      textY + 9
    )
  }

  heading('8. Conclusion', textY + 17)

  body(
    `The ${operationName} experiment demonstrates color image processing using image transformations, pixel statistics, intensity distributions and visual comparison.`,
    textY + 27
  )

  footer()

  // Additional pages for color model components

  if (
    result.operation === 'models' &&
    result.channels &&
    Object.keys(result.channels).length > 0
  ) {
    const entries = Object.entries(result.channels)

    for (let index = 0; index < entries.length; index += 2) {
      pdf.addPage()
      page++

      header(
        `${result.settings?.model || 'Color'} Model Components`
      )

      heading(
        '9. Color Space Component Visualization',
        49
      )

      const pair = entries.slice(index, index + 2)

      for (let i = 0; i < pair.length; i++) {
        const [name, dataUrl] = pair[i]
        const component = await preparePdfImage(dataUrl)

        const top = 64 + i * 103

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(11)
        pdf.setTextColor(60, 65, 100)

        pdf.text(name, margin, top)

        pdf.setFillColor(247, 248, 253)
        pdf.roundedRect(
          margin,
          top + 5,
          contentWidth,
          85,
          3,
          3,
          'F'
        )

        addPdfImage(
          pdf,
          component,
          margin + 4,
          top + 9,
          contentWidth - 8,
          77
        )
      }

      footer()
    }
  }

  // Additional page for segmentation or slicing mask

  if (result.mask) {
    pdf.addPage()
    page++

    header('Color Selection Mask')

    heading('Binary Mask Visualization', 49)

    const maskImage = await preparePdfImage(
      result.mask
    )

    pdf.setFillColor(247, 248, 253)

    pdf.roundedRect(
      margin,
      60,
      contentWidth,
      145,
      3,
      3,
      'F'
    )

    addPdfImage(
      pdf,
      maskImage,
      margin + 5,
      65,
      contentWidth - 10,
      135
    )

    body(
      `Selected pixels: ${number(result.selected_pixels_percent)}%`,
      219
    )

    footer()
  }

  pdf.save(
    `ImageEnhancementProject_Color_${result.operation}_Analysis.pdf`
  )
}

export default function ColorAnalysis() {
  const { colorResult } = useProcessing()

  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pdfError, setPdfError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [histogramMode, setHistogramMode] = useState('both')

  const isModelMode =
    colorResult?.operation === 'models'

  const operationName = colorResult
    ? OPERATIONS[colorResult.operation] ||
      colorResult.operationName ||
      colorResult.operation
    : ''

  useEffect(() => {
    if (
      !colorResult?.original ||
      !colorResult?.processed
    ) {
      setAnalysis(null)
      setLoading(false)
      return
    }

    let cancelled = false

    async function calculate() {
      setLoading(true)
      setError('')
      setAnalysis(null)

      try {
        const [originalImage, processedImage] =
          await Promise.all([
            readImage(colorResult.original),
            readImage(colorResult.processed),
          ])

        const original = calculateStatistics(
          originalImage
        )

        const processed = calculateStatistics(
          processedImage
        )

        const quality = calculateQuality(
          originalImage,
          processedImage
        )

        if (!cancelled) {
          setAnalysis({
            width: originalImage.width,
            height: originalImage.height,
            original,
            processed,
            quality,
            brightnessChange:
              processed.mean - original.mean,
            contrastChange:
              processed.std_dev - original.std_dev,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    calculate()

    return () => {
      cancelled = true
    }
  }, [colorResult])

  const statisticsRows = useMemo(() => {
    if (!analysis) return []

    return [
      [
        'Mean Brightness',
        number(analysis.original.mean),
        number(analysis.processed.mean),
      ],
      [
        'Contrast (Std. Deviation)',
        number(analysis.original.std_dev),
        number(analysis.processed.std_dev),
      ],
      [
        'Minimum Intensity',
        analysis.original.min,
        analysis.processed.min,
      ],
      [
        'Maximum Intensity',
        analysis.original.max,
        analysis.processed.max,
      ],
      [
        'Mean Red',
        number(analysis.original.channelMeans.red),
        number(analysis.processed.channelMeans.red),
      ],
      [
        'Mean Green',
        number(analysis.original.channelMeans.green),
        number(analysis.processed.channelMeans.green),
      ],
      [
        'Mean Blue',
        number(analysis.original.channelMeans.blue),
        number(analysis.processed.channelMeans.blue),
      ],
      [
        'Resolution',
        `${analysis.width} × ${analysis.height}`,
        `${analysis.width} × ${analysis.height}`,
      ],
    ]
  }, [analysis])

  async function downloadReport() {
    if (!colorResult || !analysis) return

    try {
      setPdfError('')
      setExporting(true)

      await createPdfReport(
        colorResult,
        analysis
      )
    } catch (err) {
      console.error(err)

      setPdfError(
        'Unable to generate the PDF report. Please try again.'
      )
    } finally {
      setExporting(false)
    }
  }

  if (!colorResult) {
    return (
      <main className="main-content analysis-page">
        <div className="analysis-heading">
          <div>
            <div className="section-kicker">
              <Palette size={15} />
              COLOR IMAGE ANALYSIS
            </div>

            <h1>Color Analysis</h1>

            <p>
              Analyze color transformations and
              processing results.
            </p>
          </div>
        </div>

        <div className="analysis-empty">
          <div className="analysis-empty-icon">
            <BarChart3 size={38} />
          </div>

          <h2>No Color Studio results yet</h2>

          <p>
            Open Color Studio, upload an image,
            choose an experiment and click Apply Effect.
          </p>

          <Link
            to="/color-studio"
            className="analysis-primary-btn"
          >
            Open Color Studio
            <ArrowRight size={17} />
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="main-content analysis-page">

      {/* HEADER */}

      <div className="analysis-heading">
        <div>
          <div className="section-kicker">
            <Palette size={15} />
            IMAGEENHANCEMENTPROJECT / COLOR ANALYSIS
          </div>

          <h1>Color Image Analysis</h1>

          <p>
            Quantitative evaluation, RGB histograms,
            color-space components, and PDF reporting.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/color-studio"
            className="analysis-outline-btn"
          >
            Back to Color Studio
            <ArrowRight size={16} />
          </Link>

          <button
            type="button"
            className="analysis-primary-btn"
            disabled={!analysis || exporting}
            onClick={downloadReport}
            style={{
              border: 0,
              cursor: exporting ? 'wait' : 'pointer',
            }}
          >
            <Download size={17} />

            {exporting
              ? 'Generating PDF...'
              : 'Download PDF Report'}
          </button>
        </div>
      </div>

      {pdfError && (
        <p role="alert" style={{ color: '#bd4059' }}>
          {pdfError}
        </p>
      )}

      {/* PROCESSING SUMMARY */}

      <section className="analysis-summary">
        <div>
          <span className="analysis-eyebrow">
            COLOR PROCESSING SUMMARY
          </span>

          <h2>{operationName}</h2>

          <p>
            {colorResult.explanation ||
              'Color image processing experiment completed.'}
          </p>
        </div>

        <div className="analysis-resolution">
          <ImageIcon size={18} />

          {analysis
            ? `${analysis.width} × ${analysis.height} px`
            : 'Analyzing...'}
        </div>
      </section>

      {loading && (
        <section className="analysis-card">
          <p>Calculating image statistics and histograms...</p>
        </section>
      )}

      {error && (
        <section className="analysis-card">
          <p role="alert" style={{ color: '#bd4059' }}>
            {error}
          </p>
        </section>
      )}

      {analysis && (
        <>
          {/* MAIN METRICS */}

          <div className="analysis-metric-grid">
            <Metric
              icon={Sun}
              label="Original Brightness"
              value={number(analysis.original.mean)}
              description="Mean grayscale intensity / 255"
            />

            <Metric
              icon={Sun}
              label="Processed Brightness"
              value={number(analysis.processed.mean)}
              description="Mean grayscale intensity / 255"
            />

            <Metric
              icon={Activity}
              label="Original Contrast"
              value={number(analysis.original.std_dev)}
              description="Grayscale standard deviation"
            />

            <Metric
              icon={Activity}
              label="Processed Contrast"
              value={number(analysis.processed.std_dev)}
              description="Grayscale standard deviation"
            />
          </div>

          {/* QUALITY METRICS */}

          {!isModelMode && analysis.quality && (
            <section className="analysis-card">
              <div className="analysis-card-heading">
                <div>
                  <span className="analysis-eyebrow">
                    QUANTITATIVE EVALUATION
                  </span>

                  <h2>Image Comparison Metrics</h2>

                  <p>
                    Pixel-level differences between
                    the original and processed images.
                  </p>
                </div>
              </div>

              <div
                className="analysis-metric-grid"
                style={{ marginBottom: 0 }}
              >
                <Metric
                  icon={Activity}
                  label="Mean Squared Error"
                  value={number(
                    analysis.quality.mse,
                    4
                  )}
                  description="Average squared RGB difference"
                />

                <Metric
                  icon={BarChart3}
                  label="PSNR"
                  value={
                    analysis.quality.psnr === Infinity
                      ? '∞'
                      : `${number(analysis.quality.psnr)} dB`
                  }
                  description="Pixel similarity to the original"
                />

                <Metric
                  icon={ScanLine}
                  label="Mean Absolute Error"
                  value={number(
                    analysis.quality.mae,
                    4
                  )}
                  description="Average absolute RGB difference"
                />

                <Metric
                  icon={Sparkles}
                  label="Changed Pixels"
                  value={`${number(
                    analysis.quality.changedPercent
                  )}%`}
                  description="Pixels with at least one changed channel"
                />
              </div>

              <p className="analysis-method-note">
                MSE, MAE and PSNR measure differences,
                not whether a color transformation is
                visually better. SSIM is not calculated
                in this color-analysis module.
              </p>
            </section>
          )}

          {/* COLOR MODEL INFORMATION */}

          {isModelMode && (
            <section className="analysis-card">
              <div className="analysis-card-heading">
                <div>
                  <span className="analysis-eyebrow">
                    COLOR SPACE DECOMPOSITION
                  </span>

                  <h2>
                    {colorResult.settings?.model} Components
                  </h2>

                  <p>
                    A color model represents an image
                    through separate component channels.
                    Its RGB preview may remain unchanged,
                    so image-difference metrics are not
                    meaningful here.
                  </p>
                </div>

                <Layers3 size={22} />
              </div>
            </section>
          )}

          {/* GRAYSCALE HISTOGRAMS */}

          <section className="analysis-card">
            <div className="analysis-card-heading">
              <div>
                <span className="analysis-eyebrow">
                  INTENSITY DISTRIBUTION
                </span>

                <h2>Grayscale Histograms</h2>

                <p>
                  Pixel intensity distribution from
                  0 to 255.
                </p>
              </div>

              <div className="analysis-segments">
                {['both', 'original', 'processed'].map(
                  (item) => (
                    <button
                      type="button"
                      key={item}
                      className={
                        histogramMode === item
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        setHistogramMode(item)
                      }
                    >
                      {item[0].toUpperCase() +
                        item.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="analysis-histogram-grid">
              {(histogramMode === 'both' ||
                histogramMode === 'original') && (
                <Histogram
                  values={
                    analysis.original.histogram
                  }
                  title="Original Image"
                  color={COLORS.original}
                />
              )}

              {(histogramMode === 'both' ||
                histogramMode === 'processed') && (
                <Histogram
                  values={
                    analysis.processed.histogram
                  }
                  title="Processed Image"
                  color={COLORS.processed}
                />
              )}
            </div>
          </section>

          {/* RGB HISTOGRAMS */}

          <section className="analysis-card">
            <div className="analysis-card-heading">
              <div>
                <span className="analysis-eyebrow">
                  CHANNEL DISTRIBUTION
                </span>

                <h2>RGB Channel Histograms</h2>

                <p>
                  Red, green and blue intensity
                  distributions for the processed image.
                </p>
              </div>
            </div>

            <div className="analysis-histogram-grid">
              <Histogram
                values={
                  analysis.processed.rgbHistograms.red
                }
                title="Red Channel"
                color={COLORS.red}
              />

              <Histogram
                values={
                  analysis.processed.rgbHistograms.green
                }
                title="Green Channel"
                color={COLORS.green}
              />

              <Histogram
                values={
                  analysis.processed.rgbHistograms.blue
                }
                title="Blue Channel"
                color={COLORS.blue}
              />
            </div>
          </section>

          {/* VISUAL COMPARISON */}

          {!isModelMode && (
            <section className="analysis-card">
              <div className="analysis-card-heading">
                <div>
                  <span className="analysis-eyebrow">
                    VISUAL COMPARISON
                  </span>

                  <h2>Before & After</h2>

                  <p>
                    Move the slider to compare
                    the original and processed images.
                  </p>
                </div>
              </div>

              <Comparison
                before={colorResult.original}
                after={colorResult.processed}
              />
            </section>
          )}

          {/* COLOR COMPONENTS */}

          {colorResult.channels &&
            Object.keys(colorResult.channels).length > 0 && (
              <section className="analysis-card">
                <div className="analysis-card-heading">
                  <div>
                    <span className="analysis-eyebrow">
                      COLOR SPACE VISUALIZATION
                    </span>

                    <h2>
                      {colorResult.settings?.model} Color Components
                    </h2>

                    <p>
                      Individual components of the
                      selected color model.
                    </p>
                  </div>

                  <Layers3 size={22} />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: 16,
                  }}
                >
                  {Object.entries(
                    colorResult.channels
                  ).map(([name, imageUrl]) => (
                    <div
                      key={name}
                      style={{
                        padding: 15,
                        borderRadius: 16,
                        border: '1px solid #e3e5f4',
                        background: '#ffffff',
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={`${name} component`}
                        style={{
                          width: '100%',
                          height: 190,
                          objectFit: 'contain',
                          borderRadius: 10,
                          background: '#f5f6fc',
                        }}
                      />

                      <div
                        style={{
                          display: 'flex',
                          justifyContent:
                            'space-between',
                          alignItems: 'center',
                          marginTop: 12,
                        }}
                      >
                        <strong>{name}</strong>

                        <button
                          type="button"
                          title={`Download ${name}`}
                          onClick={() =>
                            downloadImage(
                              imageUrl,
                              `ImageEnhancementProject_${name}.png`
                            )
                          }
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* MASK */}

          {colorResult.mask && (
            <section className="analysis-card">
              <div className="analysis-card-heading">
                <div>
                  <span className="analysis-eyebrow">
                    COLOR SELECTION ANALYSIS
                  </span>

                  <h2>Segmentation / Selection Mask</h2>

                  <p>
                    The binary mask indicates which
                    pixels satisfy the selection criteria.
                  </p>
                </div>
              </div>

              <div className="analysis-metric-grid">
                <Metric
                  icon={ScanLine}
                  label="Selected Pixels"
                  value={`${number(
                    colorResult.selected_pixels_percent
                  )}%`}
                  description="Percentage of pixels in the selected region"
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 18,
                  flexWrap: 'wrap',
                }}
              >
                <ImageCard
                  title="Original Image"
                  image={colorResult.original}
                />

                <ImageCard
                  title="Binary Selection Mask"
                  image={colorResult.mask}
                />

                <ImageCard
                  title="Processed Output"
                  image={colorResult.processed}
                />
              </div>
            </section>
          )}

          {/* DETAILED STATISTICS */}

          <section className="analysis-card">
            <div className="analysis-card-heading">
              <div>
                <span className="analysis-eyebrow">
                  QUANTITATIVE STATISTICS
                </span>

                <h2>Detailed Image Statistics</h2>
              </div>
            </div>

            <div className="analysis-table-wrap">
              <table className="analysis-table">
                <thead>
                  <tr>
                    <th>Measurement</th>
                    <th>Original</th>
                    <th>Processed</th>
                  </tr>
                </thead>

                <tbody>
                  {statisticsRows.map(
                    ([label, before, after]) => (
                      <tr key={label}>
                        <td>{label}</td>
                        <td>{before}</td>
                        <td>{after}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* INTERPRETATION */}

          <section className="analysis-card analysis-insights">
            <div className="analysis-card-heading">
              <div>
                <span className="analysis-eyebrow">
                  RESULT INTERPRETATION
                </span>

                <h2>What Changed?</h2>
              </div>

              <Sparkles size={22} />
            </div>

            <div className="analysis-insight-grid">
              <div className="analysis-insight">
                <Sun size={22} />

                <span>Brightness Difference</span>

                <strong>
                  {analysis.brightnessChange > 0
                    ? '+'
                    : ''}
                  {number(
                    analysis.brightnessChange
                  )}
                </strong>

                <p>
                  {Math.abs(
                    analysis.brightnessChange
                  ) < 0.5
                    ? 'Mean brightness is nearly unchanged.'
                    : analysis.brightnessChange > 0
                      ? 'The processed image is brighter on average.'
                      : 'The processed image is darker on average.'}
                </p>
              </div>

              <div className="analysis-insight">
                <ScanLine size={22} />

                <span>Contrast Difference</span>

                <strong>
                  {analysis.contrastChange > 0
                    ? '+'
                    : ''}
                  {number(
                    analysis.contrastChange
                  )}
                </strong>

                <p>
                  {Math.abs(
                    analysis.contrastChange
                  ) < 0.5
                    ? 'Grayscale intensity variation is nearly unchanged.'
                    : analysis.contrastChange > 0
                      ? 'The processed image has greater intensity variation.'
                      : 'The processed image has less intensity variation.'}
                </p>
              </div>
            </div>

            <p className="analysis-method-note">
              Numerical similarity does not necessarily
              indicate better perceptual quality.
              Interpretation depends on the selected
              color-processing operation.
            </p>
          </section>

          {/* EXPORT */}

          <section className="analysis-card">
            <div className="analysis-card-heading">
              <div>
                <span className="analysis-eyebrow">
                  EXPORT EXPERIMENT
                </span>

                <h2>Download Your Analysis</h2>

                <p>
                  Generate a PDF containing image
                  comparisons, statistics, histograms,
                  processing parameters, and relevant
                  color components or masks.
                </p>
              </div>

              <CheckCircle2 size={22} />
            </div>

            <button
              type="button"
              className="analysis-primary-btn"
              disabled={exporting}
              onClick={downloadReport}
              style={{
                border: 0,
                cursor: exporting ? 'wait' : 'pointer',
              }}
            >
              <Download size={17} />

              {exporting
                ? 'Generating PDF...'
                : 'Download Color Analysis PDF'}
            </button>
          </section>
        </>
      )}
    </main>
  )
}
