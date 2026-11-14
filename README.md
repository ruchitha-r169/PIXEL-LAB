# PixelLab — Digital Image Enhancement and Analysis

**An interactive web-based application for digital image processing using React, Python, OpenCV, and FastAPI.**

## 1. Project Overview

PixelLab is a digital image enhancement application designed to demonstrate and implement fundamental image processing techniques through an interactive web interface.

The application allows users to upload an image, apply enhancement algorithms, adjust processing parameters, visualize intermediate results, compare original and processed images, and download the enhanced output.

The project combines a React-based frontend with a Python image-processing backend. FastAPI provides communication between the frontend and the processing algorithms.

The application is being developed as an academic Digital Image Processing project, with an emphasis on both the mathematical principles of image enhancement and their practical implementation.

### Project Status

**Current phase:** Core Enhancement Studio implemented and tested.

The image-upload functionality, processing pipeline, parameter controls, intermediate visualizations, comparison tool, and image download are working.

The Image Analysis module and additional evaluation features are planned for the next development phase.

---

## 2. Project Objectives

The main objectives of PixelLab are:

1. Implement fundamental spatial-domain image enhancement algorithms.
2. Reduce image noise using smoothing filters.
3. Extract image edges using the Laplacian operator.
4. Improve image sharpness using Laplacian-based enhancement.
5. Adjust image brightness through gamma correction.
6. Allow users to modify processing parameters interactively.
7. Visualize the intermediate outputs of the image-processing pipeline.
8. Compare the original and enhanced images.
9. Provide quantitative image analysis using histograms and statistical measurements.
10. Develop an interactive frontend integrated with a Python processing backend.

Objectives 1–8 have been implemented in the core Studio. Objective 9 is planned, and objective 10 is implemented for the current local application.

---

## 3. Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React | Interactive user interface |
| Build tool | Vite | Frontend development and bundling |
| Programming language | JavaScript / JSX | Frontend application logic |
| Styling | CSS3 | Responsive layouts, animations, and visual design |
| Icons | Lucide React | Interface icons |
| Navigation | React Router DOM | Client-side page navigation |
| Backend | Python | Image-processing logic |
| API framework | FastAPI | REST API for image processing |
| ASGI server | Uvicorn | Runs the FastAPI application |
| Image processing | OpenCV (`cv2`) | Filtering, convolution, and transformations |
| Numerical operations | NumPy | Image arrays and mathematical computations |
| Image support | Pillow | Image-handling support |
| API communication | Fetch API | Sends images and parameters from React to FastAPI |

### Why FastAPI?

FastAPI is a modern Python framework for developing web APIs.

It was selected because it allows the Python image-processing functions to be exposed as HTTP endpoints that can be called from the React frontend.

In PixelLab, FastAPI is responsible for:

- Receiving uploaded images from the frontend.
- Receiving user-selected processing parameters.
- Validating incoming requests.
- Calling the image-processing functions.
- Preparing the processed images for transmission.
- Returning the original and intermediate image results.
- Handling API errors.

FastAPI also automatically generates interactive API documentation using Swagger UI.

The documentation is available locally at:

`http://127.0.0.1:8000/docs`

### Why OpenCV?

OpenCV is used to perform the actual image-processing operations, including spatial filtering, Laplacian convolution, and pixel transformations.

NumPy supports these operations through efficient numerical array manipulation.

---

## 4. Application Architecture

PixelLab follows a frontend–backend architecture.

```text
                    USER
                     |
                     v
             React + Vite Frontend
              localhost:5173
                     |
                     | Upload image
                     | Select parameters
                     |
                     v
                Fetch API
                     |
                     | HTTP POST
                     | multipart/form-data
                     v
               FastAPI Backend
              127.0.0.1:8000
                     |
                     v
             Python Image Processor
                     |
          +----------+-----------+
          |          |           |
        OpenCV      NumPy      Pillow
          |          |           |
          +----------+-----------+
                     |
                     v
            Enhancement Pipeline
                     |
              Noise Reduction
                     |
             Laplacian Operator
                     |
             Image Sharpening
                     |
             Gamma Correction
                     |
                     v
             Processed Images
                     |
                     | JSON response
                     | Base64 PNG data URLs
                     v
                React Studio
                     |
             Preview / Compare
                     |
               Download PNG
```

### Architecture Explanation

**Frontend Layer**

The React frontend manages user interactions, file selection, parameter adjustments, result visualization, and downloading.

**API Layer**

FastAPI connects the frontend with Python. The frontend sends the image and parameters using an HTTP POST request.

**Processing Layer**

The Python image processor applies the selected algorithms sequentially.

**Response Layer**

The backend converts the image outputs into PNG data URLs and returns them in a JSON response. React displays these images directly.

**Current storage approach**

The application processes images in memory. It does not currently use a database or persistent image storage.

---

## 5. Implemented Application Pages

### 5.1 Explore Page — Implemented

The Explore page introduces the image enhancement pipeline and provides an interactive educational interface.

**Implemented features:**

- PixelLab branding and navigation.
- Project introduction and overview.
- Interactive enhancement pipeline.
- Selectable processing stages.
- Descriptions of image-processing algorithms.
- Mathematical formulas.
- Four-neighbor Laplacian kernel visualization.
- Illustrative visual examples.
- Navigation to the Enhancement Studio.
- Responsive lavender-blue user interface.

The interactive pipeline introduces the following concepts:

- Original image
- Noise reduction
- Laplacian edge extraction
- Image sharpening
- Gamma correction

**Important:** The illustrations on the Explore page are conceptual SVG-based visualizations. They are not outputs generated by the Python/OpenCV processing engine.

Actual processing takes place in the Enhancement Studio.

### 5.2 Enhancement Studio — Implemented

The Enhancement Studio is the main functional module.

It allows users to upload images and perform enhancement operations using adjustable parameters.

**Implemented features:**

- PNG and JPEG image upload.
- Click-to-browse file selection.
- Drag-and-drop image upload.
- File type validation.
- Maximum upload size validation of 10 MB.
- Original image preview.
- Adjustable noise reduction method.
- Adjustable smoothing kernel size.
- Laplacian edge extraction.
- Dedicated View Extracted Edges button.
- Adjustable sharpening strength.
- Adjustable gamma correction.
- Image processing through FastAPI.
- Intermediate processing outputs.
- Interactive six-step workflow.
- Stage selection and preview.
- Original-versus-enhanced comparison slider.
- Final enhanced image download.
- Reset functionality.
- Loading and error states.

### 5.3 Image Analysis Page — Pending

The Analysis page currently contains an introductory placeholder describing the intended analysis functionality.

The following features have not yet been implemented:

- Original image histogram.
- Enhanced image histogram.
- Mean brightness comparison.
- Contrast measurement.
- Pixel intensity statistics.
- Quantitative before-and-after comparison.
- Analysis result visualization.

This is the next major development module.

---

## 6. Image Enhancement Workflow

PixelLab uses the following six-step workflow:

```text
             Original Image
                    |
                    v
             Noise Reduction
                    |
                    v
       Edge Extraction (Laplacian)
                    |
                    v
             Image Sharpening
                    |
                    v
             Gamma Correction
                    |
                    v
          Final Enhanced Image
```

Although six workflow steps are displayed, the current backend returns five image outputs:

| Workflow Step | Backend Output Key | Description |
|---|---|---|
| Original Image | `Original` | Uploaded image |
| Noise Reduction | `Smoothed` | Noise-reduced image |
| Edge Extraction | `Laplacian` | Visual representation of extracted edges |
| Image Sharpening | `Sharpened` | Sharpened image |
| Gamma Correction | `Final` | Gamma-corrected image |
| Final Enhanced Image | `Final` | Completed enhanced image |

Gamma Correction and Final Enhanced Image intentionally display the same output because gamma correction is the last image transformation.

---

## 7. Implemented Image Processing Algorithms

### 7.1 Noise Reduction

Noise reduction is the first enhancement operation.

Its purpose is to reduce unwanted pixel intensity variations before applying edge extraction and sharpening.

Two smoothing methods are implemented.

#### A. Median Filter

The median filter replaces each pixel with the median intensity value within its neighborhood.

For a neighborhood containing pixel values:

```text
10, 12, 11
13, 255, 14
12, 11, 13
```

The sorted values are:

```text
10, 11, 11, 12, 12, 13, 13, 14, 255
```

The median value is `12`.

The unusually high value `255` is therefore removed from the center pixel.

**Advantages:**

- Effective for salt-and-pepper noise.
- Reduces isolated intensity outliers.
- Often preserves edges better than simple averaging.

#### B. Box (Averaging) Filter

The averaging filter replaces a pixel with the mean of its neighboring values.

For a 3×3 neighborhood:

```text
1/9 × | 1  1  1 |
      | 1  1  1 |
      | 1  1  1 |
```

The output is calculated using the average of the neighborhood.

**Advantages:**

- Simple spatial filtering technique.
- Reduces local intensity fluctuations.
- Useful for demonstrating convolution-based smoothing.

**Limitation:** Averaging may blur fine details and edges.

#### User-Adjustable Parameters

- Filter method: Median or Box (Averaging).
- Kernel sizes: 3×3, 5×5, 7×7, 9×9, and 11×11.

The default method is Median with a 3×3 kernel.

### 7.2 Edge Extraction Using the Laplacian Operator

Edge extraction identifies areas where image intensity changes rapidly.

PixelLab uses a four-neighbor Laplacian operator.

The Laplacian is a second-order spatial derivative.

**Mathematical representation:**

\[
\nabla^2 f =
\frac{\partial^2 f}{\partial x^2}
+
\frac{\partial^2 f}{\partial y^2}
\]

**Laplacian kernel:**

```text
|  0   1   0 |
|  1  -4   1 |
|  0   1   0 |
```

The kernel is applied to the smoothed image using convolution/filtering.

The resulting signed Laplacian response represents local intensity changes.

A display-friendly edge map is generated for visualization.

**Implementation details:**

- Four-neighbor Laplacian kernel.
- OpenCV filtering.
- Floating-point response for processing.
- Absolute-value visualization for the edge preview.

The edge map is available in the Studio through the **Edge Extraction (Laplacian)** stage and the **View Extracted Edges** button.

**Important distinction:** The displayed edge map is a visualization of the Laplacian response. The signed response is retained for sharpening.

### 7.3 Image Sharpening

Image sharpening improves the visibility of edges and fine image details.

PixelLab uses Laplacian-based sharpening.

The sharpened image is obtained by subtracting a scaled Laplacian response from the smoothed image.

**Formula:**

\[
g(x,y) = f_s(x,y) - \alpha\nabla^2 f_s(x,y)
\]

Where:

- \(f_s(x,y)\) is the smoothed image.
- \(\nabla^2 f_s(x,y)\) is the signed Laplacian response.
- \(\alpha\) is the sharpening strength.
- \(g(x,y)\) is the sharpened image.

**Implemented parameter:**

- Sharpening strength: 0.0 to 3.0.
- Default sharpening strength: 0.5.

Higher values increase the contribution of the Laplacian response.

Very high values may introduce excessive enhancement or visual artifacts.

### 7.4 Gamma Correction

Gamma correction performs a nonlinear intensity transformation.

It is used to adjust the brightness and tonal appearance of the sharpened image.

**Formula:**

\[
s = cr^\gamma
\]

Where:

- \(r\) is the normalized input intensity.
- \(s\) is the transformed intensity.
- \(c\) is a scaling constant.
- \(\gamma\) is the gamma value.

**Behavior in the implemented transformation:**

| Gamma Value | Effect |
|---|---|
| Less than 1 | Brightens the image |
| Equal to 1 | Preserves intensity values |
| Greater than 1 | Darkens the image |

**Implemented parameter:**

- Gamma range: 0.1 to 3.0.
- Default gamma: 1.0.

The gamma-corrected image becomes the final enhanced output.

---

## 8. FastAPI Backend Implementation

The backend is implemented using Python and FastAPI.

### 8.1 Main Backend Files

**`backend.py`**

Responsible for:

- Creating the FastAPI application.
- Configuring Cross-Origin Resource Sharing (CORS).
- Defining API endpoints.
- Accepting uploaded images.
- Validating requests.
- Calling processing functions.
- Returning processed results.

**`image_processor.py`**

Contains the image-processing algorithms.

The functions used in the processing pipeline include:

```python
apply_smoothing()
extract_laplacian()
laplacian_preview()
apply_sharpening()
apply_gamma_correction()
```

### 8.2 FastAPI Endpoints

#### GET `/`

A basic backend health endpoint.

Used to verify that the FastAPI server is accessible.

#### POST `/process`

The main image-processing endpoint.

**Request format:** `multipart/form-data`

The frontend submits the following fields:

| Parameter | Type | Purpose |
|---|---|---|
| `file` | Image file | Original image |
| `method` | String | Smoothing method |
| `kernel_size` | Integer | Smoothing kernel dimension |
| `strength` | Float | Sharpening strength |
| `gamma` | Float | Gamma correction value |

**Example request:**

```http
POST /process
Content-Type: multipart/form-data
```

Example parameter values:

```text
file        = image.jpg
method      = Median
kernel_size = 3
strength    = 0.5
gamma       = 1.0
```

### 8.3 Processing Sequence

After receiving a valid request, the backend:

1. Reads and decodes the uploaded image.
2. Applies the selected smoothing filter.
3. Calculates the signed Laplacian response.
4. Generates a visual Laplacian edge map.
5. Applies Laplacian-based sharpening.
6. Performs gamma correction.
7. Converts the intermediate results to PNG representations.
8. Encodes the images as Base64 data URLs.
9. Returns the outputs to the frontend.

### 8.4 API Response

The response contains the processed image dimensions and five image stages.

**Illustrative JSON response structure:**

```json
{
  "width": 800,
  "height": 600,
  "stages": {
    "Original": "data:image/png;base64,...",
    "Smoothed": "data:image/png;base64,...",
    "Laplacian": "data:image/png;base64,...",
    "Sharpened": "data:image/png;base64,...",
    "Final": "data:image/png;base64,..."
  }
}
```

The dimensions above are examples. Actual values depend on the uploaded image.

The frontend reads the `stages` object to display the corresponding processing results.

### 8.5 Image Validation

The backend is configured to validate uploaded images.

Current limits include:

- Supported image formats: PNG and JPEG.
- Maximum file size: 10 MB.
- Maximum image dimensions by pixel count: 20 megapixels.

The frontend also performs basic file type and file size checks.

### 8.6 CORS Configuration

The React frontend and FastAPI backend run on different local ports.

Frontend:

`http://localhost:5173`

Backend:

`http://127.0.0.1:8000`

Because these are different origins, FastAPI uses CORS middleware to permit communication from the local frontend.

The backend is configured to support the local Vite development origin.

### 8.7 Swagger UI

FastAPI automatically provides interactive API documentation.

Open:

`http://127.0.0.1:8000/docs`

The `/process` endpoint can be tested directly by uploading an image and providing processing parameters.

This is useful for testing the backend independently of the React interface.

---

## 9. React Frontend Implementation

The frontend is developed using React with Vite.

### Main Components

**`App.jsx`**

Contains the application structure, navigation, Explore page components, and current Analysis placeholder.

It also configures routing between the three application pages.

**`Studio.jsx`**

Implements the Enhancement Studio.

Its responsibilities include:

- Image selection and upload.
- File validation.
- Image preview.
- Processing parameter state.
- FastAPI requests.
- Processing stage navigation.
- Edge-map visualization.
- Comparison functionality.
- Image downloading.
- Error handling.

**`App.css`**

Contains styles for the overall application, Explore page, navigation, and shared interface elements.

**`Studio.css`**

Contains the Enhancement Studio styles, including:

- Image upload area.
- Processing controls.
- Preview workspace.
- Workflow visualization.
- Result cards.
- Comparison slider.
- Responsive layouts.

**`index.css`**

Contains global styling and application-wide CSS rules.

### Routing

The frontend uses React Router DOM.

| Route | Page | Status |
|---|---|---|
| `/` | Explore | Implemented |
| `/studio` | Enhancement Studio | Implemented |
| `/analysis` | Image Analysis | Placeholder |

### React State Management

The Studio currently uses React hooks such as:

- `useState`
- `useEffect`
- `useRef`

State is used to manage:

- Uploaded image.
- Image preview URL.
- Filter settings.
- Processing results.
- Selected workflow stage.
- Loading status.
- Error messages.
- Comparison visibility.

The Studio currently stores its processing state locally within the component.

---

## 10. Project Folder Structure

The following structure shows the main files and folders used in the current implementation.

```text
ImageEnhancementProject/
│
├── backend.py
├── image_processor.py
│
├── .venv/
│
├── frontend/
│   │
│   ├── public/
│   │
│   ├── src/
│   │   │
│   │   ├── pages/
│   │   │   ├── Studio.jsx
│   │   │   └── Studio.css
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── index.html
│
└── README.md
```

This structure describes the principal files discussed during development. Other files may exist in the repository.

---

## 11. Installation and Local Setup

### Prerequisites

Before running the project, install:

- Python
- Node.js
- npm
- Git
- Visual Studio Code or another code editor

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd ImageEnhancementProject
```

Replace `<repository-url>` with the actual GitHub repository URL.

### Step 2: Create a Python Virtual Environment

From the project root:

```powershell
python -m venv .venv
```

Activate the environment on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

### Step 3: Install Python Dependencies

```powershell
python -m pip install fastapi uvicorn python-multipart opencv-python numpy pillow
```

The dependencies are used for:

| Package | Purpose |
|---|---|
| `fastapi` | Backend API |
| `uvicorn` | ASGI server |
| `python-multipart` | Multipart form and file uploads |
| `opencv-python` | Image-processing algorithms |
| `numpy` | Numerical array operations |
| `pillow` | Image-handling support |

### Step 4: Start the FastAPI Backend

Run from the project root:

```powershell
python -m uvicorn backend:app --reload --port 8000
```

The backend should start at:

`http://127.0.0.1:8000`

API documentation:

`http://127.0.0.1:8000/docs`

### Step 5: Install Frontend Dependencies

Open a second terminal.

```powershell
cd frontend
npm install
```

The project dependencies are defined in `frontend/package.json`.

### Step 6: Start the React Frontend

```powershell
npm run dev
```

The Vite development server normally starts at:

`http://localhost:5173`

If port 5173 is occupied, Vite may select another available port. Check the terminal output.

**Note:** The backend CORS configuration and frontend API URL may need adjustment if the frontend runs on a different origin.

### Step 7: Open the Application

Visit:

`http://localhost:5173`

Navigate to **Studio** to upload and process an image.

### Stopping the Application

Press `Ctrl + C` in each terminal to stop the frontend and backend servers.

---

## 12. How to Use PixelLab

### Step 1: Open Enhancement Studio

Launch the application and select **Studio** from the navigation bar.

### Step 2: Upload an Image

Upload a PNG or JPEG image using the file picker or drag-and-drop area.

The original image appears in the preview workspace.

### Step 3: Configure Noise Reduction

Choose either:

- Median Filter
- Box (Averaging)

Adjust the kernel size if required.

### Step 4: Configure Sharpening

Adjust the sharpening strength using the slider.

### Step 5: Configure Gamma Correction

Set the gamma value to brighten or darken the output.

### Step 6: Process the Image

Click **Enhance Image**.

The frontend sends the image and selected parameters to FastAPI.

### Step 7: Inspect the Processing Results

Explore the six workflow steps:

1. Original Image
2. Noise Reduction
3. Edge Extraction (Laplacian)
4. Image Sharpening
5. Gamma Correction
6. Final Enhanced Image

Click any stage to view its corresponding image.

### Step 8: View Extracted Edges

Use the **View Extracted Edges** button in the Laplacian section.

The main preview displays the edge map.

### Step 9: Compare Images

Click **Compare** to open the before-and-after comparison.

Drag the comparison slider to inspect visual differences.

### Step 10: Download the Output

Click **Download PNG**.

The enhanced image is downloaded as:

`PixelLab_Enhanced.png`

---

## 13. Completed Features Summary

| Feature | Status |
|---|---|
| React + Vite frontend | Completed |
| PixelLab branding and UI | Completed |
| Navigation between pages | Completed |
| Interactive Explore page | Completed |
| Educational processing pipeline | Completed |
| Image upload | Completed |
| Drag-and-drop support | Completed |
| File validation | Completed |
| Median filtering | Completed |
| Averaging filtering | Completed |
| Adjustable smoothing kernel | Completed |
| Laplacian edge extraction | Completed |
| Edge map preview | Completed |
| Laplacian-based sharpening | Completed |
| Adjustable sharpening strength | Completed |
| Gamma correction | Completed |
| Adjustable gamma parameter | Completed |
| FastAPI integration | Completed |
| Five backend image outputs | Completed |
| Six-step frontend workflow | Completed |
| Processing stage selection | Completed |
| Before/after comparison | Completed |
| PNG download | Completed |
| Reset controls | Completed |
| Loading and error messages | Completed |
| Responsive Studio styling | Implemented |
| Analysis page | Placeholder |

---

## 14. Features Yet to Be Implemented

The following items form the proposed development roadmap. They are not currently part of the completed application.

### Phase 1: Image Analysis Module — High Priority

The next major task is to implement the Analysis page.

#### A. Image Histograms

Generate intensity histograms for:

- Original image.
- Final enhanced image.

A histogram represents the frequency distribution of pixel intensity values.

For an 8-bit image, intensity values range from 0 to 255.

Potential extensions include separate red, green, and blue channel histograms.

#### B. Brightness Analysis

Calculate mean image intensity.

\[
\mu = \frac{1}{MN}
\sum_{x=1}^{M}
\sum_{y=1}^{N} I(x,y)
\]

Where:

- \(M\) and \(N\) represent image dimensions.
- \(I(x,y)\) is pixel intensity.
- \(\mu\) is mean intensity.

Compare brightness before and after enhancement.

#### C. Contrast Analysis

Calculate image contrast using the standard deviation of grayscale intensity.

\[
\sigma =
\sqrt{
\frac{1}{MN}
\sum_{x=1}^{M}
\sum_{y=1}^{N}
(I(x,y)-\mu)^2
}
\]

A larger standard deviation generally indicates a wider spread of intensity values.

However, a larger value does not automatically mean the image has better visual quality.

#### D. Image Statistics

Display:

- Image width and height.
- Total number of pixels.
- Minimum pixel intensity.
- Maximum pixel intensity.
- Mean intensity.
- Standard deviation.
- Optional file information.

#### E. Before-and-After Statistics

Provide side-by-side comparison cards and charts.

The goal is to demonstrate how enhancement changes measurable image characteristics.

### Phase 2: Connect Studio and Analysis

Currently, the Studio stores processing results in component state.

Navigating away from the Studio can cause those results to be lost.

A shared state mechanism is required so that the Analysis page can access the most recently processed image.

Possible approaches:

- React Context API.
- Shared application-level state.
- A state management library.
- Session-based storage for temporary persistence.

The initial implementation should use shared React state or Context to avoid unnecessary backend complexity.

### Phase 3: Backend Analysis API

Extend the Python backend to calculate and return image statistics.

Potential functionality includes:

```text
Original image statistics
Enhanced image statistics
Grayscale histograms
Brightness difference
Contrast difference
Intensity distribution
```

The analysis calculations should be based on actual pixel values rather than simulated data.

The existing `/process` endpoint may be extended, or a separate analysis endpoint may be introduced.

### Phase 4: Improved Visualization

Potential additions:

- Interactive histogram charts.
- RGB channel histogram selection.
- Side-by-side stage comparison.
- Zoom controls.
- Image pixel inspection.
- More detailed descriptions of processing results.

### Phase 5: Testing and Validation

The application should be tested using images with different characteristics:

- Low-light images.
- High-brightness images.
- Salt-and-pepper noise.
- Smooth images.
- High-detail images.
- Images containing strong edges.

Testing should cover:

- Correctness of image transformations.
- Parameter boundary values.
- Unsupported file types.
- Oversized files.
- Backend availability.
- Error handling.
- UI responsiveness.
- Output consistency.

Unit tests should also be added for individual Python image-processing functions.

### Phase 6: Documentation and Deployment

Potential tasks:

- Add screenshots of all pages.
- Add sample input and output images.
- Add API usage examples.
- Create a pinned dependency list.
- Add automated tests.
- Document known limitations.
- Prepare the final project report.
- Deploy the frontend and backend if remote access is required.

---

## 15. Current Limitations

The application currently has the following limitations.

### 15.1 Local Development Setup

The application is currently configured for local development.

The frontend and backend run on separate local ports.

Remote deployment has not yet been implemented.

### 15.2 No Persistent Image Storage

Uploaded images and processed results are stored temporarily in the application session.

They are not currently saved to a database or cloud storage service.

Refreshing the application or navigating away from the Studio may remove the current results.

### 15.3 Analysis Module Not Implemented

The Analysis page currently displays placeholder content.

Real histograms and quantitative statistics still need to be added.

### 15.4 Limited Image Formats

The current upload interface accepts PNG and JPEG images.

Additional formats are not currently supported.

### 15.5 Limited Enhancement Algorithms

The implemented algorithms focus on:

- Median filtering.
- Averaging filtering.
- Laplacian edge extraction.
- Laplacian sharpening.
- Gamma correction.

Other techniques, such as histogram equalization, Gaussian filtering, bilateral filtering, and unsharp masking, are not currently included.

### 15.6 Fixed Laplacian Kernel

The edge extraction stage currently uses a fixed four-neighbor Laplacian kernel.

The user cannot change the Laplacian kernel through the interface.

### 15.7 No Automatic Processing on Slider Changes

Changing processing parameters does not automatically reprocess the image.

The user must click **Enhance Image** to apply the new settings.

### 15.8 No Automated Test Suite

A formal automated testing framework has not yet been added.

The core functionality has been manually tested through the application.

---

## 16. Suggested Team Development Tasks

To allow multiple contributors to work independently, the remaining work can be divided into modules.

| Workstream | Responsibilities | Priority |
|---|---|---|
| Image Analysis | Histograms, brightness, contrast, statistics | High |
| Backend Enhancement | Statistical calculations and analysis API | High |
| Frontend Integration | Share processed image data between pages | High |
| Testing | Algorithm verification, error handling, edge cases | Medium |
| UI Improvements | Charts, zoom, result visualization | Medium |
| Documentation | Screenshots, report, API documentation | Medium |
| Deployment | Hosting and production configuration | Later |

### Recommended Development Order

**First:** Implement backend image statistics and histogram generation.

**Second:** Connect the Studio processing results to the Analysis page.

**Third:** Develop the Analysis dashboard using actual backend data.

**Fourth:** Add tests and validate results.

**Fifth:** Complete documentation and prepare the project demonstration.

This order minimizes duplicated work and keeps the analysis features connected to the existing processing pipeline.

---

## 17. GitHub Collaboration Guidelines

To keep development organized, contributors should:

1. Clone the repository and install the required dependencies.
2. Create a separate Git branch for each major feature.
3. Avoid committing the Python virtual environment or `node_modules`.
4. Test changes locally before pushing.
5. Use descriptive commit messages.
6. Create pull requests for changes that affect shared functionality.
7. Keep the README updated when new features are completed.

### Suggested Branch Names

```text
main
feature/image-analysis
feature/backend-statistics
feature/histograms
feature/ui-improvements
test/image-processing
```

### Recommended `.gitignore`

```gitignore
# Python
.venv/
venv/
__pycache__/
*.pyc
.pytest_cache/

# Node.js
node_modules/
frontend/node_modules/

# Vite build output
frontend/dist/

# Environment variables
.env
.env.*
!.env.example
frontend/.env
frontend/.env.*
!frontend/.env.example

# Editor and OS files
.vscode/
.DS_Store
Thumbs.db

# Temporary files
*.log
```

### Dependency Management

For reproducible setup, a `requirements.txt` file should be added and maintained for Python dependencies.

The existing `package.json` and `package-lock.json` should be committed for frontend dependency management.

The exact dependency versions should be recorded from the working development environment.

---

## 18. Future Scope

After completing the current project requirements, PixelLab could be extended with:

- Gaussian and bilateral filtering.
- Histogram equalization.
- Adaptive histogram equalization (CLAHE).
- Additional edge detection operators.
- Unsharp masking.
- Batch image processing.
- Additional image formats.
- Advanced image-quality metrics.
- Processing history.
- Exportable analysis reports.
- Optional cloud deployment.

These are potential extensions rather than confirmed implementation commitments.

---

## 19. Project Progress

### Completed

- Frontend application structure.
- Explore page.
- Enhancement Studio.
- Image upload and validation.
- Python image-processing algorithms.
- FastAPI integration.
- Six-step processing workflow.
- Edge extraction visualization.
- Interactive parameter controls.
- Before/after comparison.
- Final image export.

### In Progress / Next Development Phase

- Image Analysis module.
- Histogram generation.
- Brightness and contrast statistics.
- Shared processing data between pages.
- Backend analysis calculations.

### Planned

- Automated testing.
- Additional image visualization features.
- Improved technical documentation.
- Deployment preparation.

---

## 20. Conclusion

PixelLab provides an interactive implementation of fundamental digital image enhancement techniques.

The current application successfully integrates a React frontend with a Python/OpenCV processing backend through FastAPI.

Users can upload images, apply noise reduction, extract edges using the Laplacian operator, sharpen image details, adjust brightness through gamma correction, and visualize the resulting transformations.

The next development phase will focus on quantitative image analysis, including histograms, brightness measurements, and contrast statistics.

The long-term goal is to make PixelLab a complete educational image enhancement and analysis platform that combines practical processing tools with understandable visual explanations.

---

**Project:** PixelLab — Digital Image Enhancement and Analysis

**Current Version:** Development version 2.0 (frontend branding)

**Project Type:** Academic Digital Image Processing Application

**Current Status:** Core enhancement functionality completed; image analysis pending.
