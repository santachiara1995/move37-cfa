// CERFA PDF Generation Service using pdf-lib
import { PDFDocument, PDFForm, PDFTextField } from "pdf-lib";
import type { FilizContractData } from "./filizAdapter";

// Field mapping for CERFA 10103*10 form
// This would normally be loaded from a versioned JSON file
const FIELD_MAPPING_VERSION = "1.0.0";

const FIELD_MAPPING: Record<string, (data: FilizContractData) => string> = {
  // Apprentice information
  "apprentice_lastname": (data) => data.apprentice?.lastName || "",
  "apprentice_firstname": (data) => data.apprentice?.firstName || "",
  "apprentice_birthdate": (data) => data.apprentice?.dateOfBirth || "",
  "apprentice_email": (data) => data.apprentice?.email || "",

  // Employer information
  "employer_name": (data) => data.employer?.name || "",
  "employer_siret": (data) => data.employer?.siret || "",
  "employer_address": (data) => data.employer?.address || "",

  // CFA information
  "cfa_name": (data) => data.cfa?.name || "",
  "cfa_uai": (data) => data.cfa?.uai || "",

  // Contract information
  "contract_number": (data) => data.contractNumber || "",
  "contract_start_date": (data) => data.startDate || "",
  "contract_end_date": (data) => data.endDate || "",
};

export class CerfaService {
  async generateCerfa10103(contractData: FilizContractData): Promise<Buffer> {
    // In production, this would load the blank CERFA PDF template
    // For now, we'll create a simple PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size

    const { height } = page.getSize();
    const fontSize = 12;
    let yPosition = height - 50;

    // Add title
    page.drawText("CERFA 10103*10 - Contrat d'Apprentissage", {
      x: 50,
      y: yPosition,
      size: 16,
    });

    yPosition -= 40;

    // Add contract data
    const fields = [
      ["Contract Number", contractData.contractNumber],
      ["Status", contractData.status],
      ["Start Date", contractData.startDate],
      ["End Date", contractData.endDate],
      ["Apprentice", `${contractData.apprentice?.firstName} ${contractData.apprentice?.lastName}`],
      ["Apprentice Email", contractData.apprentice?.email],
      ["Employer", contractData.employer?.name],
      ["Employer SIRET", contractData.employer?.siret],
      ["CFA", contractData.cfa?.name],
      ["CFA UAI", contractData.cfa?.uai],
    ];

    for (const [label, value] of fields) {
      if (value) {
        page.drawText(`${label}: ${value}`, {
          x: 50,
          y: yPosition,
          size: fontSize,
        });
        yPosition -= 20;
      }
    }

    // Add generation timestamp
    yPosition -= 20;
    page.drawText(`Generated: ${new Date().toISOString()}`, {
      x: 50,
      y: yPosition,
      size: 10,
    });

    page.drawText(`Version: ${FIELD_MAPPING_VERSION}`, {
      x: 50,
      y: yPosition - 15,
      size: 10,
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  getFieldMappingVersion(): string {
    return FIELD_MAPPING_VERSION;
  }
}

export const cerfaService = new CerfaService();
