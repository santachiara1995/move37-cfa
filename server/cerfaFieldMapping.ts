// CERFA 10103*10 Field Mapping Configuration
// Maps contract data to PDF form field names
// Field names are positional based on PDF template analysis

export interface CerfaFieldMap {
  // Employer section
  employerName: string;
  employerSiret: string;
  employerAddressNumber: string;
  employerAddressStreet: string;
  employerAddressComplement: string;
  employerPostalCode: string;
  employerCity: string;
  employerPhone: string;
  employerEmail: string;
  employerType: string;
  employerSpecific: string;
  employerNafCode: string;
  employerTotalEmployees: string;
  employerIdcc: string;
  
  // Apprentice section
  apprenticeLastName: string;
  apprenticeUsageName: string;
  apprenticeFirstName: string;
  apprenticeNir: string;
  apprenticeBirthDate: string;
  apprenticeSexM: string;
  apprenticeSexF: string;
  apprenticeAddressNumber: string;
  apprenticeAddressStreet: string;
  apprenticeAddressComplement: string;
  apprenticePostalCode: string;
  apprenticeCity: string;
  apprenticeBirthDepartment: string;
  apprenticeBirthCity: string;
  apprenticeNationality: string;
  apprenticeSocialRegime: string;
  apprenticePhone: string;
  apprenticeEmail: string;
  apprenticeHighLevelAthleteYes: string;
  apprenticeHighLevelAthleteNo: string;
  apprenticeDisabledWorkerYes: string;
  apprenticeDisabledWorkerNo: string;
  apprenticePreviousSituation: string;
  apprenticeLastDiploma: string;
  apprenticeLastClassYear: string;
  apprenticeLastDiplomaTitle: string;
  apprenticeHighestDiploma: string;
  apprenticeBusinessProjectYes: string;
  apprenticeBusinessProjectNo: string;
  
  // Master apprentice 1
  master1LastName: string;
  master1FirstName: string;
  master1BirthDate: string;
  master1Nir: string;
  master1Email: string;
  master1JobTitle: string;
  master1Diploma: string;
  master1DiplomaLevel: string;
  
  // Master apprentice 2 (optional)
  master2LastName: string;
  master2FirstName: string;
  master2BirthDate: string;
  master2Nir: string;
  master2Email: string;
  master2JobTitle: string;
  master2Diploma: string;
  master2DiplomaLevel: string;
  
  // Contract section
  contractType: string;
  contractDerogationType: string;
  previousContractNumber: string;
  contractConclusionDate: string;
  contractExecutionStartDate: string;
  contractPracticalTrainingStartDate: string;
  amendmentEffectiveDate: string;
  weeklyWorkHours: string;
  weeklyWorkMinutes: string;
  contractEndDate: string;
  dangerousMachinesYes: string;
  dangerousMachinesNo: string;
  
  // Remuneration (4 years possible)
  year1StartDate1: string;
  year1EndDate1: string;
  year1Percentage1: string;
  year1Reference1: string;
  year1StartDate2: string;
  year1EndDate2: string;
  year1Percentage2: string;
  year1Reference2: string;
  
  year2StartDate1: string;
  year2EndDate1: string;
  year2Percentage1: string;
  year2Reference1: string;
  year2StartDate2: string;
  year2EndDate2: string;
  year2Percentage2: string;
  year2Reference2: string;
  
  year3StartDate1: string;
  year3EndDate1: string;
  year3Percentage1: string;
  year3Reference1: string;
  year3StartDate2: string;
  year3EndDate2: string;
  year3Percentage2: string;
  year3Reference2: string;
  
  year4StartDate1: string;
  year4EndDate1: string;
  year4Percentage1: string;
  year4Reference1: string;
  year4StartDate2: string;
  year4EndDate2: string;
  year4Percentage2: string;
  year4Reference2: string;
  
  monthlySalary: string;
  retirementFund: string;
  benefitFoodAmount: string;
  benefitHousingAmount: string;
  benefitOther: string;
  
  // Training section
  cfaCompanyYes: string;
  cfaCompanyNo: string;
  cfaName: string;
  cfaUai: string;
  cfaSiret: string;
  cfaAddressNumber: string;
  cfaAddressStreet: string;
  cfaAddressComplement: string;
  cfaPostalCode: string;
  cfaCity: string;
  targetDiploma: string;
  diplomaTitle: string;
  diplomaCode: string;
  rncp Code: string;
  trainingOrganization: string;
  trainingStartDate: string;
  trainingEndDate: string;
  trainingHours: string;
  alternateTrainingLocation: string;
  alternateLocationUai: string;
  alternateLocationSiret: string;
  alternateLocationAddressNumber: string;
  alternateLocationAddressStreet: string;
  alternateLocationAddressComplement: string;
  alternateLocationPostalCode: string;
  alternateLocationCity: string;
  
  // Signatures section
  signatureCity: string;
  signatureDate: string;
  
  // Administrative section
  adminOrganismName: string;
  adminOrganismSiret: string;
  adminReceptionDate: string;
  adminDecisionDate: string;
  adminDepositNumber: string;
  adminAmendmentNumber: string;
}

// PDF Form Field Names (from template analysis)
// These are the actual field names in the CERFA 10103*10 PDF
export const CERFA_FIELD_NAMES: CerfaFieldMap = {
  // EMPLOYER SECTION (L'EMPLOYEUR)
  employerName: "text_1exb",
  employerSiret: "text_8nshp",
  employerAddressNumber: "text_2bcjf",
  employerAddressStreet: "text_3zcks",
  employerAddressComplement: "text_9wvky",
  employerPostalCode: "text_10dbyf",
  employerCity: "text_11zobb",
  employerPhone: "text_12ckab",
  employerEmail: "text_13ifko",
  employerType: "text_18hlcf",
  employerSpecific: "text_27ibfd",
  employerNafCode: "text_14lejr",
  employerTotalEmployees: "text_15qkda",
  employerIdcc: "text_16rwtn",
  
  // APPRENTICE SECTION (L'APPRENTI(E))
  apprenticeLastName: "text_31tkvp",
  apprenticeUsageName: "text_33ijka",
  apprenticeFirstName: "text_34zhaf",
  apprenticeNir: "text_35pzck",
  apprenticeBirthDate: "text_36ldqh",
  apprenticeSexM: "checkbox_51itfw",
  apprenticeSexF: "checkbox_52dfmo",
  apprenticeAddressNumber: "text_39gpxj",
  apprenticeAddressStreet: "text_40nksu",
  apprenticeAddressComplement: "text_41lzzc",
  apprenticePostalCode: "text_42bmvd",
  apprenticeCity: "text_32rrxh",
  apprenticeBirthDepartment: "text_37wwzu",
  apprenticeBirthCity: "text_38fqwe",
  apprenticeNationality: "text_47lloa",
  apprenticeSocialRegime: "text_48ekvo",
  apprenticePhone: "text_49chhs",
  apprenticeEmail: "text_50avys",
  apprenticeHighLevelAthleteYes: "checkbox_62uqtx",
  apprenticeHighLevelAthleteNo: "checkbox_5upxo",
  apprenticeDisabledWorkerYes: "checkbox_7ocmh",
  apprenticeDisabledWorkerNo: "checkbox_88pmyq",
  apprenticePreviousSituation: "text_54tog",
  apprenticeLastDiploma: "text_55y",
  apprenticeLastClassYear: "text_56jasz",
  apprenticeLastDiplomaTitle: "text_57pplz",
  apprenticeHighestDiploma: "text_58pgjd",
  apprenticeBusinessProjectYes: "checkbox_84zotl",
  apprenticeBusinessProjectNo: "checkbox_90thrm",
  
  // MASTER APPRENTICE 1 (MAÎTRE D'APPRENTISSAGE)
  master1LastName: "text_76lrya",
  master1FirstName: "text_78jnsb",
  master1BirthDate: "text_79fpuo",
  master1Nir: "text_80jtyl",
  master1Email: "text_81oxuj",
  master1JobTitle: "text_82tbzb",
  master1Diploma: "text_85nxhd",
  master1DiplomaLevel: "text_75tsxh",
  
  // MASTER APPRENTICE 2 (MAÎTRE D'APPRENTISSAGE n°2)
  master2LastName: "text_68qsoo",
  master2FirstName: "text_69ldez",
  master2BirthDate: "text_70zknq",
  master2Nir: "text_71czqp",
  master2Email: "text_72rzat",
  master2JobTitle: "text_73fmgm",
  master2Diploma: "text_77lfxs",
  master2DiplomaLevel: "text_74trwm",
  
  // CONTRACT SECTION (LE CONTRAT)
  contractType: "text_97iuva",
  contractDerogationType: "text_94apkz",
  previousContractNumber: "text_92akky",
  contractConclusionDate: "text_93mlle",
  contractExecutionStartDate: "text_95psuy",
  contractPracticalTrainingStartDate: "text_96jvfx",
  amendmentEffectiveDate: "text_100puso",
  weeklyWorkHours: "text_99sksn",
  weeklyWorkMinutes: "text_101npnm",
  contractEndDate: "text_102hu",
  dangerousMachinesYes: "checkbox_86ojxt",
  dangerousMachinesNo: "checkbox_87zxsw",
  
  // REMUNERATION - Year 1
  year1StartDate1: "text_107glkc",
  year1EndDate1: "text_108txvl",
  year1Percentage1: "text_113ojtt",
  year1Reference1: "text_109sqsh",
  year1StartDate2: "text_110hron",
  year1EndDate2: "text_111bqpg",
  year1Percentage2: "text_112wueq",
  year1Reference2: "text_103dptq",
  
  // REMUNERATION - Year 2
  year2StartDate1: "text_116igca",
  year2EndDate1: "text_119tszr",
  year2Percentage1: "text_127hyaj",
  year2Reference1: "text_118ec",
  year2StartDate2: "text_123movy",
  year2EndDate2: "text_128xqew",
  year2Percentage2: "text_126eeyn",
  year2Reference2: "text_133lohh",
  
  // REMUNERATION - Year 3
  year3StartDate1: "text_129ztfp",
  year3EndDate1: "text_130jzgp",
  year3Percentage1: "text_131hcbr",
  year3Reference1: "text_132ompm",
  year3StartDate2: "text_133dvjk",
  year3EndDate2: "text_134wrhq",
  year3Percentage2: "text_144qgnp",
  year3Reference2: "text_98syzp",
  
  // REMUNERATION - Year 4
  year4StartDate1: "text_190aaoh",
  year4EndDate1: "text_191alwj",
  year4Percentage1: "text_192nfph",
  year4Reference1: "text_193mvke",
  year4StartDate2: "text_199bpjv",
  year4EndDate2: "text_200nmeh",
  year4Percentage2: "text_201aqxb",
  year4Reference2: "text_104vrbz",
  
  monthlySalary: "text_105duvn",
  retirementFund: "text_106iyhp",
  benefitFoodAmount: "text_63fjsf",
  benefitHousingAmount: "text_60jxp",
  benefitOther: "text_61pwnb",
  
  // TRAINING SECTION (LA FORMATION)
  cfaCompanyYes: "checkbox_194bnrb",
  cfaCompanyNo: "checkbox_196ixda",
  cfaName: "text_139ftdv",
  cfaUai: "text_140cagp",
  cfaSiret: "text_141hnaz",
  cfaAddressNumber: "text_142xplj",
  cfaAddressStreet: "text_143bcnv",
  cfaAddressComplement: "text_145yoqy",
  cfaPostalCode: "text_146tvko",
  cfaCity: "text_147kwez",
  targetDiploma: "text_154wadn",
  diplomaTitle: "text_155oqyv",
  diplomaCode: "text_156puge",
  rncpCode: "text_157qqvj",
  trainingOrganization: "text_158tqcd",
  trainingStartDate: "text_159cxaa",
  trainingEndDate: "text_160wnav",
  trainingHours: "text_161jcwj",
  alternateTrainingLocation: "text_169yeej",
  alternateLocationUai: "text_170cps",
  alternateLocationSiret: "text_171bamt",
  alternateLocationAddressNumber: "text_172noho",
  alternateLocationAddressStreet: "text_174fdqn",
  alternateLocationAddressComplement: "text_175icpv",
  alternateLocationPostalCode: "text_176lnxw",
  alternateLocationCity: "text_177xazh",
  
  // SIGNATURES SECTION
  signatureCity: "text_202jfym",
  signatureDate: "text_203dtht",
  
  // ADMINISTRATIVE SECTION (CADRE RÉSERVÉ)
  adminOrganismName: "text_204zzqy",
  adminOrganismSiret: "text_205rfln",
  adminReceptionDate: "text_206qolq",
  adminDecisionDate: "text_207ibxg",
  adminDepositNumber: "text_208ctvi",
  adminAmendmentNumber: "text_209bfyt",
};
