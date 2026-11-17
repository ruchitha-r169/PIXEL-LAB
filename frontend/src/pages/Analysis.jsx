
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Layers3,
  Palette,
  Sparkles,
} from 'lucide-react'

import { useProcessing } from '../ProcessingContext'
import EnhancementAnalysis from './EnhancementAnalysis'
import ColorAnalysis from './ColorAnalysis'

import './Analysis.css'

export default function Analysis() {
  const { processingResult, colorResult } = useProcessing()

  const [searchParams, setSearchParams] = useSearchParams()

  const initialSource =
    searchParams.get('source') === 'color'
      ? 'color'
      : 'enhancement'

  const [lastSource, setLastSource] = useState(initialSource)

  const source =
    searchParams.get('source') === 'color'
      ? 'color'
      : 'enhancement'

  function switchSource(nextSource) {
    setLastSource(nextSource)
    setSearchParams({ source: nextSource })
  }

  const hasEnhancement = Boolean(
    processingResult?.analysis
  )

  const hasColor = Boolean(
    colorResult?.original && colorResult?.processed
  )

  return (
    <div className="unified-analysis">

      {/* UNIFIED ANALYSIS NAVIGATION */}

      <section
        style={{
          margin: '24px auto 10px',
          width: 'calc(100% - 48px)',
          maxWidth: 1250,
          padding: 22,
          borderRadius: 22,
          background:
            'linear-gradient(135deg, #f7f4ff, #edf5ff)',
          border: '1px solid #e5e0f7',
          boxShadow:
            '0 8px 28px rgba(110, 105, 175, 0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 18,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#8070d5',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1.2,
              }}
            >
              <BarChart3 size={16} />
              IMAGEENHANCEMENTPROJECT
            </div>

            <h2
              style={{
                margin: '10px 0 5px',
                color: '#35375f',
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              Unified Analysis Dashboard
            </h2>

            <p
              style={{
                margin: 0,
                color: '#8290aa',
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              Explore image statistics, histograms,
              quality metrics and processing reports.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#6e9d86',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={17} />
            Two Processing Workflows
          </div>
        </div>

        {/* ANALYSIS MODE SELECTOR */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            marginTop: 24,
          }}
        >
          <button
            type="button"
            onClick={() => switchSource('enhancement')}
            aria-pressed={source === 'enhancement'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '17px 19px',
              textAlign: 'left',
              borderRadius: 15,
              cursor: 'pointer',
              border:
                source === 'enhancement'
                  ? '2px solid #9382e9'
                  : '1px solid #e3e5f3',
              background:
                source === 'enhancement'
                  ? '#eeeaff'
                  : '#ffffff',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: '#e7e1ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#806fdb',
                flexShrink: 0,
              }}
            >
              <Activity size={21} />
            </div>

            <div style={{ flex: 1 }}>
              <strong
                style={{
                  display: 'block',
                  color: '#424367',
                  fontSize: 13,
                }}
              >
                Image Enhancement
              </strong>

              <small
                style={{
                  display: 'block',
                  marginTop: 4,
                  color: '#8994ad',
                  fontSize: 11,
                }}
              >
                Grayscale · PSNR · SSIM
              </small>

              <small
                style={{
                  display: 'block',
                  marginTop: 6,
                  color: hasEnhancement
                    ? '#379b78'
                    : '#9aa2b7',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {hasEnhancement
                  ? '● RESULT AVAILABLE'
                  : '○ NO RESULT YET'}
              </small>
            </div>

            {source === 'enhancement' && (
              <CheckCircle2
                size={19}
                color="#8171dd"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => switchSource('color')}
            aria-pressed={source === 'color'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '17px 19px',
              textAlign: 'left',
              borderRadius: 15,
              cursor: 'pointer',
              border:
                source === 'color'
                  ? '2px solid #9382e9'
                  : '1px solid #e3e5f3',
              background:
                source === 'color'
                  ? '#eeeaff'
                  : '#ffffff',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: '#e1efff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#589bd2',
                flexShrink: 0,
              }}
            >
              <Palette size={21} />
            </div>

            <div style={{ flex: 1 }}>
              <strong
                style={{
                  display: 'block',
                  color: '#424367',
                  fontSize: 13,
                }}
              >
                Color Image Analysis
              </strong>

              <small
                style={{
                  display: 'block',
                  marginTop: 4,
                  color: '#8994ad',
                  fontSize: 11,
                }}
              >
                RGB · Color Models · Segmentation
              </small>

              <small
                style={{
                  display: 'block',
                  marginTop: 6,
                  color: hasColor
                    ? '#379b78'
                    : '#9aa2b7',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {hasColor
                  ? '● RESULT AVAILABLE'
                  : '○ NO RESULT YET'}
              </small>
            </div>

            {source === 'color' && (
              <CheckCircle2
                size={19}
                color="#8171dd"
              />
            )}
          </button>
        </div>
      </section>

      {/* ACTIVE ANALYSIS */}

      <div key={source}>
        {source === 'enhancement' ? (
          <EnhancementAnalysis />
        ) : (
          <ColorAnalysis />
        )}
      </div>

    </div>
  )
}
