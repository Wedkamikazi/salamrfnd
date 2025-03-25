# Treasury Document Extractor

A modern application for extracting customer refund information from documents. The system uses pattern recognition and layout detection to reliably extract data from various document types.

## Features

- Document upload and processing for Word, PDF, and image files
- Extraction of customer info, refund amounts, IBAN numbers, and service numbers
- Layout detection for various form types
- Data validation and correction tools
- Document search and management
- Learning system that improves extraction over time

## Technology Stack

- React 18 with TypeScript
- Tailwind CSS for styling
- Mammoth for Word document processing
- PDF.js for PDF parsing
- Tesseract.js for OCR in images
- Dexie.js for IndexedDB storage
- Fuzzy search with Fuse.js

## Getting Started

### Development

1. Clone the repository:
   ```
   git clone https://github.com/Wedkamikazi/salamrfnd.git
   cd salamrfnd
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

### Building for Production

```
npm run build
```

### Running Tests

```
npm run test
```

## Project Structure

- `src/components`: UI components
- `src/services`: Business logic services
- `src/types`: TypeScript interfaces and types
- `src/utils`: Utility functions including extractors and layout detection
- `src/tests`: Test suite for verification

## Recent Improvements

- Enhanced name extraction for Treasury forms
- Improved Selection Popup visibility and positioning
- Mobile responsiveness enhancements
- Layout detection for additional form types
- Test suite for verifying extraction logic