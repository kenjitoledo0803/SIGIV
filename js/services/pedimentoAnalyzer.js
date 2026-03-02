export class PedimentoAnalyzer {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
    }

    async extractText(pdfUrl) {
        try {
            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += `--- Página ${i} ---\n${pageText}\n`;
            }
            return fullText;
        } catch (error) {
            console.error('Error extracting text from PDF:', error);
            throw new Error('No se pudo extraer el texto del PDF. Asegúrate de que no sea una imagen escaneada.');
        }
    }

    async analyze(pdfUrl) {
        const text = await this.extractText(pdfUrl);

        const systemPrompt = `
            Eres un experto en comercio exterior y aduanas de México. Tu tarea es analizar el texto extraído de un Pedimento Aduanal y validar su corrección fiscal y normativa.
            
            CRITERIOS DE REVISIÓN:
            1. Datos Generales: Tipo de operación, Aduana, Fechas, RFCs, Incoterms, Moneda.
            2. Fracciones Arancelarias: Coherencia con descripción, cumplimiento de tratados (T-MEC, etc.).
            3. IGI (Impuesto General de Importación): Tasa correcta, aplicación de preferencias, cálculo correcto (Base x Tasa).
            4. IVA: Tasa correcta (16% o 0%), base correcta (Valor Aduana + IGI + DTA), cálculo aritmético.
            5. Tratados y Preferencias: Verificar si se aplicaron correctamente las preferencias (Claves TL, etc.).
            6. Coherencia: Sumas totales (Valor Aduana, Contribuciones), unidades de medida.

            FORMATO DE RESPUESTA (JSON ESTRICTO):
            Debes responder ÚNICAMENTE con un objeto JSON válido. No incluyas markdown (\`\`\`json), ni texto adicional antes o después.
            Estructura requerida:
            {
                "generalStatus": "CORRECTO" | "CON OBSERVACIONES" | "CRÍTICO",
                "summary": "Resumen ejecutivo de 1-2 oraciones.",
                "findings": [
                    {
                        "item": "Identificador (ej. Partida 1, Encabezado)",
                        "type": "IGI" | "IVA" | "Tratado" | "Datos Generales" | "Otros",
                        "description": "Descripción clara del hallazgo o error.",
                        "risk": "Bajo" | "Medio" | "Alto",
                        "recommendation": "Acción sugerida."
                    }
                ],
                "conclusion": {
                    "status": "Correcto" | "Requiere Correcciones",
                    "actions": ["Lista de acciones recomendadas"]
                }
            }

            Si falta información crítica para validar algo, indícalo en "findings" como una observación, no inventes datos.
        `;

        const requestBody = {
            contents: [{
                parts: [{
                    text: `${systemPrompt}\n\nTEXTO DEL PEDIMENTO:\n${text}`
                }]
            }],
            generationConfig: {
                temperature: 0.2,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
            }
        };

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error de API Gemini: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const rawText = data.candidates[0].content.parts[0].text;

            // Clean Markdown if present
            const jsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(jsonString);

        } catch (error) {
            console.error('Error en análisis de IA:', error);
            throw error;
        }
    }
}
