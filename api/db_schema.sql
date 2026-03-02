-- IMS Database Schema

CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    payment_terms VARCHAR(100),
    bank_details TEXT
);

CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR(36) PRIMARY KEY,
    sku VARCHAR(100) NOT NULL,
    description TEXT,
    hs_code VARCHAR(50),
    nico VARCHAR(50),
    cas_number VARCHAR(50),
    is_hazardous BOOLEAN DEFAULT FALSE,
    uom VARCHAR(20),
    supplier_id VARCHAR(36),
    regulations TEXT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);



CREATE TABLE IF NOT EXISTS consolidations (
    id VARCHAR(36) PRIMARY KEY,
    reference VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'ABIERTO',
    description TEXT,
    created_at DATETIME,
    plant_arrival_date DATE
);

CREATE TABLE IF NOT EXISTS shipments (
    id VARCHAR(36) PRIMARY KEY,
    reference VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'ABIERTO',
    consolidation_id VARCHAR(36),
    created_at DATETIME,
    plant_arrival_date DATE,
    FOREIGN KEY (consolidation_id) REFERENCES consolidations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS import_files (
    id VARCHAR(36) PRIMARY KEY,
    reference_number VARCHAR(100) NOT NULL, -- PO Number
    shipment_id VARCHAR(36),
    supplier_id VARCHAR(36),
    status VARCHAR(50) DEFAULT 'DOCUMENTACION',
    eta DATE,
    ata DATE,
    pedimento VARCHAR(50),
    customs_broker VARCHAR(100),
    regulatory_status VARCHAR(50) DEFAULT 'PENDING',
    created_at DATETIME,
    incoterms VARCHAR(50),
    incoterms_place VARCHAR(100),
    country_origin VARCHAR(100),
    net_order_value DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    gross_weight DECIMAL(15, 2) DEFAULT 0,
    document_date DATE,
    mot VARCHAR(50),
    plant_arrival_date DATE,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(36) PRIMARY KEY,
    parent_id VARCHAR(36) NOT NULL,
    parent_type VARCHAR(20) NOT NULL, -- 'FILE', 'SHIPMENT'
    name VARCHAR(255),
    url LONGTEXT,
    type VARCHAR(50),
    date DATETIME,
    INDEX (parent_id, parent_type)
);

CREATE TABLE IF NOT EXISTS costs (
    id VARCHAR(36) PRIMARY KEY,
    parent_id VARCHAR(36) NOT NULL,
    parent_type VARCHAR(20) NOT NULL, -- 'FILE', 'SHIPMENT'
    type VARCHAR(50),
    amount DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    exchange_rate DECIMAL(10, 4) DEFAULT 1,
    description TEXT,
    pdf_url LONGTEXT,
    file_name VARCHAR(255),
    INDEX (parent_id, parent_type)
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER', -- ADMIN, USER, VIEWER
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default Admin User (password: admin123)
INSERT INTO users (id, username, email, password_hash, role) VALUES 
('admin-uuid', 'admin', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN');

CREATE TABLE IF NOT EXISTS import_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    import_file_id VARCHAR(36),
    material_id VARCHAR(36),
    quantity DECIMAL(15,2),
    net_price DECIMAL(15,2),
    uom VARCHAR(20),
    INDEX (import_file_id),
    FOREIGN KEY (import_file_id) REFERENCES import_files(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS savings_projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'IDEA', -- IDEA, PLAN, EXECUTION, COMPLETED
    estimated_savings DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    owner VARCHAR(100),
    progress INT DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS savings_entries (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    date DATE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES savings_projects(id) ON DELETE CASCADE,
    INDEX (project_id)
);

-- ROBUST FEATURES
-- 1. Categories (Added to savings_projects via ALTER in script)

-- 2. Audit Log
CREATE TABLE IF NOT EXISTS savings_logs (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, STATUS_CHANGE
    details TEXT,
    user VARCHAR(100), -- Who did it
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES savings_projects(id) ON DELETE CASCADE,
    INDEX (project_id)
);

-- 3. Documents
CREATE TABLE IF NOT EXISTS savings_documents (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    uploaded_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES savings_projects(id) ON DELETE CASCADE,
    INDEX (project_id)
);
