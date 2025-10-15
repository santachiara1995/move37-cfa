import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "wouter";

interface ContractFormData {
  tenantId: string;
  studentId?: string;
  contractNumber?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  employerName?: string;
  cfaName?: string;
  cachedData: any;
}

export default function ContractCreate() {
  const { isAuthenticated } = useAuth();
  const { currentTenant } = useTenant();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ContractFormData>({
    defaultValues: {
      tenantId: currentTenant?.id || "",
      status: "draft",
      cachedData: {
        apprentice: {
          sex: undefined,
          highLevelAthlete: false,
          disabledWorker: false,
          businessProject: false,
        },
        contract: {
          dangerousMachines: false,
        },
        cfa: {
          isCompany: false,
        },
      },
    },
  });
  
  const createContract = useMutation({
    mutationFn: async (data: ContractFormData) => {
      const response = await apiRequest("POST", "/api/contracts", data);
      return await response.json();
    },
    onSuccess: (contract: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Success",
        description: "Contract created successfully",
      });
      setLocation(`/contracts/${contract.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create contract",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: ContractFormData) => {
    if (!currentTenant) {
      toast({
        title: "Error",
        description: "Please select a school first",
        variant: "destructive",
      });
      return;
    }
    
    data.tenantId = currentTenant.id;
    
    if (data.cachedData.employer?.name) {
      data.employerName = data.cachedData.employer.name;
    }
    if (data.cachedData.cfa?.name) {
      data.cfaName = data.cachedData.cfa.name;
    }
    
    createContract.mutate(data);
  };
  
  if (!isAuthenticated) {
    return null;
  }
  
  if (!currentTenant) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No School Selected</h3>
            <p className="text-sm text-muted-foreground">
              Please select a school from the tenant switcher to create a contract.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/contracts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>
      
      <div>
        <h1 className="text-2xl font-semibold mb-2">Create Contract</h1>
        <p className="text-sm text-muted-foreground">
          Fill in all contract details for CERFA 10103*10 form
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractNumber">Contract Number</Label>
                <Input
                  id="contractNumber"
                  {...register("contractNumber")}
                  placeholder="e.g., CTR-2024-001"
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                />
              </div>
              
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="employer">
            <AccordionTrigger className="text-lg font-semibold">
              Employer Information
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="employer.name">Company Name</Label>
                      <Input
                        id="employer.name"
                        {...register("cachedData.employer.name")}
                        placeholder="Company name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="employer.siret">SIRET</Label>
                      <Input
                        id="employer.siret"
                        {...register("cachedData.employer.siret")}
                        placeholder="14-digit SIRET number"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="employer.nafCode">NAF Code</Label>
                      <Input
                        id="employer.nafCode"
                        {...register("cachedData.employer.nafCode")}
                        placeholder="NAF code"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="employer.addressNumber">Address Number</Label>
                      <Input
                        id="employer.addressNumber"
                        {...register("cachedData.employer.addressNumber")}
                        placeholder="Street number"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="employer.addressStreet">Street</Label>
                      <Input
                        id="employer.addressStreet"
                        {...register("cachedData.employer.addressStreet")}
                        placeholder="Street name"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="employer.addressComplement">Address Complement</Label>
                      <Input
                        id="employer.addressComplement"
                        {...register("cachedData.employer.addressComplement")}
                        placeholder="Building, floor, etc."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="employer.postalCode">Postal Code</Label>
                      <Input
                        id="employer.postalCode"
                        {...register("cachedData.employer.postalCode")}
                        placeholder="Postal code"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="employer.city">City</Label>
                      <Input
                        id="employer.city"
                        {...register("cachedData.employer.city")}
                        placeholder="City"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="employer.phone">Phone</Label>
                      <Input
                        id="employer.phone"
                        type="tel"
                        {...register("cachedData.employer.phone")}
                        placeholder="Phone number"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="employer.email">Email</Label>
                      <Input
                        id="employer.email"
                        type="email"
                        {...register("cachedData.employer.email")}
                        placeholder="Email"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="employer.type">Employer Type</Label>
                      <Input
                        id="employer.type"
                        {...register("cachedData.employer.type")}
                        placeholder="Type of employer"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="employer.totalEmployees">Total Employees</Label>
                      <Input
                        id="employer.totalEmployees"
                        {...register("cachedData.employer.totalEmployees")}
                        placeholder="Number of employees"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="employer.idcc">IDCC</Label>
                      <Input
                        id="employer.idcc"
                        {...register("cachedData.employer.idcc")}
                        placeholder="Collective agreement code"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="employer.specific">Specific</Label>
                      <Input
                        id="employer.specific"
                        {...register("cachedData.employer.specific")}
                        placeholder="Specific employer info"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="apprentice">
            <AccordionTrigger className="text-lg font-semibold">
              Apprentice Information
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="apprentice.lastName">Last Name</Label>
                      <Input
                        id="apprentice.lastName"
                        {...register("cachedData.apprentice.lastName")}
                        placeholder="Last name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.firstName">First Name</Label>
                      <Input
                        id="apprentice.firstName"
                        {...register("cachedData.apprentice.firstName")}
                        placeholder="First name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.usageName">Usage Name</Label>
                      <Input
                        id="apprentice.usageName"
                        {...register("cachedData.apprentice.usageName")}
                        placeholder="Usage name (if different)"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.nir">NIR (Social Security Number)</Label>
                      <Input
                        id="apprentice.nir"
                        {...register("cachedData.apprentice.nir")}
                        placeholder="15-digit NIR"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.birthDate">Birth Date</Label>
                      <Input
                        id="apprentice.birthDate"
                        type="date"
                        {...register("cachedData.apprentice.birthDate")}
                      />
                    </div>
                    
                    <div>
                      <Label>Sex</Label>
                      <Select
                        value={watch("cachedData.apprentice.sex")}
                        onValueChange={(value: 'M' | 'F') => setValue("cachedData.apprentice.sex", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.addressNumber">Address Number</Label>
                      <Input
                        id="apprentice.addressNumber"
                        {...register("cachedData.apprentice.addressNumber")}
                        placeholder="Street number"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.addressStreet">Street</Label>
                      <Input
                        id="apprentice.addressStreet"
                        {...register("cachedData.apprentice.addressStreet")}
                        placeholder="Street name"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="apprentice.addressComplement">Address Complement</Label>
                      <Input
                        id="apprentice.addressComplement"
                        {...register("cachedData.apprentice.addressComplement")}
                        placeholder="Building, floor, etc."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.postalCode">Postal Code</Label>
                      <Input
                        id="apprentice.postalCode"
                        {...register("cachedData.apprentice.postalCode")}
                        placeholder="Postal code"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.city">City</Label>
                      <Input
                        id="apprentice.city"
                        {...register("cachedData.apprentice.city")}
                        placeholder="City"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.birthDepartment">Birth Department</Label>
                      <Input
                        id="apprentice.birthDepartment"
                        {...register("cachedData.apprentice.birthDepartment")}
                        placeholder="Department of birth"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.birthCity">Birth City</Label>
                      <Input
                        id="apprentice.birthCity"
                        {...register("cachedData.apprentice.birthCity")}
                        placeholder="City of birth"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.nationality">Nationality</Label>
                      <Input
                        id="apprentice.nationality"
                        {...register("cachedData.apprentice.nationality")}
                        placeholder="Nationality"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.socialRegime">Social Security Regime</Label>
                      <Input
                        id="apprentice.socialRegime"
                        {...register("cachedData.apprentice.socialRegime")}
                        placeholder="Social security regime"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.phone">Phone</Label>
                      <Input
                        id="apprentice.phone"
                        type="tel"
                        {...register("cachedData.apprentice.phone")}
                        placeholder="Phone number"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.email">Email</Label>
                      <Input
                        id="apprentice.email"
                        type="email"
                        {...register("cachedData.apprentice.email")}
                        placeholder="Email"
                      />
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="apprentice.highLevelAthlete"
                          checked={watch("cachedData.apprentice.highLevelAthlete")}
                          onCheckedChange={(checked) => setValue("cachedData.apprentice.highLevelAthlete", checked === true)}
                        />
                        <Label htmlFor="apprentice.highLevelAthlete" className="font-normal">
                          High-level athlete
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="apprentice.disabledWorker"
                          checked={watch("cachedData.apprentice.disabledWorker")}
                          onCheckedChange={(checked) => setValue("cachedData.apprentice.disabledWorker", checked === true)}
                        />
                        <Label htmlFor="apprentice.disabledWorker" className="font-normal">
                          Disabled worker
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="apprentice.businessProject"
                          checked={watch("cachedData.apprentice.businessProject")}
                          onCheckedChange={(checked) => setValue("cachedData.apprentice.businessProject", checked === true)}
                        />
                        <Label htmlFor="apprentice.businessProject" className="font-normal">
                          Has business project
                        </Label>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.previousSituation">Previous Situation</Label>
                      <Input
                        id="apprentice.previousSituation"
                        {...register("cachedData.apprentice.previousSituation")}
                        placeholder="Previous employment/education"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.lastDiploma">Last Diploma</Label>
                      <Input
                        id="apprentice.lastDiploma"
                        {...register("cachedData.apprentice.lastDiploma")}
                        placeholder="Last obtained diploma"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.lastClassYear">Last Class Year</Label>
                      <Input
                        id="apprentice.lastClassYear"
                        {...register("cachedData.apprentice.lastClassYear")}
                        placeholder="Year of last class"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.lastDiplomaTitle">Last Diploma Title</Label>
                      <Input
                        id="apprentice.lastDiplomaTitle"
                        {...register("cachedData.apprentice.lastDiplomaTitle")}
                        placeholder="Title of last diploma"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apprentice.highestDiploma">Highest Diploma</Label>
                      <Input
                        id="apprentice.highestDiploma"
                        {...register("cachedData.apprentice.highestDiploma")}
                        placeholder="Highest diploma obtained"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="master1">
            <AccordionTrigger className="text-lg font-semibold">
              Master Apprentice (Required)
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="master1.lastName">Last Name</Label>
                      <Input
                        id="master1.lastName"
                        {...register("cachedData.master1.lastName")}
                        placeholder="Last name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="master1.firstName">First Name</Label>
                      <Input
                        id="master1.firstName"
                        {...register("cachedData.master1.firstName")}
                        placeholder="First name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="master1.birthDate">Birth Date</Label>
                      <Input
                        id="master1.birthDate"
                        type="date"
                        {...register("cachedData.master1.birthDate")}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="master1.nir">NIR</Label>
                      <Input
                        id="master1.nir"
                        {...register("cachedData.master1.nir")}
                        placeholder="15-digit NIR"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="master1.email">Email</Label>
                      <Input
                        id="master1.email"
                        type="email"
                        {...register("cachedData.master1.email")}
                        placeholder="Email"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="master1.jobTitle">Job Title</Label>
                      <Input
                        id="master1.jobTitle"
                        {...register("cachedData.master1.jobTitle")}
                        placeholder="Job title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="master1.diploma">Diploma</Label>
                      <Input
                        id="master1.diploma"
                        {...register("cachedData.master1.diploma")}
                        placeholder="Professional diploma"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="master1.diplomaLevel">Diploma Level</Label>
                      <Input
                        id="master1.diplomaLevel"
                        {...register("cachedData.master1.diplomaLevel")}
                        placeholder="Diploma level"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="master2">
            <AccordionTrigger className="text-lg font-semibold">
              Second Master Apprentice (Optional)
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="master2.lastName">Last Name</Label>
                      <Input
                        id="master2.lastName"
                        {...register("cachedData.master2.lastName")}
                        placeholder="Last name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="master2.firstName">First Name</Label>
                      <Input
                        id="master2.firstName"
                        {...register("cachedData.master2.firstName")}
                        placeholder="First name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="master2.birthDate">Birth Date</Label>
                      <Input
                        id="master2.birthDate"
                        type="date"
                        {...register("cachedData.master2.birthDate")}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="master2.nir">NIR</Label>
                      <Input
                        id="master2.nir"
                        {...register("cachedData.master2.nir")}
                        placeholder="15-digit NIR"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="master2.email">Email</Label>
                      <Input
                        id="master2.email"
                        type="email"
                        {...register("cachedData.master2.email")}
                        placeholder="Email"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="master2.jobTitle">Job Title</Label>
                      <Input
                        id="master2.jobTitle"
                        {...register("cachedData.master2.jobTitle")}
                        placeholder="Job title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="master2.diploma">Diploma</Label>
                      <Input
                        id="master2.diploma"
                        {...register("cachedData.master2.diploma")}
                        placeholder="Professional diploma"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="master2.diplomaLevel">Diploma Level</Label>
                      <Input
                        id="master2.diplomaLevel"
                        {...register("cachedData.master2.diplomaLevel")}
                        placeholder="Diploma level"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="contract">
            <AccordionTrigger className="text-lg font-semibold">
              Contract Details
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contract.type">Contract Type</Label>
                      <Input
                        id="contract.type"
                        {...register("cachedData.contract.type")}
                        placeholder="Type of contract"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contract.derogationType">Derogation Type</Label>
                      <Input
                        id="contract.derogationType"
                        {...register("cachedData.contract.derogationType")}
                        placeholder="Derogation type (if any)"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contract.previousContractNumber">Previous Contract Number</Label>
                      <Input
                        id="contract.previousContractNumber"
                        {...register("cachedData.contract.previousContractNumber")}
                        placeholder="Previous contract (if renewal)"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contract.conclusionDate">Conclusion Date</Label>
                      <Input
                        id="contract.conclusionDate"
                        type="date"
                        {...register("cachedData.contract.conclusionDate")}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contract.executionStartDate">Execution Start Date</Label>
                      <Input
                        id="contract.executionStartDate"
                        type="date"
                        {...register("cachedData.contract.executionStartDate")}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contract.practicalTrainingStartDate">Practical Training Start Date</Label>
                      <Input
                        id="contract.practicalTrainingStartDate"
                        type="date"
                        {...register("cachedData.contract.practicalTrainingStartDate")}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contract.amendmentEffectiveDate">Amendment Effective Date</Label>
                      <Input
                        id="contract.amendmentEffectiveDate"
                        type="date"
                        {...register("cachedData.contract.amendmentEffectiveDate")}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contract.endDate">End Date</Label>
                      <Input
                        id="contract.endDate"
                        type="date"
                        {...register("cachedData.contract.endDate")}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contract.weeklyWorkHours">Weekly Work Hours</Label>
                      <Input
                        id="contract.weeklyWorkHours"
                        {...register("cachedData.contract.weeklyWorkHours")}
                        placeholder="e.g., 35"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contract.weeklyWorkMinutes">Weekly Work Minutes</Label>
                      <Input
                        id="contract.weeklyWorkMinutes"
                        {...register("cachedData.contract.weeklyWorkMinutes")}
                        placeholder="e.g., 0"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="contract.dangerousMachines"
                          checked={watch("cachedData.contract.dangerousMachines")}
                          onCheckedChange={(checked) => setValue("cachedData.contract.dangerousMachines", checked === true)}
                        />
                        <Label htmlFor="contract.dangerousMachines" className="font-normal">
                          Work involves dangerous machines
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="cfa">
            <AccordionTrigger className="text-lg font-semibold">
              CFA & Training Information
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="cfa.isCompany"
                          checked={watch("cachedData.cfa.isCompany")}
                          onCheckedChange={(checked) => setValue("cachedData.cfa.isCompany", checked === true)}
                        />
                        <Label htmlFor="cfa.isCompany" className="font-normal">
                          CFA is a company
                        </Label>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="cfa.name">CFA Name</Label>
                      <Input
                        id="cfa.name"
                        {...register("cachedData.cfa.name")}
                        placeholder="Training center name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cfa.uai">UAI Code</Label>
                      <Input
                        id="cfa.uai"
                        {...register("cachedData.cfa.uai")}
                        placeholder="UAI code"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cfa.siret">SIRET</Label>
                      <Input
                        id="cfa.siret"
                        {...register("cachedData.cfa.siret")}
                        placeholder="14-digit SIRET"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cfa.addressNumber">Address Number</Label>
                      <Input
                        id="cfa.addressNumber"
                        {...register("cachedData.cfa.addressNumber")}
                        placeholder="Street number"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cfa.addressStreet">Street</Label>
                      <Input
                        id="cfa.addressStreet"
                        {...register("cachedData.cfa.addressStreet")}
                        placeholder="Street name"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="cfa.addressComplement">Address Complement</Label>
                      <Input
                        id="cfa.addressComplement"
                        {...register("cachedData.cfa.addressComplement")}
                        placeholder="Building, floor, etc."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cfa.postalCode">Postal Code</Label>
                      <Input
                        id="cfa.postalCode"
                        {...register("cachedData.cfa.postalCode")}
                        placeholder="Postal code"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cfa.city">City</Label>
                      <Input
                        id="cfa.city"
                        {...register("cachedData.cfa.city")}
                        placeholder="City"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="training.targetDiploma">Target Diploma</Label>
                      <Input
                        id="training.targetDiploma"
                        {...register("cachedData.training.targetDiploma")}
                        placeholder="Target diploma"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="training.diplomaTitle">Diploma Title</Label>
                      <Input
                        id="training.diplomaTitle"
                        {...register("cachedData.training.diplomaTitle")}
                        placeholder="Diploma title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="training.diplomaCode">Diploma Code</Label>
                      <Input
                        id="training.diplomaCode"
                        {...register("cachedData.training.diplomaCode")}
                        placeholder="Diploma code"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="training.rncpCode">RNCP Code</Label>
                      <Input
                        id="training.rncpCode"
                        {...register("cachedData.training.rncpCode")}
                        placeholder="RNCP code"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="training.organization">Training Organization</Label>
                      <Input
                        id="training.organization"
                        {...register("cachedData.training.organization")}
                        placeholder="Organizing body"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="training.startDate">Training Start Date</Label>
                      <Input
                        id="training.startDate"
                        type="date"
                        {...register("cachedData.training.startDate")}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="training.endDate">Training End Date</Label>
                      <Input
                        id="training.endDate"
                        type="date"
                        {...register("cachedData.training.endDate")}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="training.hours">Training Hours</Label>
                      <Input
                        id="training.hours"
                        {...register("cachedData.training.hours")}
                        placeholder="Total training hours"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="remuneration">
            <AccordionTrigger className="text-lg font-semibold">
              Remuneration
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <h4 className="font-semibold mb-4">Year 1</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="remuneration.year1.startDate1">Period 1 Start</Label>
                        <Input
                          id="remuneration.year1.startDate1"
                          type="date"
                          {...register("cachedData.remuneration.year1.startDate1")}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="remuneration.year1.endDate1">Period 1 End</Label>
                        <Input
                          id="remuneration.year1.endDate1"
                          type="date"
                          {...register("cachedData.remuneration.year1.endDate1")}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="remuneration.year1.percentage1">Percentage</Label>
                        <Input
                          id="remuneration.year1.percentage1"
                          {...register("cachedData.remuneration.year1.percentage1")}
                          placeholder="e.g., 27"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="remuneration.year1.reference1">Reference</Label>
                        <Input
                          id="remuneration.year1.reference1"
                          {...register("cachedData.remuneration.year1.reference1")}
                          placeholder="SMIC, minimum wage, etc."
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="remuneration.monthlySalary">Monthly Salary</Label>
                      <Input
                        id="remuneration.monthlySalary"
                        {...register("cachedData.remuneration.monthlySalary")}
                        placeholder="Monthly salary amount"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="remuneration.retirementFund">Retirement Fund</Label>
                      <Input
                        id="remuneration.retirementFund"
                        {...register("cachedData.remuneration.retirementFund")}
                        placeholder="Retirement fund"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/contracts">Cancel</Link>
          </Button>
          
          <Button type="submit" disabled={createContract.isPending}>
            {createContract.isPending ? (
              <>Creating...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Contract
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
