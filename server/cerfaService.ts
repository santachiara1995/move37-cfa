// CERFA PDF Generation Service using pdf-lib
import { PDFDocument, PDFForm, PDFCheckBox } from "pdf-lib";
import { readFileSync } from "fs";
import { join } from "path";
import { CERFA_FIELD_NAMES } from "./cerfaFieldMapping";

// Field mapping version
const FIELD_MAPPING_VERSION = "1.0.0";

export interface CerfaContractData {
  // Contract basic info
  id?: string;
  contractNumber?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  
  // Employer section
  employer?: {
    name?: string;
    siret?: string;
    addressNumber?: string;
    addressStreet?: string;
    addressComplement?: string;
    postalCode?: string;
    city?: string;
    phone?: string;
    email?: string;
    type?: string;
    specific?: string;
    nafCode?: string;
    totalEmployees?: string;
    idcc?: string;
  };
  
  // Apprentice section
  apprentice?: {
    lastName?: string;
    usageName?: string;
    firstName?: string;
    nir?: string;
    birthDate?: string;
    sex?: 'M' | 'F';
    addressNumber?: string;
    addressStreet?: string;
    addressComplement?: string;
    postalCode?: string;
    city?: string;
    birthDepartment?: string;
    birthCity?: string;
    nationality?: string;
    socialRegime?: string;
    phone?: string;
    email?: string;
    highLevelAthlete?: boolean;
    disabledWorker?: boolean;
    previousSituation?: string;
    lastDiploma?: string;
    lastClassYear?: string;
    lastDiplomaTitle?: string;
    highestDiploma?: string;
    businessProject?: boolean;
  };
  
  master1?: {
    lastName?: string;
    firstName?: string;
    birthDate?: string;
    nir?: string;
    email?: string;
    jobTitle?: string;
    diploma?: string;
    diplomaLevel?: string;
  };
  
  master2?: {
    lastName?: string;
    firstName?: string;
    birthDate?: string;
    nir?: string;
    email?: string;
    jobTitle?: string;
    diploma?: string;
    diplomaLevel?: string;
  };
  
  // Contract section
  contract?: {
    type?: string;
    derogationType?: string;
    previousContractNumber?: string;
    conclusionDate?: string;
    executionStartDate?: string;
    practicalTrainingStartDate?: string;
    amendmentEffectiveDate?: string;
    weeklyWorkHours?: string;
    weeklyWorkMinutes?: string;
    endDate?: string;
    dangerousMachines?: boolean;
  };
  
  remuneration?: {
    year1?: {
      startDate1?: string;
      endDate1?: string;
      percentage1?: string;
      reference1?: string;
      startDate2?: string;
      endDate2?: string;
      percentage2?: string;
      reference2?: string;
    };
    year2?: {
      startDate1?: string;
      endDate1?: string;
      percentage1?: string;
      reference1?: string;
      startDate2?: string;
      endDate2?: string;
      percentage2?: string;
      reference2?: string;
    };
    year3?: {
      startDate1?: string;
      endDate1?: string;
      percentage1?: string;
      reference1?: string;
      startDate2?: string;
      endDate2?: string;
      percentage2?: string;
      reference2?: string;
    };
    year4?: {
      startDate1?: string;
      endDate1?: string;
      percentage1?: string;
      reference1?: string;
      startDate2?: string;
      endDate2?: string;
      percentage2?: string;
      reference2?: string;
    };
    monthlySalary?: string;
    retirementFund?: string;
    benefitFoodAmount?: string;
    benefitHousingAmount?: string;
    benefitOther?: string;
  };
  
  cfa?: {
    isCompany?: boolean;
    name?: string;
    uai?: string;
    siret?: string;
    addressNumber?: string;
    addressStreet?: string;
    addressComplement?: string;
    postalCode?: string;
    city?: string;
  };
  
  training?: {
    targetDiploma?: string;
    diplomaTitle?: string;
    diplomaCode?: string;
    rncpCode?: string;
    organization?: string;
    startDate?: string;
    endDate?: string;
    hours?: string;
    alternateLocation?: string;
    alternateLocationUai?: string;
    alternateLocationSiret?: string;
    alternateLocationAddressNumber?: string;
    alternateLocationAddressStreet?: string;
    alternateLocationAddressComplement?: string;
    alternateLocationPostalCode?: string;
    alternateLocationCity?: string;
  };
  
  // Signatures section
  signature?: {
    city?: string;
    date?: string;
  };
  
  // Administrative section
  admin?: {
    organismName?: string;
    organismSiret?: string;
    receptionDate?: string;
    decisionDate?: string;
    depositNumber?: string;
    amendmentNumber?: string;
  };
}

export class CerfaService {
  async generateCerfa10103(contractData: CerfaContractData): Promise<Buffer> {
    try {
      // Load the CERFA PDF template
      const templatePath = join(process.cwd(), "attached_assets", "Template fillable - CERFA 10103-10 VS.pdf");
      const templateBytes = readFileSync(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);
      const form = pdfDoc.getForm();
      
      if (contractData.employer) {
        this.fillTextField(form, CERFA_FIELD_NAMES.employerName, contractData.employer.name);
        this.fillTextField(form, CERFA_FIELD_NAMES.employerSiret, contractData.employer.siret);
        this.fillTextField(form, CERFA_FIELD_NAMES.employerAddressNumber, contractData.employer.addressNumber);
        this.fillTextField(form, CERFA_FIELD_NAMES.employerAddressStreet, contractData.employer.addressStreet);
        this.fillTextField(form, CERFA_FIELD_NAMES.employerAddressComplement, contractData.employer.addressComplement);
        this.fillTextField(form, CERFA_FIELD_NAMES.employerPostalCode, contractData.employer.postalCode);
        this.fillTextField(form, CERFA_FIELD_NAMES.employerCity, contractData.employer.city);
        this.fillTextField(form, CERFA_FIELD_NAMES.employerPhone, contractData.employer.phone);
        this.fillTextField(form, CERFA_FIELD_NAMES.employerEmail, contractData.employer.email);
        this.fillTextField(form, CERFA_FIELD_NAMES.employerType, contractData.employer.type);
        this.fillTextField(form, CERFA_FIELD_NAMES.employerSpecific, contractData.employer.specific);
        this.fillTextField(form, CERFA_FIELD_NAMES.employerNafCode, contractData.employer.nafCode);
        this.fillTextField(form, CERFA_FIELD_NAMES.employerTotalEmployees, contractData.employer.totalEmployees);
        this.fillTextField(form, CERFA_FIELD_NAMES.employerIdcc, contractData.employer.idcc);
      }
      
      if (contractData.apprentice) {
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeLastName, contractData.apprentice.lastName);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeUsageName, contractData.apprentice.usageName);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeFirstName, contractData.apprentice.firstName);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeNir, contractData.apprentice.nir);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeBirthDate, contractData.apprentice.birthDate);
        
        if (contractData.apprentice.sex === 'M') {
          this.fillCheckbox(form, CERFA_FIELD_NAMES.apprenticeSexM, true);
        } else if (contractData.apprentice.sex === 'F') {
          this.fillCheckbox(form, CERFA_FIELD_NAMES.apprenticeSexF, true);
        }
        
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeAddressNumber, contractData.apprentice.addressNumber);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeAddressStreet, contractData.apprentice.addressStreet);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeAddressComplement, contractData.apprentice.addressComplement);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticePostalCode, contractData.apprentice.postalCode);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeCity, contractData.apprentice.city);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeBirthDepartment, contractData.apprentice.birthDepartment);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeBirthCity, contractData.apprentice.birthCity);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeNationality, contractData.apprentice.nationality);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeSocialRegime, contractData.apprentice.socialRegime);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticePhone, contractData.apprentice.phone);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeEmail, contractData.apprentice.email);
        
        this.fillCheckbox(form, CERFA_FIELD_NAMES.apprenticeHighLevelAthleteYes, contractData.apprentice.highLevelAthlete === true);
        this.fillCheckbox(form, CERFA_FIELD_NAMES.apprenticeHighLevelAthleteNo, contractData.apprentice.highLevelAthlete === false);
        this.fillCheckbox(form, CERFA_FIELD_NAMES.apprenticeDisabledWorkerYes, contractData.apprentice.disabledWorker === true);
        this.fillCheckbox(form, CERFA_FIELD_NAMES.apprenticeDisabledWorkerNo, contractData.apprentice.disabledWorker === false);
        
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticePreviousSituation, contractData.apprentice.previousSituation);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeLastDiploma, contractData.apprentice.lastDiploma);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeLastClassYear, contractData.apprentice.lastClassYear);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeLastDiplomaTitle, contractData.apprentice.lastDiplomaTitle);
        this.fillTextField(form, CERFA_FIELD_NAMES.apprenticeHighestDiploma, contractData.apprentice.highestDiploma);
        
        this.fillCheckbox(form, CERFA_FIELD_NAMES.apprenticeBusinessProjectYes, contractData.apprentice.businessProject === true);
        this.fillCheckbox(form, CERFA_FIELD_NAMES.apprenticeBusinessProjectNo, contractData.apprentice.businessProject === false);
      }
      
      if (contractData.master1) {
        this.fillTextField(form, CERFA_FIELD_NAMES.master1LastName, contractData.master1.lastName);
        this.fillTextField(form, CERFA_FIELD_NAMES.master1FirstName, contractData.master1.firstName);
        this.fillTextField(form, CERFA_FIELD_NAMES.master1BirthDate, contractData.master1.birthDate);
        this.fillTextField(form, CERFA_FIELD_NAMES.master1Nir, contractData.master1.nir);
        this.fillTextField(form, CERFA_FIELD_NAMES.master1Email, contractData.master1.email);
        this.fillTextField(form, CERFA_FIELD_NAMES.master1JobTitle, contractData.master1.jobTitle);
        this.fillTextField(form, CERFA_FIELD_NAMES.master1Diploma, contractData.master1.diploma);
        this.fillTextField(form, CERFA_FIELD_NAMES.master1DiplomaLevel, contractData.master1.diplomaLevel);
      }
      
      if (contractData.master2) {
        this.fillTextField(form, CERFA_FIELD_NAMES.master2LastName, contractData.master2.lastName);
        this.fillTextField(form, CERFA_FIELD_NAMES.master2FirstName, contractData.master2.firstName);
        this.fillTextField(form, CERFA_FIELD_NAMES.master2BirthDate, contractData.master2.birthDate);
        this.fillTextField(form, CERFA_FIELD_NAMES.master2Nir, contractData.master2.nir);
        this.fillTextField(form, CERFA_FIELD_NAMES.master2Email, contractData.master2.email);
        this.fillTextField(form, CERFA_FIELD_NAMES.master2JobTitle, contractData.master2.jobTitle);
        this.fillTextField(form, CERFA_FIELD_NAMES.master2Diploma, contractData.master2.diploma);
        this.fillTextField(form, CERFA_FIELD_NAMES.master2DiplomaLevel, contractData.master2.diplomaLevel);
      }
      
      if (contractData.contract) {
        this.fillTextField(form, CERFA_FIELD_NAMES.contractType, contractData.contract.type);
        this.fillTextField(form, CERFA_FIELD_NAMES.contractDerogationType, contractData.contract.derogationType);
        this.fillTextField(form, CERFA_FIELD_NAMES.previousContractNumber, contractData.contract.previousContractNumber);
        this.fillTextField(form, CERFA_FIELD_NAMES.contractConclusionDate, contractData.contract.conclusionDate);
        this.fillTextField(form, CERFA_FIELD_NAMES.contractExecutionStartDate, contractData.contract.executionStartDate);
        this.fillTextField(form, CERFA_FIELD_NAMES.contractPracticalTrainingStartDate, contractData.contract.practicalTrainingStartDate);
        this.fillTextField(form, CERFA_FIELD_NAMES.amendmentEffectiveDate, contractData.contract.amendmentEffectiveDate);
        this.fillTextField(form, CERFA_FIELD_NAMES.weeklyWorkHours, contractData.contract.weeklyWorkHours);
        this.fillTextField(form, CERFA_FIELD_NAMES.weeklyWorkMinutes, contractData.contract.weeklyWorkMinutes);
        this.fillTextField(form, CERFA_FIELD_NAMES.contractEndDate, contractData.contract.endDate);
        
        this.fillCheckbox(form, CERFA_FIELD_NAMES.dangerousMachinesYes, contractData.contract.dangerousMachines === true);
        this.fillCheckbox(form, CERFA_FIELD_NAMES.dangerousMachinesNo, contractData.contract.dangerousMachines === false);
      }
      
      if (contractData.remuneration) {
        if (contractData.remuneration.year1) {
          this.fillTextField(form, CERFA_FIELD_NAMES.year1StartDate1, contractData.remuneration.year1.startDate1);
          this.fillTextField(form, CERFA_FIELD_NAMES.year1EndDate1, contractData.remuneration.year1.endDate1);
          this.fillTextField(form, CERFA_FIELD_NAMES.year1Percentage1, contractData.remuneration.year1.percentage1);
          this.fillTextField(form, CERFA_FIELD_NAMES.year1Reference1, contractData.remuneration.year1.reference1);
          this.fillTextField(form, CERFA_FIELD_NAMES.year1StartDate2, contractData.remuneration.year1.startDate2);
          this.fillTextField(form, CERFA_FIELD_NAMES.year1EndDate2, contractData.remuneration.year1.endDate2);
          this.fillTextField(form, CERFA_FIELD_NAMES.year1Percentage2, contractData.remuneration.year1.percentage2);
          this.fillTextField(form, CERFA_FIELD_NAMES.year1Reference2, contractData.remuneration.year1.reference2);
        }
        
        if (contractData.remuneration.year2) {
          this.fillTextField(form, CERFA_FIELD_NAMES.year2StartDate1, contractData.remuneration.year2.startDate1);
          this.fillTextField(form, CERFA_FIELD_NAMES.year2EndDate1, contractData.remuneration.year2.endDate1);
          this.fillTextField(form, CERFA_FIELD_NAMES.year2Percentage1, contractData.remuneration.year2.percentage1);
          this.fillTextField(form, CERFA_FIELD_NAMES.year2Reference1, contractData.remuneration.year2.reference1);
          this.fillTextField(form, CERFA_FIELD_NAMES.year2StartDate2, contractData.remuneration.year2.startDate2);
          this.fillTextField(form, CERFA_FIELD_NAMES.year2EndDate2, contractData.remuneration.year2.endDate2);
          this.fillTextField(form, CERFA_FIELD_NAMES.year2Percentage2, contractData.remuneration.year2.percentage2);
          this.fillTextField(form, CERFA_FIELD_NAMES.year2Reference2, contractData.remuneration.year2.reference2);
        }
        
        if (contractData.remuneration.year3) {
          this.fillTextField(form, CERFA_FIELD_NAMES.year3StartDate1, contractData.remuneration.year3.startDate1);
          this.fillTextField(form, CERFA_FIELD_NAMES.year3EndDate1, contractData.remuneration.year3.endDate1);
          this.fillTextField(form, CERFA_FIELD_NAMES.year3Percentage1, contractData.remuneration.year3.percentage1);
          this.fillTextField(form, CERFA_FIELD_NAMES.year3Reference1, contractData.remuneration.year3.reference1);
          this.fillTextField(form, CERFA_FIELD_NAMES.year3StartDate2, contractData.remuneration.year3.startDate2);
          this.fillTextField(form, CERFA_FIELD_NAMES.year3EndDate2, contractData.remuneration.year3.endDate2);
          this.fillTextField(form, CERFA_FIELD_NAMES.year3Percentage2, contractData.remuneration.year3.percentage2);
          this.fillTextField(form, CERFA_FIELD_NAMES.year3Reference2, contractData.remuneration.year3.reference2);
        }
        
        if (contractData.remuneration.year4) {
          this.fillTextField(form, CERFA_FIELD_NAMES.year4StartDate1, contractData.remuneration.year4.startDate1);
          this.fillTextField(form, CERFA_FIELD_NAMES.year4EndDate1, contractData.remuneration.year4.endDate1);
          this.fillTextField(form, CERFA_FIELD_NAMES.year4Percentage1, contractData.remuneration.year4.percentage1);
          this.fillTextField(form, CERFA_FIELD_NAMES.year4Reference1, contractData.remuneration.year4.reference1);
          this.fillTextField(form, CERFA_FIELD_NAMES.year4StartDate2, contractData.remuneration.year4.startDate2);
          this.fillTextField(form, CERFA_FIELD_NAMES.year4EndDate2, contractData.remuneration.year4.endDate2);
          this.fillTextField(form, CERFA_FIELD_NAMES.year4Percentage2, contractData.remuneration.year4.percentage2);
          this.fillTextField(form, CERFA_FIELD_NAMES.year4Reference2, contractData.remuneration.year4.reference2);
        }
        
        this.fillTextField(form, CERFA_FIELD_NAMES.monthlySalary, contractData.remuneration.monthlySalary);
        this.fillTextField(form, CERFA_FIELD_NAMES.retirementFund, contractData.remuneration.retirementFund);
        this.fillTextField(form, CERFA_FIELD_NAMES.benefitFoodAmount, contractData.remuneration.benefitFoodAmount);
        this.fillTextField(form, CERFA_FIELD_NAMES.benefitHousingAmount, contractData.remuneration.benefitHousingAmount);
        this.fillTextField(form, CERFA_FIELD_NAMES.benefitOther, contractData.remuneration.benefitOther);
      }
      
      if (contractData.cfa) {
        this.fillCheckbox(form, CERFA_FIELD_NAMES.cfaCompanyYes, contractData.cfa.isCompany === true);
        this.fillCheckbox(form, CERFA_FIELD_NAMES.cfaCompanyNo, contractData.cfa.isCompany === false);
        this.fillTextField(form, CERFA_FIELD_NAMES.cfaName, contractData.cfa.name);
        this.fillTextField(form, CERFA_FIELD_NAMES.cfaUai, contractData.cfa.uai);
        this.fillTextField(form, CERFA_FIELD_NAMES.cfaSiret, contractData.cfa.siret);
        this.fillTextField(form, CERFA_FIELD_NAMES.cfaAddressNumber, contractData.cfa.addressNumber);
        this.fillTextField(form, CERFA_FIELD_NAMES.cfaAddressStreet, contractData.cfa.addressStreet);
        this.fillTextField(form, CERFA_FIELD_NAMES.cfaAddressComplement, contractData.cfa.addressComplement);
        this.fillTextField(form, CERFA_FIELD_NAMES.cfaPostalCode, contractData.cfa.postalCode);
        this.fillTextField(form, CERFA_FIELD_NAMES.cfaCity, contractData.cfa.city);
      }
      
      if (contractData.training) {
        this.fillTextField(form, CERFA_FIELD_NAMES.targetDiploma, contractData.training.targetDiploma);
        this.fillTextField(form, CERFA_FIELD_NAMES.diplomaTitle, contractData.training.diplomaTitle);
        this.fillTextField(form, CERFA_FIELD_NAMES.diplomaCode, contractData.training.diplomaCode);
        this.fillTextField(form, CERFA_FIELD_NAMES.rncpCode, contractData.training.rncpCode);
        this.fillTextField(form, CERFA_FIELD_NAMES.trainingOrganization, contractData.training.organization);
        this.fillTextField(form, CERFA_FIELD_NAMES.trainingStartDate, contractData.training.startDate);
        this.fillTextField(form, CERFA_FIELD_NAMES.trainingEndDate, contractData.training.endDate);
        this.fillTextField(form, CERFA_FIELD_NAMES.trainingHours, contractData.training.hours);
        this.fillTextField(form, CERFA_FIELD_NAMES.alternateTrainingLocation, contractData.training.alternateLocation);
        this.fillTextField(form, CERFA_FIELD_NAMES.alternateLocationUai, contractData.training.alternateLocationUai);
        this.fillTextField(form, CERFA_FIELD_NAMES.alternateLocationSiret, contractData.training.alternateLocationSiret);
        this.fillTextField(form, CERFA_FIELD_NAMES.alternateLocationAddressNumber, contractData.training.alternateLocationAddressNumber);
        this.fillTextField(form, CERFA_FIELD_NAMES.alternateLocationAddressStreet, contractData.training.alternateLocationAddressStreet);
        this.fillTextField(form, CERFA_FIELD_NAMES.alternateLocationAddressComplement, contractData.training.alternateLocationAddressComplement);
        this.fillTextField(form, CERFA_FIELD_NAMES.alternateLocationPostalCode, contractData.training.alternateLocationPostalCode);
        this.fillTextField(form, CERFA_FIELD_NAMES.alternateLocationCity, contractData.training.alternateLocationCity);
      }
      
      if (contractData.signature) {
        this.fillTextField(form, CERFA_FIELD_NAMES.signatureCity, contractData.signature.city);
        this.fillTextField(form, CERFA_FIELD_NAMES.signatureDate, contractData.signature.date);
      }
      
      if (contractData.admin) {
        this.fillTextField(form, CERFA_FIELD_NAMES.adminOrganismName, contractData.admin.organismName);
        this.fillTextField(form, CERFA_FIELD_NAMES.adminOrganismSiret, contractData.admin.organismSiret);
        this.fillTextField(form, CERFA_FIELD_NAMES.adminReceptionDate, contractData.admin.receptionDate);
        this.fillTextField(form, CERFA_FIELD_NAMES.adminDecisionDate, contractData.admin.decisionDate);
        this.fillTextField(form, CERFA_FIELD_NAMES.adminDepositNumber, contractData.admin.depositNumber);
        this.fillTextField(form, CERFA_FIELD_NAMES.adminAmendmentNumber, contractData.admin.amendmentNumber);
      }
      
      form.flatten();
      
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      console.error("Error generating CERFA PDF:", error);
      throw new Error(`Failed to generate CERFA PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private fillTextField(form: PDFForm, fieldName: string, value?: string): void {
    if (!value) return;
    try {
      const field = form.getTextField(fieldName);
      field.setText(value);
    } catch (error) {
      console.warn(`Field ${fieldName} not found or error filling:`, error);
    }
  }
  
  private fillCheckbox(form: PDFForm, fieldName: string, checked: boolean): void {
    if (!checked) return;
    try {
      const field = form.getCheckBox(fieldName);
      field.check();
    } catch (error) {
      console.warn(`Checkbox ${fieldName} not found or error filling:`, error);
    }
  }

  getFieldMappingVersion(): string {
    return FIELD_MAPPING_VERSION;
  }
}

export const cerfaService = new CerfaService();
