const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const imagePreview = document.getElementById('imagePreview');
const sizeSlider = document.getElementById('sizeSlider');
const sizeValue = document.getElementById('sizeValue');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const compressBtn = document.getElementById('compressBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

let originalFile = null;
let compressedBlob = null;

// File input handlers
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-blue-500');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('border-blue-500'));
dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-blue-500');
    handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

sizeSlider.addEventListener('input', () => {
    sizeValue.textContent = `${sizeSlider.value} KB`;
});

compressBtn.addEventListener('click', () => {
    if (!originalFile) return;
    
    compressBtn.disabled = true;
    compressBtn.innerHTML = 'Compressing...';

    const targetQuality = Math.max(0.1, Math.min(0.9, sizeSlider.value * 1024 / originalFile.size));

    new Compressor(originalFile, {
        quality: targetQuality,
        success(result) {
            compressedBlob = result;
            const compressedSizeKB = Math.round(result.size / 1024);
            compressedSize.textContent = `${compressedSizeKB} KB`;
            downloadBtn.classList.remove('hidden');
            compressBtn.disabled = false;
            compressBtn.innerHTML = 'Compress Image';
        },
        error(err) {
            console.error(err.message);
            alert('Compression failed. Please try again.');
            compressBtn.disabled = false;
            compressBtn.innerHTML = 'Compress Image';
        }
    });
});

downloadBtn.addEventListener('click', () => {
    const url = URL.createObjectURL(compressedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = originalFile.name.replace(/(\.[\w\d_-]+)$/i, '-compressed$1');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});

resetBtn.addEventListener('click', () => {
    fileInput.value = '';
    previewSection.classList.add('hidden');
    originalSize.textContent = '-';
    compressedSize.textContent = '-';
    downloadBtn.classList.add('hidden');
    compressedBlob = null;
    originalFile = null;
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    originalFile = file;
    originalSize.textContent = `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        previewSection.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}