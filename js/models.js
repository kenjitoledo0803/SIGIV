/**
 * Data Models
 * Defines the structure for the application entities.
 */

export const ImportStatus = {
    // Standard Flow
    DOCUMENTACION: 'DOCUMENTACION',
    INSTRUCCION: 'INSTRUCCION',
    REFERENCIA: 'REFERENCIA',
    ETA: 'ETA',
    PREVIO_PEDIMENTO: 'PREVIO_PEDIMENTO',
    RECOLECCION: 'RECOLECCION',
    DESPACHO: 'DESPACHO',
    ARRIBO: 'ARRIBO',
    ARRIBO_DBS: 'ARRIBO_DBS',

    // Exceptions
    RETORNO: 'RETORNO',
    ABANDONO: 'ABANDONO',
    RECHAZO: 'RECHAZO',
    NO_LLEGO: 'NO_LLEGO',
    INSPECCION: 'INSPECCION',
    DETENIDA: 'DETENIDA'
};

export const CostCategories = {
    // Taxes
    IVA_PEDIMENTO: 'IVA Pedimento',
    IEPS: 'IEPS',
    DTA: 'DTA',
    IGI: 'IGI',
    PREVALIDACION: 'Prevalidación',

    // Logistics
    FLETE_INT: 'Flete Internacional',
    FLETE_NAC: 'Flete Nacional',
    TRANSFER: 'Transfer',
    SERV_LOGISTICO: 'Servicio Logístico',
    MANIOBRAS: 'Maniobras',
    ALMACENAJES: 'Almacenajes',
    DEMORAS: 'Demoras',
    DESCONSOLIDACION: 'Desconsolidación',

    // Customs / Admin
    HONORARIOS: 'Honorarios',
    ADUANA: 'Aduana',
    CUSTOM: 'Custom',
    GASTOS_NO_COMP: 'Gastos no Comprobables',
    OTROS_INC: 'Otros Incrementables',
    INSPECCION: 'Inspección',
    RECONOCIMIENTO: 'Reconocimiento',
    SEGURO: 'Seguro',
    SERVICIO: 'Servicio',
    LIMPIEZA: 'Limpieza de Contenedor',

    // Legacy / Generic
    INVOICE: 'INVOICE',
    OTROS: 'OTROS'
};

export class ImportFile {
    constructor({
        id = crypto.randomUUID(),
        referenceNumber, // Now represents PO Number
        shipmentId = null, // Link to parent Shipment
        supplierId,
        status = ImportStatus.DOCUMENTACION,
        eta = null,
        ata = null,
        pedimento = '',
        customsBroker = '',
        regulatoryStatus = 'PENDING', // PENDING, APPROVED, REJECTED
        createdAt = new Date().toISOString(),
        // New fields from Excel
        incoterms = '',
        incotermsPlace = '',
        countryOrigin = '',
        netOrderValue = 0,
        currency = 'USD',
        documentDate = null,
        mot = '',
        grossWeight = 0, // Total weight in KG
        plantArrivalDate = null, // New field
        items = [],
        documents = [],
        costs = []
    }) {
        this.id = id;
        this.referenceNumber = referenceNumber;
        this.shipmentId = shipmentId;
        this.supplierId = supplierId;
        this.status = status;
        this.eta = eta;
        this.ata = ata;
        this.pedimento = pedimento;
        this.customsBroker = customsBroker;
        this.regulatoryStatus = regulatoryStatus;
        this.createdAt = createdAt;

        // New fields
        this.incoterms = incoterms;
        this.incotermsPlace = incotermsPlace;
        this.countryOrigin = countryOrigin;
        this.netOrderValue = netOrderValue;
        this.grossWeight = grossWeight;
        this.currency = currency;
        this.documentDate = documentDate;
        this.mot = mot;
        this.plantArrivalDate = plantArrivalDate;

        this.items = items; // Array of ImportItem
        this.documents = documents; // Array of Document
        this.costs = costs; // Array of CostRecord
    }
}

export const ShipmentStatus = {
    ABIERTO: 'ABIERTO',
    OBSERVADO: 'OBSERVADO',
    CERRADO: 'CERRADO'
};

export const ConsolidationStatus = {
    ABIERTO: 'ABIERTO',
    CERRADO: 'CERRADO'
};

export class Shipment {
    constructor({
        id = crypto.randomUUID(),
        reference, // Shipment Reference (e.g. SH-2023-001)
        status = ShipmentStatus.ABIERTO,
        consolidationId = null, // Link to parent Consolidation
        createdAt = new Date().toISOString(),
        plantArrivalDate = null // New field
    }) {
        this.id = id;
        this.reference = reference;
        this.status = status;
        this.consolidationId = consolidationId;
        this.createdAt = createdAt;
        this.plantArrivalDate = plantArrivalDate;
        this.costs = []; // Shipment-level costs (e.g. consolidated freight)
        this.documents = []; // Shipment-level documents (e.g. Master BL)
    }
}

export class Consolidation {
    constructor({
        id = crypto.randomUUID(),
        reference, // e.g. CONS-2023-001
        status = ConsolidationStatus.ABIERTO,
        description = '',
        createdAt = new Date().toISOString(),
        plantArrivalDate = null // New field
    }) {
        this.id = id;
        this.reference = reference;
        this.status = status;
        this.description = description;
        this.createdAt = createdAt;
        this.plantArrivalDate = plantArrivalDate;
        this.costs = []; // Consolidation-level costs
    }
}

export class Supplier {
    constructor({
        id = crypto.randomUUID(),
        name,
        taxId,
        paymentTerms,
        bankDetails
    }) {
        this.id = id;
        this.name = name;
        this.taxId = taxId;
        this.paymentTerms = paymentTerms;
        this.bankDetails = bankDetails;
    }
}

export class Material {
    constructor({
        id = crypto.randomUUID(),
        sku,
        description,
        hsCode,
        nico = '',
        casNumber = '',
        regulations = '', // New field for permits/regulations
        isHazardous = false,
        uom,
        supplierId
    }) {
        this.id = id;
        this.sku = sku;
        this.description = description;
        this.hsCode = hsCode;
        this.nico = nico;
        this.casNumber = casNumber;
        this.regulations = regulations;
        this.isHazardous = isHazardous;
        this.uom = uom;
        this.supplierId = supplierId;
    }
}

export class CostRecord {
    constructor({
        id = crypto.randomUUID(),
        type, // INVOICE, FREIGHT, DUTIES, INSURANCE, OTHER
        amount,
        currency = 'USD',
        exchangeRate = 1.0,
        description = '',
        pdfUrl = null,
        fileName = null
    }) {
        this.id = id;
        this.type = type;
        this.amount = Number(amount);
        this.currency = currency;
        this.exchangeRate = Number(exchangeRate);
        this.description = description;
        this.pdfUrl = pdfUrl;
        this.fileName = fileName;
    }

    get localAmount() {
        return this.amount * this.exchangeRate;
    }
}
