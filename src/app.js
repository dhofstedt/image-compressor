const fileInput = document.getElementById('fileInput');
const compressBtn = document.getElementById('compressBtn');
const sizeSlider = document.getElementById('sizeSlider');
const sizeDisplay = document.getElementById('sizeDisplay');
const imagePreview = document.getElementById('imagePreview');
const previewContainer = document.getElementById('previewContainer');
const privacyLink = document.getElementById('privacyLink');
const privacyModal = document.getElementById('privacyModal');
const modalClose = document.getElementById('modalClose');
const faqLink = document.getElementById('faqLink');
const faqModal = document.getElementById('faqModal');
const faqModalClose = document.getElementById('faqModalClose');
let originalFile = null;

// Add formatBytes function at the top
function formatBytes(bytes) {
    const units = ['KB', 'MB'];
    let size = bytes / 1024;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Add preview functionality
function showPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        previewContainer.style.display = 'block';
        updateEstimatedSize();
    };
    reader.readAsDataURL(file);
}

// Update size estimate in real-time when slider moves
sizeSlider.addEventListener('input', updateEstimatedSize);

function updateEstimatedSize() {
    if (!originalFile) return;
    const targetSize = parseInt(sizeSlider.value) * 1024;
    const estimatedQuality = Math.min(1, targetSize / originalFile.size);
    const estimatedSize = Math.min(originalFile.size, targetSize);
    
    document.getElementById('estimatedSize').textContent = 
        `~${(estimatedSize / 1024).toFixed(1)} KB (${Math.round(estimatedQuality * 100)}% quality)`;
}

// Update size display when slider moves
sizeSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    sizeDisplay.textContent = value >= 1000 ? 
        `${(value/1000).toFixed(1)} MB` : 
        `${value} KB`;
});

// Convert input like "300 KB" to bytes
function parseSizeInput(sizeStr) {
    const units = { KB: 1024, MB: 1024 * 1024 };
    const [value, unit] = sizeStr.split(' ');
    return parseInt(value) * (units[unit] || 1);
}

// Binary search to find optimal quality
async function compressToMaxSize(file, maxBytes) {
    let minQuality = 0.1;
    let maxQuality = 1;
    let optimalQuality = 0.8;
    let compressedBlob = null;
    let iterations = 0;

    // Edge case: file already small enough
    if (file.size <= maxBytes) {
        return { blob: file, quality: 1 };
    }

    // Binary search loop (max 10 iterations)
    while (iterations < 10) {
        const quality = (minQuality + maxQuality) / 2;
        const blob = await compressImage(file, quality);
        
        if (blob.size <= maxBytes) {
            compressedBlob = blob;
            optimalQuality = quality;
            minQuality = quality; // Try higher quality
        } else {
            maxQuality = quality; // Try lower quality
        }
        
        iterations++;
    }

    return { blob: compressedBlob, quality: optimalQuality };
}

// Core compression function
function compressImage(file, quality) {
    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
            };
        };
        reader.readAsDataURL(file);
    });
}

// Updated click handler
compressBtn.addEventListener('click', async () => {
    try {
        const downloadLink = document.getElementById('downloadLink');
        if (!downloadLink) {
            console.error('Download link element not found');
            return;
        }
        
        // Clear previous download link
        downloadLink.innerHTML = '';
        
        if (!originalFile) return;

        // Convert slider value to bytes
        const maxBytes = parseInt(sizeSlider.value) * 1024; // Convert KB to bytes

        // Compress with progress feedback
        compressBtn.textContent = 'Compressing...';
        const { blob, quality } = await compressToMaxSize(originalFile, maxBytes);
        compressBtn.textContent = 'Compress Now';

        // Show results
        const originalKB = (originalFile.size / 1024).toFixed(1);
        const compressedKB = (blob.size / 1024).toFixed(1);
        
        document.getElementById('originalSize').textContent = `${originalKB} KB`;
        document.getElementById('compressedSize').innerHTML = 
         `<strong>${compressedKB} KB</strong> (${Math.round(quality * 100)}% Quality)`;

        // Update size displays
        const compressedSizeElement = document.getElementById('compressedSize');
        if (compressedSizeElement) {
            compressedSizeElement.textContent = 
                `${compressedKB} KB (${Math.round(quality * 100)}% Quality)`;
        }

        const originalSizeElement = document.getElementById('originalSize');
        if (originalSizeElement) {
            originalSizeElement.textContent = `${originalKB} KB`;
        }

        // Create filename
        const originalName = originalFile.name;
        const dotIndex = originalName.lastIndexOf('.');
        let compressedName;
        
        if (dotIndex === -1) {
            compressedName = `${originalName}-compressed.jpg`;
        } else {
            compressedName = `${originalName.substring(0, dotIndex)}-compressed.jpg`;
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = compressedName;
        link.textContent = 'Download Compressed Image';
        downloadLink.appendChild(link);
        
        // Update stats (fixed variable name)
        const compressedSize = document.getElementById('estimatedSize');
        if (compressedSize) {
            compressedSize.textContent = formatBytes(blob.size);
        }
    } catch (error) {
        console.error('Error during compression:', error);
        const downloadLink = document.getElementById('downloadLink');
        if (downloadLink) {
            downloadLink.textContent = 'Error during compression. Please try again.';
        }
    }
});

// Keep existing drag-drop/file input logic
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

// Update file handler
function handleFile(file) {
    if (file && file.type.startsWith('image/')) {
        originalFile = file;
        compressBtn.disabled = false;
        showPreview(file);
        document.getElementById('originalSize').textContent = 
            `${(file.size / 1024).toFixed(1)} KB`;
        updateEstimatedSize();
    }
}

// Add modal handlers
privacyLink.addEventListener('click', (e) => {
    e.preventDefault();
    privacyModal.style.display = 'block';
});

modalClose.addEventListener('click', () => {
    privacyModal.style.display = 'none';
});

faqLink.addEventListener('click', (e) => {
    e.preventDefault();
    faqModal.style.display = 'block';
});

faqModalClose.addEventListener('click', () => {
    faqModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === privacyModal) {
        privacyModal.style.display = 'none';
    }
    if (e.target === faqModal) {
        faqModal.style.display = 'none';
    }
});