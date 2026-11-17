
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import {
  Activity,
  ArrowRight,
  BarChart3,
  ChartNoAxesCombined,
  Download,
  Image as ImageIcon,
  MoveHorizontal,
  ScanLine,
  Sparkles,
  Sun,
} from 'lucide-react'
import { useProcessing } from '../ProcessingContext'
import './Analysis.css'

const number = (value, decimals = 2) =>
  value == null ? 'N/A' : Number(value).toFixed(decimals)

function Histogram({ values, title, color }) {
  const max = Math.max(1, ...values)
  const points = values.map((value, index) => {
    const x = 20 + index * (660 / 255)
    const y = 195 - (value / max) * 170
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="analysis-histogram">
      <h3 style={{ color }}>{title}</h3>
      <svg
        viewBox="0 0 700 220"
        role="img"
        aria-label={`${title} grayscale histogram`}
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
      <p>Grayscale intensity distribution · 256 bins</p>
    </div>
  )
}

function Metric({ icon: Icon, label, value, description }) {
  return (
    <div className="analysis-metric">
      <div className="analysis-metric-icon">
        <Icon size={20} />
      </div>
      <span>{label}</span>
      <div className="analysis-metric-value">{value}</div>
      <p>{description}</p>
    </div>
  )
}

function Comparison({ before, after }) {
  const [position, setPosition] = useState(50)

  return (
    <div className="analysis-comparison">
      <div className="analysis-comparison-image">
        <img src={after} alt="Enhanced image" />
        <img
          src={before}
          alt="Original image"
          className="analysis-comparison-before"
          style={{
            clipPath: `inset(0 ${100 - position}% 0 0)`,
          }}
        />
        <div
          className="analysis-comparison-line"
          style={{ left: `${position}%` }}
        >
          <span><MoveHorizontal size={20} /></span>
        </div>
        <span className="analysis-before-label">ORIGINAL</span>
        <span className="analysis-after-label">ENHANCED</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={position}
        aria-label="Before and after comparison"
        onChange={(event) =>
          setPosition(Number(event.target.value))
        }
      />
    </div>
  )
}

function drawPdfHistogram(pdf, histogram, x, y, w, h, rgb) {
  const max = Math.max(1, ...histogram)
  const plotX = x + 7
  const plotY = y + 5
  const plotW = w - 14
  const plotH = h - 15

  pdf.setDrawColor(225, 230, 240)
  pdf.setLineWidth(0.2)

  for (let i = 0; i <= 4; i++) {
    const gy = plotY + (i / 4) * plotH
    pdf.line(plotX, gy, plotX + plotW, gy)
  }

  pdf.setDrawColor(...rgb)
  pdf.setLineWidth(0.45)

  for (let i = 1; i < 256; i++) {
    const x1 = plotX + ((i - 1) / 255) * plotW
    const x2 = plotX + (i / 255) * plotW
    const y1 = plotY + plotH -
      (histogram[i - 1] / max) * plotH
    const y2 = plotY + plotH -
      (histogram[i] / max) * plotH

    pdf.line(x1, y1, x2, y2)
  }

  pdf.setFontSize(8)
  pdf.setTextColor(110, 120, 145)
  ;[0, 64, 128, 192, 255].forEach((v) => {
    pdf.text(
      String(v),
      plotX + (v / 255) * plotW,
      y + h - 2,
      { align: 'center' }
    )
  })
}

function addImageContained(pdf, dataUrl, x, y, w, h, width, height) {
  const scale = Math.min(w / width, h / height)
  const imageW = width * scale
  const imageH = height * scale

  pdf.addImage(
    dataUrl,
    'PNG',
    x + (w - imageW) / 2,
    y + (h - imageH) / 2,
    imageW,
    imageH
  )
}

function createPdfReport(result) {
  const { width, height, stages, analysis } = result
  const { original, enhanced, quality } = analysis
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })

  const pageWidth = 210
  const margin = 17
  const contentWidth = pageWidth - margin * 2
  const date = new Date().toLocaleString()

  function header(subtitle) {
    pdf.setFillColor(244, 241, 255)
    pdf.rect(0, 0, pageWidth, 37, 'F')
    pdf.setTextColor(75, 65, 150)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(20)
    pdf.text('PixelLab', margin, 19)
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
    const lines = pdf.splitTextToSize(text, maxWidth)
    pdf.text(lines, margin, y)
    return y + lines.length * 5
  }

  function footer(page) {
    pdf.setFontSize(8)
    pdf.setTextColor(140, 145, 160)
    pdf.text('PixelLab | Digital Image Processing', margin, 286)
    pdf.text(`Page ${page}`, 193, 286, { align: 'right' })
  }

  // PAGE 1 — Original and enhanced images
  header('Image Enhancement Analysis Report')
  body(`Generated: ${date}`, 46)
  body(`Resolution: ${width} x ${height} pixels`, 53)

  heading('1. Image Comparison', 66)

  pdf.setFontSize(10)
  pdf.setTextColor(60, 65, 100)
  pdf.text('Original Image', margin, 77)
  pdf.text('Enhanced Image', 111, 77)

  pdf.setFillColor(247, 248, 253)
  pdf.roundedRect(margin, 82, 82, 80, 3, 3, 'F')
  pdf.roundedRect(111, 82, 82, 80, 3, 3, 'F')

  addImageContained(
    pdf, stages.Original, margin + 3, 85,
    76, 74, width, height
  )
  addImageContained(
    pdf, stages.Final, 114, 85,
    76, 74, width, height
  )

  heading('2. Enhancement Pipeline', 180)
  let y = body(
    'Original Image -> Noise Reduction -> Laplacian Edge Extraction -> Image Sharpening -> Gamma Correction -> Final Enhanced Image',
    189
  )

  heading('3. Overview', y + 12)
  body(
    'The image was processed using spatial smoothing, Laplacian-based sharpening and gamma correction. The analysis compares the original RGB image with the final enhanced RGB image.',
    y + 21
  )
  footer(1)

  // PAGE 2 — Histograms and statistics
  pdf.addPage()
  header('Histograms and Image Statistics')
  heading('4. Grayscale Intensity Histograms', 49)

  pdf.setFontSize(10)
  pdf.text('Original Image', margin, 61)
  drawPdfHistogram(
    pdf, original.histogram, margin, 65,
    contentWidth, 67, [137, 121, 230]
  )

  pdf.text('Enhanced Image', margin, 146)
  drawPdfHistogram(
    pdf, enhanced.histogram, margin, 150,
    contentWidth, 67, [67, 169, 216]
  )

  heading('5. Image Statistics', 231)

  const statistics = [
    ['Mean Brightness', number(original.mean), number(enhanced.mean)],
    ['Contrast (Std. Dev.)', number(original.std_dev), number(enhanced.std_dev)],
    ['Minimum Intensity', String(original.min), String(enhanced.min)],
    ['Maximum Intensity', String(original.max), String(enhanced.max)],
  ]

  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Measurement', margin, 241)
  pdf.text('Original', 112, 241)
  pdf.text('Enhanced', 153, 241)

  pdf.setFont('helvetica', 'normal')
  statistics.forEach((row, i) => {
    const ry = 249 + i * 8
    pdf.text(row[0], margin, ry)
    pdf.text(row[1], 112, ry)
    pdf.text(row[2], 153, ry)
  })
  footer(2)

  // PAGE 3 — Quality metrics and interpretation
  pdf.addPage()
  header('Quantitative Quality Evaluation')
  heading('6. Image Comparison Metrics', 50)

  const metrics = [
    ['MSE', number(quality.mse, 4)],
    ['PSNR', quality.psnr == null ? 'Infinity dB' : `${number(quality.psnr)} dB`],
    ['SSIM', number(quality.ssim, 4)],
  ]

  metrics.forEach(([label, value], index) => {
    const yy = 65 + index * 16
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(60, 65, 100)
    pdf.text(label, margin, yy)
    pdf.setFont('helvetica', 'normal')
    pdf.text(value, 78, yy)
  })

  heading('7. Interpretation', 126)
  let textY = body(
    `Brightness difference: ${number(analysis.brightness_change)} intensity units. Contrast difference: ${number(analysis.contrast_change)} intensity units.`,
    136
  )

  textY = body(
    'MSE measures average squared RGB pixel differences. PSNR expresses pixel-level similarity in decibels. SSIM evaluates structural similarity between the original and enhanced images.',
    textY + 9
  )

  heading('8. Important Evaluation Note', textY + 15)
  body(
    'The original image is used as a comparison reference, not as verified ground truth. Lower MSE and higher PSNR or SSIM indicate greater similarity to the original image, but do not necessarily indicate superior enhancement quality. Visual assessment and task-specific evaluation are also important.',
    textY + 24
  )

  heading('9. Conclusion', textY + 69)
  body(
    'PixelLab provides a reproducible workflow for image enhancement and quantitative comparison using OpenCV, NumPy and structural similarity analysis.',
    textY + 78
  )

  footer(3)
  pdf.save('PixelLab_Image_Analysis_Report.pdf')
}

export default function Analysis() {
  const { processingResult } = useProcessing()
  const [mode, setMode] = useState('both')
  const [pdfError, setPdfError] = useState('')

  if (!processingResult?.analysis) {
    return (
      <main className="main-content analysis-page">
        <div className="analysis-heading">
          <div>
            <div className="section-kicker">
              <ChartNoAxesCombined size={15} />
              PIXELLAB / IMAGE ANALYSIS
            </div>
            <h1>Image Analysis</h1>
            <p>Explore the numerical effects of image enhancement.</p>
          </div>
        </div>

        <div className="analysis-empty">
          <div className="analysis-empty-icon">
            <BarChart3 size={38} />
          </div>
          <h2>No analysis available yet</h2>
          <p>
            Enhance an image in Studio to view its histograms,
            statistics, quality metrics and PDF report.
          </p>
          <Link to="/studio" className="analysis-primary-btn">
            Open Enhancement Studio <ArrowRight size={17} />
          </Link>
        </div>
      </main>
    )
  }

  const { width, height, stages, analysis } = processingResult
  const { original, enhanced, quality } = analysis
  const brightness = analysis.brightness_change
  const contrast = analysis.contrast_change

  const rows = [
    ['Mean Brightness', number(original.mean), number(enhanced.mean)],
    ['Contrast (Std. Deviation)', number(original.std_dev), number(enhanced.std_dev)],
    ['Minimum Intensity', original.min, enhanced.min],
    ['Maximum Intensity', original.max, enhanced.max],
    ['Resolution', `${width} × ${height}`, `${width} × ${height}`],
  ]

  function downloadReport() {
    try {
      setPdfError('')
      createPdfReport(processingResult)
    } catch (error) {
      console.error(error)
      setPdfError('Unable to generate the PDF. Please try again.')
    }
  }

  return (
    <main className="main-content analysis-page">
      <div className="analysis-heading">
        <div>
          <div className="section-kicker">
            <ChartNoAxesCombined size={15} />
            PIXELLAB / IMAGE ANALYSIS
          </div>
          <h1>Image Analysis</h1>
          <p>
            Pixel statistics, image quality metrics,
            histograms and downloadable reports.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/studio" className="analysis-outline-btn">
            Back to Studio <ArrowRight size={16} />
          </Link>
          <button
            type="button"
            className="analysis-primary-btn"
            onClick={downloadReport}
            style={{ border: 0, cursor: 'pointer' }}
          >
            <Download size={17} />
            Download PDF Report
          </button>
        </div>
      </div>

      {pdfError && (
        <p role="alert" style={{ color: '#bd4059' }}>
          {pdfError}
        </p>
      )}

      <section className="analysis-summary">
        <div>
          <span className="analysis-eyebrow">PROCESSING SUMMARY</span>
          <h2>Enhancement Overview</h2>
          <p>Measurements calculated using OpenCV and NumPy.</p>
        </div>
        <div className="analysis-resolution">
          <ImageIcon size={18} />
          {width} × {height} px
        </div>
      </section>

      <div className="analysis-metric-grid">
        <Metric
          icon={Sun}
          label="Original Brightness"
          value={number(original.mean)}
          description="Mean grayscale intensity / 255"
        />
        <Metric
          icon={Sun}
          label="Enhanced Brightness"
          value={number(enhanced.mean)}
          description="Mean grayscale intensity / 255"
        />
        <Metric
          icon={Activity}
          label="Original Contrast"
          value={number(original.std_dev)}
          description="Grayscale standard deviation"
        />
        <Metric
          icon={Activity}
          label="Enhanced Contrast"
          value={number(enhanced.std_dev)}
          description="Grayscale standard deviation"
        />
      </div>

      <section className="analysis-card">
        <div className="analysis-card-heading">
          <div>
            <span className="analysis-eyebrow">
              IMAGE QUALITY EVALUATION
            </span>
            <h2>MSE, PSNR & SSIM</h2>
            <p>
              Pixel-level and structural similarity
              between original and enhanced images.
            </p>
          </div>
        </div>

        <div className="analysis-metric-grid" style={{ marginBottom: 0 }}>
          <Metric
            icon={Activity}
            label="Mean Squared Error"
            value={number(quality.mse, 4)}
            description="Average squared RGB pixel difference"
          />
          <Metric
            icon={BarChart3}
            label="Peak Signal-to-Noise Ratio"
            value={quality.psnr == null ? '∞' : `${number(quality.psnr)} dB`}
            description="Similarity to the original image"
          />
          <Metric
            icon={ScanLine}
            label="Structural Similarity Index"
            value={number(quality.ssim, 4)}
            description="Structural similarity; 1 means identical"
          />
        </div>

        <p className="analysis-method-note">
          These are reference-based similarity metrics.
          Greater similarity does not necessarily mean
          better enhancement.
        </p>
      </section>

      <section className="analysis-card">
        <div className="analysis-card-heading">
          <div>
            <span className="analysis-eyebrow">INTENSITY DISTRIBUTION</span>
            <h2>Image Histograms</h2>
            <p>Grayscale intensity frequencies from 0 to 255.</p>
          </div>

          <div className="analysis-segments">
            {['both', 'original', 'enhanced'].map((item) => (
              <button
                type="button"
                key={item}
                className={mode === item ? 'active' : ''}
                onClick={() => setMode(item)}
              >
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="analysis-histogram-grid">
          {(mode === 'both' || mode === 'original') && (
            <Histogram
              values={original.histogram}
              title="Original Image"
              color="#8979e6"
            />
          )}
          {(mode === 'both' || mode === 'enhanced') && (
            <Histogram
              values={enhanced.histogram}
              title="Enhanced Image"
              color="#43a9d8"
            />
          )}
        </div>
      </section>

      <section className="analysis-card">
        <div className="analysis-card-heading">
          <div>
            <span className="analysis-eyebrow">VISUAL COMPARISON</span>
            <h2>Before & After</h2>
            <p>Move the slider to compare both images.</p>
          </div>
        </div>
        <Comparison
          before={stages.Original}
          after={stages.Final}
        />
      </section>

      <section className="analysis-card">
        <div className="analysis-card-heading">
          <div>
            <span className="analysis-eyebrow">
              QUANTITATIVE EVALUATION
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
                <th>Enhanced</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, before, after]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{before}</td>
                  <td>{after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
              {brightness > 0 ? '+' : ''}
              {number(brightness)}
            </strong>
            <p>
              {Math.abs(brightness) < 0.5
                ? 'Mean brightness is nearly unchanged.'
                : brightness > 0
                  ? 'The enhanced image is brighter on average.'
                  : 'The enhanced image is darker on average.'}
            </p>
          </div>

          <div className="analysis-insight">
            <ScanLine size={22} />
            <span>Contrast Difference</span>
            <strong>
              {contrast > 0 ? '+' : ''}
              {number(contrast)}
            </strong>
            <p>
              {Math.abs(contrast) < 0.5
                ? 'Grayscale intensity variation is nearly unchanged.'
                : contrast > 0
                  ? 'The enhanced image has greater intensity variation.'
                  : 'The enhanced image has less intensity variation.'}
            </p>
          </div>
        </div>

        <p className="analysis-method-note">
          Higher brightness, contrast or similarity scores
          do not necessarily indicate better perceptual quality.
        </p>
      </section>
    </main>
  )
}
