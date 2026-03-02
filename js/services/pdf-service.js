export class PdfParseService {
    constructor() {
        this.costPatterns = [
            // Taxes
            { key: 'IVA_PEDIMENTO', label: 'IVA Pedimento', patterns: [/IVA\s*Pedimento/i, /I\.V\.A\.\s*Pedimento/i] },
            { key: 'IEPS', label: 'IEPS', patterns: [/IEPS/i] },
            { key: 'DTA', label: 'DTA', patterns: [/DTA/i, /Derecho\s*Trámite\s*Aduanero/i] },
            { key: 'IGI', label: 'IGI', patterns: [/IGI/i, /Impuesto\s*General\s*Importación/i] },
            { key: 'PREVALIDACION', label: 'Prevalidación', patterns: [/Prevalidaci[oó]n/i] },

            // Logistics
            { key: 'FLETE_INT', label: 'Flete Internacional', patterns: [/Flete\s*Internacional/i, /International\s*Freight/i] },
            { key: 'FLETE_NAC', label: 'Flete Nacional', patterns: [/Flete\s*Nacional/i, /Transporte\s*Nacional/i] },
            { key: 'TRANSFER', label: 'Transfer', patterns: [/Transfer/i, /Cruce/i] },
            { key: 'SERV_LOGISTICO', label: 'Servicio Logístico', patterns: [/Servicio\s*Log[ií]stico/i, /Logistics\s*Service/i] },
            { key: 'MANIOBRAS', label: 'Maniobras', patterns: [/Maniobras/i, /Handling/i] },
            { key: 'ALMACENAJES', label: 'Almacenajes', patterns: [/Almacenaje/i, /Storage/i] },
            { key: 'DEMORAS', label: 'Demoras', patterns: [/Demoras/i, /Demurrage/i] },
            { key: 'DESCONSOLIDACION', label: 'Desconsolidación', patterns: [/Desconsolidaci[oó]n/i] },

            // Customs / Admin
            { key: 'HONORARIOS', label: 'Honorarios', patterns: [/Honorarios/i] },
            { key: 'ADUANA', label: 'Aduana', patterns: [/Gastos\s*Aduanales/i] },
            { key: 'CUSTOM', label: 'Custom', patterns: [/Custom/i] },
            { key: 'GASTOS_NO_COMP', label: 'Gastos no Comprobables', patterns: [/Gastos\s*no\s*Comprobables/i] },
            { key: 'OTROS_INC', label: 'Otros Incrementables', patterns: [/Otros\s*Incrementables/i] },
            { key: 'INSPECCION', label: 'Inspección', patterns: [/Inspecci[oó]n/i] },
            { key: 'RECONOCIMIENTO', label: 'Reconocimiento', patterns: [/Reconocimiento/i, /Previo/i] },
            { key: 'SEGURO', label: 'Seguro', patterns: [/Seguro/i, /Insurance/i] },
            { key: 'SERVICIO', label: 'Servicio', patterns: [/Servicio/i] },
            { key: 'LIMPIEZA', label: 'Limpieza de Contenedor', patterns: [/Limpieza.*Contenedor/i] }
        ];
    }

    async extractText(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        return fullText;
    }

    parseCosts(text) {
        const foundCosts = [];
        const lines = text.split('\n');

        // Strategy: Look for keywords and find the nearest number in the same line or adjacent context
        // This is a heuristic approach.

        // Normalize text for easier matching
        // We keep the original for value extraction to preserve formatting if needed, 
        // but for now we'll just regex match on the raw string.

        this.costPatterns.forEach(category => {
            category.patterns.forEach(pattern => {
                // Regex to find the pattern and a monetary value nearby
                // Matches: Pattern ... $1,234.56 or 1234.56
                const regex = new RegExp(`(${pattern.source}).{0,50}?(\\d{1,3}(?:,\\d{3})*(?:\\.\\d{2})?)`, 'gi');

                let match;
                while ((match = regex.exec(text)) !== null) {
                    // match[2] is the amount
                    const rawAmount = match[2].replace(/,/g, '');
                    const amount = parseFloat(rawAmount);

                    if (!isNaN(amount)) {
                        foundCosts.push({
                            type: category.key,
                            label: category.label,
                            amount: amount,
                            originalMatch: match[0]
                        });
                    }
                }
            });
        });

        // Deduplicate: If multiple patterns match the same text, keep one. 
        // Or if the same amount is found for the same category multiple times.
        // For now, we return all and let the user filter.
        return foundCosts;
    }
}
