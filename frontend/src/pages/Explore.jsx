
import { Link } from 'react-router-dom'
import {
  ArrowRight, Waves, ScanLine, Focus, Sun,
  Sparkles, ArrowDown, BookOpen
} from 'lucide-react'

const features = [
  {
    number: '01',
    title: 'Noise Reduction',
    subtitle: 'Spatial Smoothing',
    icon: Waves,
    description:
      'Reduce unwanted variations in image intensity using neighborhood-based spatial filters.',
    details:
      'Median filtering replaces a pixel with the median of its neighborhood, making it effective for salt-and-pepper noise. Box filtering uses the neighborhood average.',
    formula: 'Median / Averaging Filter',
    accent: 'lavender',
  },
  {
    number: '02',
    title: 'Edge Extraction',
    subtitle: 'Laplacian Operator',
    icon: ScanLine,
    description:
      'Identify rapid intensity changes and highlight important boundaries within an image.',
    details:
      'The Laplacian uses second-order spatial derivatives. PixelLab applies a four-neighbor Laplacian kernel to the smoothed grayscale image.',
    formula: '∇²f = ∂²f/∂x² + ∂²f/∂y²',
    accent: 'cyan',
  },
  {
    number: '03',
    title: 'Image Sharpening',
    subtitle: 'Detail Enhancement',
    icon: Focus,
    description:
      'Emphasize fine structures by combining the smoothed image with its Laplacian response.',
    details:
      'The sharpening strength controls how strongly the signed Laplacian influences the output. Excessive sharpening can amplify noise or create halos.',
    formula: 'g = fₛₘₒₒₜₕ − c∇²f',
    accent: 'peach',
  },
  {
    number: '04',
    title: 'Gamma Correction',
    subtitle: 'Power-Law Transformation',
    icon: Sun,
    description:
      'Adjust image brightness through a nonlinear intensity transformation.',
    details:
      'Gamma values below one brighten the image, while values above one darken it. The transformation is applied after sharpening.',
    formula: 's = crᵞ',
    accent: 'mint',
  },
]

export default function Explore() {
  return (
    <div className="page explore-page">
      <section className="hero glass">
        <div className="hero-content">
          <div className="eyebrow">
            <Sparkles size={15} />
            DIGITAL IMAGE PROCESSING
          </div>

          <h1>
            Every pixel has <br />
            <span className="gradient-text">a story to reveal.</span>
          </h1>

          <p className="hero-description">
            Discover the science of image enhancement.
            Explore spatial filters, understand image transformations,
            and experiment with the techniques that bring
            visual details to life.
          </p>

          <div className="hero-actions">
            <Link to="/studio" className="primary-btn">
              Launch Studio <ArrowRight size={18} />
            </Link>
            <a href="#techniques" className="secondary-btn">
              Explore Techniques <ArrowDown size={17} />
            </a>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="orb orb-three" />
          <div className="hero-art-center">
            <Sparkles size={58} strokeWidth={1.1} />
          </div>
          <span className="orbit-label orbit-label-one">SMOOTH</span>
          <span className="orbit-label orbit-label-two">ENHANCE</span>
          <span className="orbit-label orbit-label-three">REVEAL</span>
        </div>
      </section>

      <section id="techniques" className="section">
        <div className="section-intro">
          <div className="eyebrow">THE SCIENCE BEHIND PIXELLAB</div>
          <h2>Four techniques. One enhancement pipeline.</h2>
          <p>
            Understand the purpose and mathematical foundation
            of every operation before applying it.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <article
                key={feature.number}
                className={`feature-card glass accent-${feature.accent}`}
              >
                <div className="feature-top">
                  <span className="feature-number">
                    {feature.number} / 04
                  </span>
                  <div className="feature-icon">
                    <Icon size={25} strokeWidth={1.7} />
                  </div>
                </div>

                <div className="feature-subtitle">
                  {feature.subtitle}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>

                <details className="feature-details">
                  <summary>Understand the technique</summary>
                  <p>{feature.details}</p>
                </details>

                <div className="formula">{feature.formula}</div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="workflow glass">
        <div className="workflow-heading">
          <div>
            <div className="eyebrow">OUR PROCESS</div>
            <h2>From original to enhanced</h2>
            <p>A sequential, multi-stage spatial enhancement pipeline.</p>
          </div>
          <BookOpen size={28} strokeWidth={1.4} />
        </div>

        <div className="workflow-steps">
          {['Original', 'Smoothing', 'Laplacian', 'Sharpening', 'Gamma'].map(
            (step, index) => (
              <div className="workflow-item" key={step}>
                <span className="workflow-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <strong>{step}</strong>
                {index < 4 && (
                  <ArrowRight className="workflow-arrow" size={18} />
                )}
              </div>
            )
          )}
        </div>
      </section>

      <section className="bottom-cta glass">
        <div>
          <div className="eyebrow">READY TO EXPERIMENT?</div>
          <h2>Turn theory into transformation.</h2>
          <p>Upload an image and explore each enhancement stage.</p>
        </div>
        <Link to="/studio" className="primary-btn">
          Open Studio <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  )
}
