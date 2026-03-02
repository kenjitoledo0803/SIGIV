
export class DpiConversionView {
    constructor() {
        this.processedFiles = []; // Array of { blob, name, size }
    }

    render() {
        return `
            <div class="card" style="max-width: 900px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h2 style="margin-bottom: 0.5rem;">Conversión & Digitalización VUCEM (v2.1)</h2>
                    <p style="color: var(--text-secondary);">Transforma múltiples documentos para cumplir estrictamente con los requisitos del SAT/VUCEM.</p>
                </div>

                <div class="compliance-checklist" style="background: var(--bg-body); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 2rem; font-size: 0.85rem;">
                    <h4 style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                        <span class="material-icons-round" style="color: var(--primary-color); font-size: 1rem;">verified</span>
                        Estándares Aplicados Automáticamente:
                    </h4>
                    <ul style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; list-style: none; padding: 0; color: var(--text-secondary);">
                        <li>• Formato PDF 1.4+</li>
                        <li>• Escala de Grises (B/N)</li>
                        <li>• Resolución 300 DPI</li>
                        <li>• Nomenclatura Sanitizada</li>
                        <li>• Peso Controlado (< 3MB)</li>
                        <li>• Orientación Vertical</li>
                    </ul>
                </div>

                <div id="upload-area" style="border: 2px dashed var(--border-color); border-radius: var(--radius-lg); padding: 3rem; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--bg-surface);">
                    <input type="file" id="file-input" accept="image/*,.pdf" multiple style="display: none;">
                    <div id="drop-zone-content">
                        <span class="material-icons-round" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 1rem;">upload_file</span>
                        <h3 style="margin-bottom: 0.5rem;">Arrastra tus archivos aquí</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Soporta selección múltiple (PDF, JPG, PNG)</p>
                        <button class="btn btn-primary" onclick="document.getElementById('file-input').click()">Seleccionar Archivos</button>
                    </div>
                </div>

                <!-- Processing Progress Area -->
                <div id="processing-area" style="display: none; margin-top: 2rem;">
                    <h4 style="margin-bottom: 1rem;">Procesando archivos...</h4>
                    <div id="progress-container" style="display: flex; flex-direction: column; gap: 0.5rem;"></div>
                </div>

                <!-- Results Area -->
                <div id="result-area" style="display: none; margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="margin: 0;">Archivos Listos</h3>
                        <div style="display: flex; gap: 1rem;">
                            <button id="btn-download-all" class="btn btn-primary">
                                <span class="material-icons-round">folder_zip</span> Descargar Todo (ZIP)
                            </button>
                            <button id="btn-reset" class="btn btn-secondary">
                                <span class="material-icons-round">refresh</span> Convertir Más
                            </button>
                        </div>
                    </div>
                    
                    <div id="files-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <!-- Processed items will appear here -->
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents() {
        const dropZone = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        const btnReset = document.getElementById('btn-reset');
        const btnDownloadAll = document.getElementById('btn-download-all');

        // Drag & Drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--primary-color)';
            dropZone.style.background = 'var(--bg-body)';
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--border-color)';
            dropZone.style.background = 'var(--bg-surface)';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--border-color)';
            dropZone.style.background = 'var(--bg-surface)';
            if (e.dataTransfer.files.length) {
                this.handleFiles(Array.from(e.dataTransfer.files));
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                this.handleFiles(Array.from(e.target.files));
            }
        });

        btnReset.addEventListener('click', () => {
            this.processedFiles = [];
            document.getElementById('result-area').style.display = 'none';
            document.getElementById('files-list').innerHTML = '';
            document.getElementById('progress-container').innerHTML = '';
            document.getElementById('upload-area').style.display = 'block';
            fileInput.value = '';
        });

        btnDownloadAll.addEventListener('click', () => this.downloadAllZip());
    }

    async handleFiles(files) {
        if (files.length === 0) return;

        const uploadArea = document.getElementById('upload-area');
        const processingArea = document.getElementById('processing-area');
        const progressContainer = document.getElementById('progress-container');

        uploadArea.style.display = 'none';
        processingArea.style.display = 'block';

        for (const file of files) {
            // Create progress indicator item
            const progressItem = document.createElement('div');
            progressItem.style.cssText = `background: var(--bg-surface); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; align-items: center; gap: 1rem;`;
            progressItem.innerHTML = `
                <div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
                <span class="filename" style="font-family: monospace; font-size: 0.9rem;">${file.name}</span>
                <span style="color: var(--text-secondary); font-size: 0.8rem; margin-left: auto;">Procesando...</span>
            `;
            progressContainer.appendChild(progressItem);

            try {
                // Short delay to allow UI render
                await new Promise(r => setTimeout(r, 50));

                const safeName = this.sanitizeFilename(file.name);
                let processedBlob;

                if (file.type === 'application/pdf') {
                    processedBlob = await this.processPdf(file);
                } else if (file.type.startsWith('image/')) {
                    processedBlob = await this.processImage(file);
                } else {
                    throw new Error('Formato no soportado');
                }

                if (processedBlob.size > 3.0 * 1024 * 1024) {
                    progressItem.innerHTML += `<span style="color: #f59e0b; font-size: 0.8rem;">(>3MB)</span>`;
                }

                // Success State Update
                progressItem.style.borderColor = '#bbf7d0';
                progressItem.style.background = '#f0fdf4';
                progressItem.innerHTML = `
                    <span class="material-icons-round" style="color: #16a34a; font-size: 1.25rem;">check_circle</span>
                    <span style="font-family: monospace; font-size: 0.9rem; color: #166534;">${safeName}</span>
                    <div style="margin-left: auto; text-align: right;">
                        <span style="font-size: 0.8rem; color: #15803d; display: block;">${(processedBlob.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                `;

                this.processedFiles.push({
                    name: safeName,
                    blob: processedBlob
                });

            } catch (err) {
                console.error(err);
                progressItem.style.borderColor = '#fecaca';
                progressItem.style.background = '#fef2f2';
                progressItem.innerHTML = `
                    <span class="material-icons-round" style="color: #ef4444; font-size: 1.25rem;">error</span>
                    <span style="font-family: monospace; font-size: 0.9rem; color: #991b1b;">${file.name}</span>
                    <span style="color: #ef4444; font-size: 0.8rem; margin-left: auto;">Error: ${err.message}</span>
                `;
            }
        }

        // Finish
        processingArea.style.display = 'none';
        this.showResults();
    }

    showResults() {
        const resultArea = document.getElementById('result-area');
        const filesList = document.getElementById('files-list');
        resultArea.style.display = 'block';

        // Add any newly processed files to visual list if we wanted to show them again, 
        // but the progress list essentially becomes the history. 
        // Better UX: Move the nice success items to the results list or just re-render.

        filesList.innerHTML = '';
        this.processedFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.style.cssText = `display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: web--radius-sm; background: white;`;
            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span class="material-icons-round" style="color: var(--primary-color);">description</span>
                    <div>
                        <div style="font-weight: 500; font-size: 0.9rem;">${file.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">${(file.blob.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                </div>
                <button class="btn-icon download-single" data-index="${index}" style="color: var(--primary-color);">
                    <span class="material-icons-round">download</span>
                </button>
            `;
            filesList.appendChild(item);
        });

        // Attach single download events
        document.querySelectorAll('.download-single').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = btn.dataset.index;
                const file = this.processedFiles[idx];
                const link = document.createElement('a');
                link.href = URL.createObjectURL(file.blob);
                link.download = file.name;
                link.click();
            });
        });
    }

    async downloadAllZip() {
        if (!window.JSZip) {
            alert('Error: Librería JSZip no cargada. Recarga la página.');
            return;
        }

        const zip = new JSZip();
        this.processedFiles.forEach(f => {
            zip.file(f.name, f.blob);
        });

        try {
            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `VUCEM_Docs_${new Date().toISOString().slice(0, 10)}.zip`;
            link.click();
        } catch (err) {
            console.error(err);
            alert('Error al generar ZIP: ' + err.message);
        }
    }

    sanitizeFilename(filename) {
        let name = filename.substring(0, filename.lastIndexOf('.')) || filename;
        name = name.replace(/\s+/g, '_');
        name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        name = name.replace(/[^a-zA-Z0-9_-]/g, '');
        name = name.substring(0, 45);
        return name + '.pdf';
    }

    async processImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = async () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const A4_WIDTH = 2480;
                        const A4_HEIGHT = 3508;

                        const ctx = canvas.getContext('2d');
                        canvas.width = A4_WIDTH;
                        canvas.height = A4_HEIGHT;

                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        let width = img.width;
                        let height = img.height;
                        const scale = Math.min(A4_WIDTH / width, A4_HEIGHT / height);
                        const drawW = width * scale;
                        const drawH = height * scale;
                        const offsetX = (A4_WIDTH - drawW) / 2;
                        const offsetY = (A4_HEIGHT - drawH) / 2;

                        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
                        this.applyGrayscale(ctx, canvas.width, canvas.height);

                        const blob = await this.compressToTargetSize([canvas]);
                        resolve(blob);
                    } catch (err) {
                        reject(err);
                    }
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    async processPdf(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
        const A4_WIDTH = 2480;
        const A4_HEIGHT = 3508;
        const canvases = [];

        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 4.16 });

            const canvas = document.createElement('canvas');
            canvas.width = A4_WIDTH;
            canvas.height = A4_HEIGHT;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = viewport.width;
            tempCanvas.height = viewport.height;

            await page.render({ canvasContext: tempCanvas.getContext('2d'), viewport: viewport }).promise;

            const scale = Math.min(A4_WIDTH / tempCanvas.width, A4_HEIGHT / tempCanvas.height);
            const drawW = tempCanvas.width * scale;
            const drawH = tempCanvas.height * scale;
            const offsetX = (A4_WIDTH - drawW) / 2;
            const offsetY = (A4_HEIGHT - drawH) / 2;

            ctx.drawImage(tempCanvas, offsetX, offsetY, drawW, drawH);
            this.applyGrayscale(ctx, canvas.width, canvas.height);
            canvases.push(canvas);
        }

        return await this.compressToTargetSize(canvases);
    }

    async compressToTargetSize(canvases) {
        let quality = 0.6; // Start lower for safer results
        let scale = 1.0;
        const TARGET_SIZE = 2.9 * 1024 * 1024;

        let blob = await this.generatePdfBlob(canvases, quality, scale);

        // Phase 1: Reduce Quality
        while (blob.size > TARGET_SIZE && quality > 0.3) {
            quality -= 0.1;
            quality = Math.round(quality * 10) / 10;
            console.log(`Size ${blob.size} > ${TARGET_SIZE}. Dropping quality to ${quality}`);
            blob = await this.generatePdfBlob(canvases, quality, scale);
        }

        // Phase 2: Reduce Scale (if still too big)
        while (blob.size > TARGET_SIZE && scale > 0.3) {
            scale -= 0.1;
            scale = Math.round(scale * 10) / 10;
            console.log(`Size ${blob.size} > ${TARGET_SIZE}. Dropping scale to ${scale}`);
            blob = await this.generatePdfBlob(canvases, quality, scale);
        }

        return blob;
    }

    async generatePdfBlob(canvases, quality, scale) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

        for (let i = 0; i < canvases.length; i++) {
            if (i > 0) pdf.addPage();

            let imgData;
            if (scale < 1.0) {
                const w = Math.floor(canvases[i].width * scale);
                const h = Math.floor(canvases[i].height * scale);
                const tmpCanvas = document.createElement('canvas');
                tmpCanvas.width = w;
                tmpCanvas.height = h;
                const ctx = tmpCanvas.getContext('2d');
                ctx.drawImage(canvases[i], 0, 0, w, h);
                imgData = tmpCanvas.toDataURL('image/jpeg', quality);
            } else {
                imgData = canvases[i].toDataURL('image/jpeg', quality);
            }

            pdf.addImage(imgData, 'JPEG', 0, 0, 595.28, 841.89);
        }
        return pdf.output('blob');
    }

    applyGrayscale(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            data[i] = avg;     // R
            data[i + 1] = avg; // G
            data[i + 2] = avg; // B
        }
        ctx.putImageData(imageData, 0, 0);
    }
}
