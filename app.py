
from pathlib import Path

import cv2
import streamlit as st

from image_processor import (
    load_image,
    apply_smoothing,
    extract_laplacian,
    laplacian_preview,
    apply_sharpening,
    apply_gamma_correction,
)

# ---------------------------------------
# PAGE CONFIGURATION
# ---------------------------------------

st.set_page_config(
    page_title="PixelLab",
    page_icon="✨",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Load CSS
css_path = Path(__file__).parent / "assets" / "styles.css"

if css_path.is_file():
    st.html(css_path)


# ---------------------------------------
# HEADER
# ---------------------------------------

with st.container(key="glass_header"):
    st.html(
        """
        <div class="brand">
            <span class="brand-icon" aria-hidden="true">✦</span>
            <div>
                <h1>PixelLab</h1>
                <p>Refine. Enhance. Reveal.</p>
            </div>
        </div>
        """
    )


# ---------------------------------------
# STATE AND HELPERS
# ---------------------------------------

defaults = {
    "smooth_method": "Median",
    "kernel_size": 3,
    "sharp_strength": 0.5,
    "gamma_val": 1.0,
}

for key, value in defaults.items():
    if key not in st.session_state:
        st.session_state[key] = value


def reset_parameters():
    for key, value in defaults.items():
        st.session_state[key] = value


def panel_title(number, title, subtitle=""):
    st.markdown(
        f"""
        <div class="panel-heading">
            <span class="panel-number">{number}</span>
            <div>
                <div class="panel-title">{title}</div>
                <div class="panel-subtitle">{subtitle}</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def image_display(image, caption):
    st.image(
        image,
        caption=caption,
        use_container_width=True,
    )


# ---------------------------------------
# IMAGE PROCESSING KNOWLEDGE CARDS
# ---------------------------------------

st.markdown(
    """
    <div class="learning-intro">
        <div class="learning-eyebrow">THE SCIENCE BEHIND PIXELLAB</div>
        <h2>Explore the Enhancement Pipeline</h2>
        <p>
            Discover how spatial filtering and intensity
            transformations improve digital images.
        </p>
    </div>

    <div class="knowledge-grid">

        <div class="knowledge-card">
            <div class="knowledge-number">01 / FILTERING</div>
            <div class="knowledge-icon">≈</div>
            <h3>Noise Reduction</h3>
            <p>
                Median and averaging filters reduce noise
                by processing neighboring pixels.
            </p>
            <div class="knowledge-foot">
                Spatial Smoothing
            </div>
        </div>

        <div class="knowledge-card">
            <div class="knowledge-number">02 / DERIVATIVES</div>
            <div class="knowledge-icon">⌁</div>
            <h3>Edge Extraction</h3>
            <p>
                The Laplacian operator uses second-order
                derivatives to highlight intensity changes.
            </p>
            <div class="knowledge-foot">
                Laplacian Operator
            </div>
        </div>

        <div class="knowledge-card">
            <div class="knowledge-number">03 / ENHANCEMENT</div>
            <div class="knowledge-icon">✧</div>
            <h3>Sharpening</h3>
            <p>
                Combines the smoothed image with its
                Laplacian response to emphasize details.
            </p>
            <div class="knowledge-foot">
                Spatial Sharpening
            </div>
        </div>

        <div class="knowledge-card">
            <div class="knowledge-number">04 / TRANSFORMATION</div>
            <div class="knowledge-icon">◐</div>
            <h3>Gamma Correction</h3>
            <p>
                Applies a power-law transformation
                to adjust the image's intensity levels.
            </p>
            <div class="knowledge-foot">
                Power-Law Transformation
            </div>
        </div>

    </div>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------
# UPLOAD AND ACTION BAR

# ---------------------------------------

with st.container(key="glass_upload"):
    upload_col, action_col = st.columns(
        [4, 1],
        vertical_alignment="bottom"
    )

    with upload_col:
        st.markdown("#### Image Workspace")
        uploaded_file = st.file_uploader(
            "Choose a photograph or scanned image",
            type=["jpg", "jpeg", "png"],
            key="image_upload",
        )

    with action_col:
        st.button(
            "↺ Reset Filters",
            on_click=reset_parameters,
            use_container_width=True,
        )


# ---------------------------------------
# MAIN WORKSPACE
# ---------------------------------------

workspace_col, tools_col = st.columns(
    [1.65, 1],
    gap="medium",
)

# LEFT: IMAGE CANVAS
with workspace_col:
    with st.container(key="glass_canvas"):
        panel_title(
            "01",
            "Image Canvas",
            "Live processing preview",
        )

        if uploaded_file is None:
            st.markdown(
                """
                <div class="canvas-empty">
                    <div class="canvas-symbol">✧</div>
                    <h2>Your creative workspace</h2>
                    <p>
                        Upload an image to begin exploring
                        spatial image enhancement.
                    </p>
                    <div class="canvas-hint">
                        PNG · JPG · JPEG
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        else:
            try:
                original_img = load_image(uploaded_file)

                smoothed_img = apply_smoothing(
                    original_img,
                    method=st.session_state["smooth_method"],
                    kernel_size=st.session_state["kernel_size"],
                )

                laplacian_raw = extract_laplacian(
                    smoothed_img
                )

                laplacian_img = laplacian_preview(
                    laplacian_raw
                )

                sharpened_img = apply_sharpening(
                    smoothed_img,
                    laplacian_raw,
                    strength=st.session_state["sharp_strength"],
                )

                final_img = apply_gamma_correction(
                    sharpened_img,
                    gamma=st.session_state["gamma_val"],
                )

            except Exception as e:
                st.error(f"Image processing failed: {e}")
                st.stop()

            preview_options = {
                "Original": original_img,
                "Smoothed": smoothed_img,
                "Laplacian": laplacian_img,
                "Sharpened": sharpened_img,
                "Final": final_img,
            }

            selected_stage = st.segmented_control(
                "Preview Stage",
                options=list(preview_options.keys()),
                default="Final",
                key="preview_stage",
            )

            if selected_stage is None:
                selected_stage = "Final"

            image_display(
                preview_options[selected_stage],
                f"{selected_stage} Image",
            )

            height, width = original_img.shape[:2]

            st.caption(
                f"Resolution: {width} × {height} pixels"
            )


# RIGHT: FLOATING CONTROL PANELS
with tools_col:

    with st.container(key="glass_smoothing"):
        panel_title(
            "02",
            "Noise Reduction",
            "Smoothing spatial filters",
        )

        with st.expander(
            "Adjust Smoothing",
            expanded=True
        ):
            st.selectbox(
                "Filter Method",
                ["Median", "Box (Averaging)"],
                key="smooth_method",
            )

            st.slider(
                "Kernel Size",
                min_value=3,
                max_value=11,
                step=2,
                key="kernel_size",
            )

            st.caption(
                "Median is useful for salt-and-pepper noise. "
                "Box filtering averages neighboring pixels."
            )

    with st.container(key="glass_edges"):
        panel_title(
            "03",
            "Edge Extraction",
            "Laplacian operator",
        )

        with st.expander("View Edge Settings"):
            st.write("4-neighbor Laplacian kernel")

            st.code(
                " 0   1   0\n"
                " 1  -4   1\n"
                " 0   1   0"
            )

            st.caption(
                "Detects rapid intensity changes "
                "using second-order derivatives."
            )

    with st.container(key="glass_sharpen"):
        panel_title(
            "04",
            "Image Sharpening",
            "Enhance fine details",
        )

        with st.expander("Adjust Sharpness"):
            st.slider(
                "Sharpening Strength",
                min_value=0.0,
                max_value=3.0,
                step=0.1,
                key="sharp_strength",
            )

            st.caption(
                "Higher values emphasize edges, "
                "but excessive sharpening may amplify noise."
            )

    with st.container(key="glass_gamma"):
        panel_title(
            "05",
            "Gamma Correction",
            "Power-law transformation",
        )

        with st.expander("Adjust Gamma"):
            st.slider(
                "Gamma Value",
                min_value=0.1,
                max_value=3.0,
                step=0.1,
                key="gamma_val",
            )

            st.caption(
                "Below 1: brighter · Above 1: darker"
            )


# ---------------------------------------
# RESULTS
# ---------------------------------------

if uploaded_file is not None:

    with st.container(key="glass_pipeline"):
        panel_title(
            "06",
            "Processing Pipeline",
            "Explore all five stages",
        )

        stages = [
            ("Original", original_img),
            ("Smoothed", smoothed_img),
            ("Laplacian", laplacian_img),
            ("Sharpened", sharpened_img),
            ("Final", final_img),
        ]

        cols = st.columns(5, gap="small")

        for i, (name, image) in enumerate(stages):
            with cols[i]:
                st.markdown(
                    f'<div class="stage-label">'
                    f'0{i+1} / {name}</div>',
                    unsafe_allow_html=True,
                )
                st.image(
                    image,
                    use_container_width=True,
                )

    with st.container(key="glass_comparison"):
        panel_title(
            "07",
            "Before & After",
            "Compare the original and enhanced output",
        )

        before_col, after_col = st.columns(2)

        with before_col:
            image_display(
                original_img,
                "Before Enhancement",
            )

        with after_col:
            image_display(
                final_img,
                "After Enhancement",
            )

        success, encoded = cv2.imencode(
            ".png",
            cv2.cvtColor(
                final_img,
                cv2.COLOR_RGB2BGR
            ),
        )

        if success:
            st.download_button(
                "↓ Export Enhanced Image",
                data=encoded.tobytes(),
                file_name="enhanced_output.png",
                mime="image/png",
                use_container_width=True,
            )


# ---------------------------------------
# EDUCATIONAL PANEL
# ---------------------------------------

with st.container(key="glass_theory"):
    panel_title(
        "08",
        "Algorithm Insights",
        "Mathematical foundations",
    )

    with st.expander("Explore Image Processing Theory"):

        st.markdown("#### 1. Smoothing")
        st.write(
            "Noise reduction using Median or Box "
            "spatial filtering."
        )

        st.markdown("#### 2. Laplacian")
        st.latex(
            r"\nabla^2 f = "
            r"\frac{\partial^2 f}{\partial x^2}"
            r"+\frac{\partial^2 f}{\partial y^2}"
        )

        st.markdown("#### 3. Sharpening")
        st.latex(
            r"g(x,y)=f_{\mathrm{smooth}}(x,y)"
            r"-c\nabla^2 f(x,y)"
        )

        st.markdown("#### 4. Gamma Correction")
        st.latex(r"s=cr^\gamma")

st.markdown(
    '<div class="footer">'
    'PixelLab · Digital Image Processing'
    '</div>',
    unsafe_allow_html=True,
)
