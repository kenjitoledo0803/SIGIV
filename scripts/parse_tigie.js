const fs = require('fs');
const xlsx = require('xlsx');

// Configuration
const excelPath = "C:\\Users\\toledok\\Downloads\\TIGIECOMPLETA13072022-TIGIEVIGENTE_20220713-20220713.xlsx";
const outPath = "./scripts/parsed_db.json";

// The codes
const rawCodes = [
    "20098999", "2918140100", "2915609999", "2902199901", "3301299999", "2906110100", "2917199999", "3302109900", "2106900300",
    "2932199901", "2915909999", "2915399999", "2915609901", "2918999999", "3301900100", "2905299901", "2932201199",
    "2938909902", "2934100999", "2914500499", "3301199901", "3301299901", "3301130201", "2106909999", "1302199900",
    "3302909900", "2932199999", "2915130100", "2906199901", "2912420100", "2918301001", "909320100", "2101119999",
    "2914199999", "3203000399", "3301259100", "2901299900", "2008999900", "2912299901", "2912199902", "2932999901",
    "903000100", "1516200100", "3301120100", "3104200100", "1301200100", "2930909905", "1102909901", "2915509901",
    "2912410100", "904120100", "2915600100", "2914400100", "2922499900", "907200100", "2918159900", "3301909900",
    "2101200100", "2911000400", "2912199999", "2827100100", "2916199999", "2936270201", "1102909999", "2934999999",
    "2924299904", "2905220603", "2915509999", "2906210100", "3806300301", "3301190702", "2909509999", "2924199900",
    "2915110100", "2914230301", "2938909999", "2940000501", "2932120100", "2839900401", "2914409900", "2915900300",
    "2917199902", "3807000100", "3824999999", "2918239101", "2918301099", "2916200599", "3910009900", "1901900500",
    "3302109100", "2918239199", "2910909900", "2103909900", "2914230302", "2907199999", "2914299900", "2835240100",
    "2918199900", "2905160399", "3204199999", "904220299", "1604209199", "2902909900", "2823000100", "25568",
    "2932140100", "3301130299", "2930909999", "2933399999", "2905130100", "2932130100", "1515909900", "712909901",
    "2836999999", "2915299999", "2912499999", "2905149101", "1702909900", "2917190800", "2923909901", "2915210100",
    "712909999", "2916399999", "2915900600"
];

async function run() {
    console.log("Reading Excel file...");
    try {
        const workbook = xlsx.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

        console.log("Excel parsed. Total rows:", rows.length);

        let mapFull = {};
        let mapBase = {};

        for (let row of rows) {
            let baseArray = Object.keys(row).filter(k => k.toUpperCase().includes('FRACC') && k.toUpperCase().includes('ARANCEL'));
            let fracKey = baseArray.length > 0 ? baseArray[0] : null;
            let baseCode = fracKey ? String(row[fracKey]).replace(/\\./g, "").trim() : "";
            if (baseCode.length === 7) baseCode = "0" + baseCode; // missing leading zero in excel sometimes

            let nicoKey = Object.keys(row).filter(k => k.toUpperCase() === 'NICO');
            let nicoId = nicoKey.length > 0 ? String(row[nicoKey[0]]).trim() : "00";
            if (nicoId.length === 1) nicoId = "0" + nicoId;

            let descKey = Object.keys(row).filter(k => k.toUpperCase().includes('DESCRIP'));
            let igiKey = Object.keys(row).filter(k => k.toUpperCase() === 'IGI');

            let record = {
                desc: descKey.length > 0 ? row[descKey[0]] : "",
                igi: igiKey.length > 0 ? row[igiKey[0]] : ""
            };

            if (baseCode.length >= 8) {
                mapFull[baseCode + nicoId] = record;
                if (!mapBase[baseCode]) mapBase[baseCode] = record;
            } else if (baseCode.length > 0) {
                mapBase[baseCode] = record;
            }
        }

        console.log("Dictionary index built. Matching specific HS Codes...");

        const EXPLICIT_DB = [
            {
                "code": "8471.30.01",
                "description": "Máquinas automáticas para tratamiento o procesamiento de datos, portátiles...",
                "arancel_igi": "Exento",
                "iva": "16%",
                "raw_rrna_snippets": [
                    "A la Importación: NOM-019-SECRE-2016",
                    "TLCAN/T-MEC: Exento (0% IGI) con Certificado de Origen válido.",
                    "ALADI: Preferencia Arancelaria 100% (Exento) para Colombia, Chile."
                ],
                "siicex_url": "http://www.siicex-caaarem.org.mx/Bases/TIGIE2020.nsf/4caa80bd19e9258406256b050078593c/84713001"
            },
            {
                "code": "3926.90.99",
                "description": "Las demás manufacturas de plástico y manufacturas de las demás materias de las partidas 39.01 a 39.14.",
                "arancel_igi": "10%",
                "iva": "16%",
                "raw_rrna_snippets": ["A la Importación: NOM-050-SCFI-2004"],
                "siicex_url": "http://www.siicex-caaarem.org.mx/"
            }
        ];

        let finalDbMap = {};
        for (let entry of EXPLICIT_DB) {
            finalDbMap[entry.code.replace(/\\./g, '')] = entry;
        }

        for (let code of rawCodes) {
            let c = String(code).replace(/\\./g, "").trim();
            if (c.length === 7) c = "0" + c;

            if (finalDbMap[c]) continue;

            let matched = mapFull[c] || mapBase[c.substring(0, 8)];
            if (!matched && c.length === 5) matched = mapBase["0" + c + "00"];

            let formattedCode = c;
            if (c.length >= 8) {
                formattedCode = c.substring(0, 4) + "." + c.substring(4, 6) + "." + c.substring(6, 8);
                if (c.length > 8) formattedCode += "." + c.substring(8);
            }

            let desc = matched && matched.desc ? String(matched.desc).trim() : "Fracción no localizada en el Excel oficial.";
            let igi = matched && matched.igi !== undefined && String(matched.igi).trim() !== "" ? String(matched.igi).trim() : "Consultar DOF";
            if (igi === "Ex." || igi === "Ex") igi = "Exento";

            finalDbMap[c] = {
                code: formattedCode,
                description: desc,
                arancel_igi: igi === "Consultar DOF" ? igi : (String(igi).includes("%") || String(igi).toLowerCase().includes("exento") ? igi : igi + "%"),
                iva: "16% (Sujeto a LIVA)",
                raw_rrna_snippets: [
                    "Datos base (Descripción e IGI) extraídos de Excel TIGIE oficial."
                ],
                siicex_url: "http://www.siicex-caaarem.org.mx/Bases/TIGIE2020.nsf/4caa80bd19e9258406256b050078593c/" + c.substring(0, 8)
            };
        }

        const finalArray = Object.values(finalDbMap);
        fs.writeFileSync(outPath, JSON.stringify(finalArray, null, 4), 'utf8');
        console.log("Successfully mapped and generated", finalArray.length, "objects.");

    } catch (err) {
        console.error("Failed to parse", err);
    }
}

run();
