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

// Add progress feedback function
function updateProgress(progress) {
    const progressBar = document.querySelector('.progress-bar');
    const progressFill = document.querySelector('.progress-bar-fill');
    
    if (progress === 0 || progress === 100) {
        progressBar.style.display = 'none';
    } else {
        progressBar.style.display = 'block';
        progressFill.style.width = `${progress}%`;
    }
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
        updateProgress(0);
        compressBtn.disabled = true;
        document.querySelector('.btn-text').style.display = 'none';
        document.querySelector('.btn-loading').style.display = 'inline-block';
        
        const { blob, quality } = await compressToMaxSize(originalFile, maxBytes);
        
        updateProgress(100);
        compressBtn.disabled = false;
        document.querySelector('.btn-text').style.display = 'inline-block';
        document.querySelector('.btn-loading').style.display = 'none';

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
    handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

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

// Add drag and drop visual feedback
const dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragenter', () => dropZone.classList.add('drag-over'));
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', () => dropZone.classList.remove('drag-over'));

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

// ...existing variables and utility functions...

// Simplified file handling
function handleFiles(files) {
    const file = files[0]; // Only handle first file
    if (!file || !file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    // Reset UI
    originalFile = file;
    document.querySelector('.stats').style.display = 'block';
    document.getElementById('downloadLink').style.display = 'none';
    compressBtn.disabled = false;
    compressBtn.textContent = 'Compress Image';
    
    // Update preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        previewContainer.style.display = 'block';
        
        // Update stats
        document.getElementById('originalSize').textContent = formatBytes(file.size);
        updateEstimatedSize();
        
        // Enable compression
        compressBtn.style.display = 'block';
        compressBtn.disabled = false;
        compressBtn.textContent = 'Compress Image';
    };
    reader.readAsDataURL(file);
}

// Remove old event listeners and simplify
function initializeEventListeners() {
    // Clear any existing listeners
    fileInput.removeEventListener('change', handleFiles);
    document.removeEventListener('drop', handleFiles);
    
    // Add fresh listeners
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    });

    // Drag and drop visual feedback
    dropZone.addEventListener('dragenter', () => dropZone.classList.add('drag-over'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', () => dropZone.classList.remove('drag-over'));
}

// Initialize event listeners
initializeEventListeners();

// Remove these functions as they're no longer needed
// showPreview()
// handleFile()

// Simplify compress button handler
compressBtn.addEventListener('click', async () => {
    if (!originalFile) return;
    
    try {
        compressBtn.disabled = true;
        compressBtn.textContent = 'Compressing...';
        
        const maxBytes = parseInt(sizeSlider.value) * 1024;
        const { blob, quality } = await compressToMaxSize(originalFile, maxBytes);
        
        // Update stats
        document.getElementById('originalSize').textContent = formatBytes(originalFile.size);
        document.getElementById('compressedSize').textContent = 
            `${formatBytes(blob.size)} (${Math.round(quality * 100)}% quality)`;
        document.getElementById('estimatedSize').textContent = formatBytes(blob.size);
        
        // Create download link
        const downloadLink = document.getElementById('downloadLink');
        downloadLink.innerHTML = '';
        downloadLink.style.display = 'block';
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = createCompressedFilename(originalFile.name);
        link.className = 'download-btn';
        link.textContent = 'Download Compressed Image';
        downloadLink.appendChild(link);
        
        compressBtn.textContent = 'Compress Image';
        compressBtn.disabled = false;
    } catch (error) {
        console.error('Error:', error);
        compressBtn.textContent = 'Error - Try Again';
        compressBtn.disabled = false;
    }
});

// Keep only these essential functions and remove duplicates
function createCompressedFilename(originalName) {
    const dotIndex = originalName.lastIndexOf('.');
    return dotIndex === -1 ? 
        `${originalName}-compressed.jpg` : 
        `${originalName.substring(0, dotIndex)}-compressed.jpg`;
}

// Initialize event listeners
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
});

// ...rest of existing code...