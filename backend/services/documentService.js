const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class DocumentService {
  constructor() {
    this.uploadDir = 'uploads/documents';
    this.ensureUploadDir();
  }

  async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  // Configure multer for file uploads
  getUploadMiddleware() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });

    const fileFilter = (req, file, cb) => {
      // Allow only specific file types
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'), false);
      }
    };

    return multer({
      storage: storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Maximum 5 files per request
      }
    });
  }

  // Validate document type based on user type
  validateDocumentType(userType, documentType) {
    const validDocuments = {
      entrepreneur: ['business_registration', 'pitch_deck', 'passport', 'driving_license', 'national_id'],
      investor: ['proof_of_funds', 'intent_letter', 'passport', 'driving_license', 'national_id'],
      both: ['business_registration', 'pitch_deck', 'proof_of_funds', 'intent_letter', 'passport', 'driving_license', 'national_id']
    };

    return validDocuments[userType]?.includes(documentType) || false;
  }

  // Get required documents for user type
  getRequiredDocuments(userType) {
    const requiredDocs = {
      entrepreneur: [
        { type: 'business_registration', name: 'Business Registration', required: true },
        { type: 'pitch_deck', name: 'Pitch Deck', required: true },
        { type: 'passport', name: 'Passport/ID', required: true }
      ],
      investor: [
        { type: 'proof_of_funds', name: 'Proof of Funds', required: true },
        { type: 'intent_letter', name: 'Intent Letter', required: true },
        { type: 'passport', name: 'Passport/ID', required: true }
      ],
      both: [
        { type: 'business_registration', name: 'Business Registration', required: false },
        { type: 'pitch_deck', name: 'Pitch Deck', required: false },
        { type: 'proof_of_funds', name: 'Proof of Funds', required: true },
        { type: 'intent_letter', name: 'Intent Letter', required: true },
        { type: 'passport', name: 'Passport/ID', required: true }
      ]
    };

    return requiredDocs[userType] || [];
  }

  // Process uploaded documents
  async processUploadedDocuments(files, userId, userType) {
    const processedDocs = [];

    for (const file of files) {
      const documentType = file.fieldname; // Assuming fieldname contains document type
      
      if (!this.validateDocumentType(userType, documentType)) {
        throw new Error(`Invalid document type: ${documentType} for user type: ${userType}`);
      }

      const docInfo = {
        type: documentType,
        name: file.originalname,
        url: `/uploads/documents/${file.filename}`,
        uploadedAt: new Date(),
        status: 'pending'
      };

      processedDocs.push(docInfo);
    }

    return processedDocs;
  }

  // Delete document file
  async deleteDocumentFile(filename) {
    try {
      const filePath = path.join(this.uploadDir, filename);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting document file:', error);
      return false;
    }
  }

  // Get document status summary
  getDocumentStatusSummary(documents, userType) {
    const requiredDocs = this.getRequiredDocuments(userType);
    const uploadedDocs = documents || [];
    
    const summary = {
      total: requiredDocs.length,
      uploaded: uploadedDocs.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      missing: []
    };

    // Count uploaded documents by status
    uploadedDocs.forEach(doc => {
      switch (doc.status) {
        case 'pending':
          summary.pending++;
          break;
        case 'approved':
          summary.approved++;
          break;
        case 'rejected':
          summary.rejected++;
          break;
      }
    });

    // Find missing required documents
    requiredDocs.forEach(reqDoc => {
      if (reqDoc.required) {
        const found = uploadedDocs.find(doc => doc.type === reqDoc.type);
        if (!found) {
          summary.missing.push(reqDoc);
        }
      }
    });

    return summary;
  }

  // Validate document completeness
  isDocumentationComplete(documents, userType) {
    const summary = this.getDocumentStatusSummary(documents, userType);
    const requiredDocs = this.getRequiredDocuments(userType);
    const requiredCount = requiredDocs.filter(doc => doc.required).length;
    
    return summary.approved >= requiredCount;
  }

  // Generate document upload form fields
  generateUploadFields(userType) {
    const requiredDocs = this.getRequiredDocuments(userType);
    
    return requiredDocs.map(doc => ({
      name: doc.type,
      label: doc.name,
      required: doc.required,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: '10MB'
    }));
  }
}

module.exports = new DocumentService();