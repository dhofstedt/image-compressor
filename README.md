# Browser-Based Image Compressor

A privacy-focused image compression tool that runs entirely in the browser. No server uploads, no data collection, just simple and efficient image compression.

## Features

- 🔒 100% client-side processing
- 📦 No server uploads - your images never leave your device
- 🖼 Real-time image preview
- 🎚 Adjustable compression settings
- 📱 Drag-and-drop support
- 💾 EXIF data preservation
- 🎯 Smart quality optimization
- 📊 Real-time size estimation

## How It Works

The tool uses the HTML5 Canvas API to compress images directly in your browser:

1. Images are loaded locally using the File API
2. Compression is performed using canvas.toBlob()
3. Binary search is used to find optimal quality settings
4. Final image is generated for download

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/dhofstedt/image-compressor.git
   ```

2. Open `index.html` in your browser

No build process or dependencies required!

## Privacy & Security

- No external services or APIs used
- Works offline after page load
- No cookies or tracking
- No analytics
- Source code is open for inspection

## Browser Support

Supports all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## License

MIT