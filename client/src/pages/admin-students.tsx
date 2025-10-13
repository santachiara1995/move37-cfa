import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, User, Search, Download, Upload, FileDown } from "lucide-react";
import type { Student, Tenant } from "@shared/schema";
import { format } from "date-fns";

interface CSVStudent {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  school: string;
  filizId: string;
  numeroOpco: string;
  numeroDekra: string;
  tenantId?: string;
}

export default function AdminStudents() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvData, setCsvData] = useState<CSVStudent[]>([]);

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/admin/students"],
  });

  const { data: schools = [] } = useQuery<Tenant[]>({
    queryKey: ["/api/admin/schools"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/admin/students", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      setIsOpen(false);
      toast({ title: "Success", description: "Student created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest("PUT", `/api/admin/students/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      setIsOpen(false);
      setEditingStudent(null);
      toast({ title: "Success", description: "Student updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      toast({ title: "Success", description: "Student deleted successfully" });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (data: any[]) => apiRequest("POST", "/api/admin/students/bulk", { students: data }),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      setIsImportOpen(false);
      setCsvData([]);
      toast({ 
        title: "Success", 
        description: `Imported ${result.count || csvData.length} students successfully` 
      });
    },
    onError: (error: any) => {
      console.error("Bulk import error:", error);
      const message = error?.message || error?.errors?.[0]?.message || "Failed to import students";
      toast({ 
        title: "Import Failed", 
        description: message,
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      tenantId: formData.get("tenantId") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      dateOfBirth: formData.get("dateOfBirth") ? new Date(formData.get("dateOfBirth") as string) : null,
      filizId: formData.get("filizId") as string || null,
      numeroOpco: formData.get("numeroOpco") as string || null,
      numeroDekra: formData.get("numeroDekra") as string || null,
    };

    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchQuery === "" ||
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTenant = selectedTenant === "all" || student.tenantId === selectedTenant;
    
    return matchesSearch && matchesTenant;
  });

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setIsOpen(true);
  };

  const openCreateDialog = () => {
    setEditingStudent(null);
    setIsOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      toast({ 
        title: "Invalid CSV", 
        description: "CSV must have headers and at least one data row",
        variant: "destructive"
      });
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const expectedHeaders = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'school', 'filizId', 'numeroOpco', 'numeroDekra'];
    
    const parsedData: CSVStudent[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const student: CSVStudent = {
        firstName: values[0] || '',
        lastName: values[1] || '',
        email: values[2] || '',
        phone: values[3] || '',
        dateOfBirth: values[4] || '',
        school: values[5] || '',
        filizId: values[6] || '',
        numeroOpco: values[7] || '',
        numeroDekra: values[8] || '',
      };

      // Try to match school by name or slug
      const school = schools.find(s => 
        s.name.toLowerCase() === student.school.toLowerCase() || 
        s.slug.toLowerCase() === student.school.toLowerCase()
      );
      
      if (school) {
        student.tenantId = school.id;
      }

      parsedData.push(student);
    }

    setCsvData(parsedData);
    toast({ 
      title: "CSV Parsed", 
      description: `Loaded ${parsedData.length} students from CSV` 
    });
  };

  const updateCSVStudent = (index: number, field: keyof CSVStudent, value: string) => {
    const updated = [...csvData];
    updated[index] = { ...updated[index], [field]: value };
    
    // Re-match school if school field changed
    if (field === 'school') {
      const school = schools.find(s => 
        s.name.toLowerCase() === value.toLowerCase() || 
        s.slug.toLowerCase() === value.toLowerCase()
      );
      updated[index].tenantId = school?.id;
    }
    
    setCsvData(updated);
  };

  const removeCSVStudent = (index: number) => {
    setCsvData(csvData.filter((_, i) => i !== index));
  };

  const isValidDate = (dateString: string): boolean => {
    if (!dateString || !dateString.trim()) return true; // Optional field
    
    // Check format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString.trim())) return false;
    
    // Check if it's a valid date
    const date = new Date(dateString.trim());
    return date instanceof Date && !isNaN(date.getTime());
  };

  const handleBulkImport = () => {
    // Validate required fields
    const missingFields = csvData.filter(s => !s.firstName || !s.lastName || !s.tenantId);
    if (missingFields.length > 0) {
      toast({ 
        title: "Validation Error", 
        description: `${missingFields.length} students missing required fields (firstName, lastName, or valid school)`,
        variant: "destructive"
      });
      return;
    }

    // Validate dates
    const invalidDates = csvData.filter(s => s.dateOfBirth && !isValidDate(s.dateOfBirth));
    if (invalidDates.length > 0) {
      toast({ 
        title: "Invalid Dates", 
        description: `${invalidDates.length} students have invalid date format. Use YYYY-MM-DD (e.g., 2000-01-15)`,
        variant: "destructive"
      });
      return;
    }

    const studentsToImport = csvData.map(s => ({
      firstName: s.firstName.trim(),
      lastName: s.lastName.trim(),
      email: s.email?.trim() || undefined,
      phone: s.phone?.trim() || undefined,
      dateOfBirth: s.dateOfBirth?.trim() || undefined,
      filizId: s.filizId?.trim() || undefined,
      numeroOpco: s.numeroOpco?.trim() || undefined,
      numeroDekra: s.numeroDekra?.trim() || undefined,
      tenantId: s.tenantId!,
    }));

    bulkImportMutation.mutate(studentsToImport);
  };

  const downloadTemplate = () => {
    const template = 'firstName,lastName,email,phone,dateOfBirth,school,filizId,numeroOpco,numeroDekra\nJohn,Doe,john@example.com,0612345678,2000-01-15,paris-nord,,,\nJane,Smith,jane@example.com,0687654321,1999-05-20,lyon-centre,,,';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-students">Students Management</h1>
          <p className="text-muted-foreground mt-1">Manage students across all schools</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open("/api/admin/export/students", "_blank")}
            data-testid="button-export-students"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-import-csv">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Import Students from CSV</DialogTitle>
              </DialogHeader>
              
              {csvData.length === 0 ? (
                <div className="space-y-4 py-6">
                  <div className="text-center">
                    <FileDown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload a CSV file with student data. Download the template to see the required format.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        onClick={downloadTemplate}
                        data-testid="button-download-template"
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        Download Template
                      </Button>
                      <Button
                        onClick={() => document.getElementById('csv-upload')?.click()}
                        data-testid="button-select-csv"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Select CSV File
                      </Button>
                    </div>
                    <input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      data-testid="input-csv-file"
                    />
                  </div>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm font-semibold mb-2">Expected CSV Format:</p>
                    <code className="text-xs font-mono block">
                      firstName,lastName,email,phone,dateOfBirth,school,filizId,numeroOpco,numeroDekra
                    </code>
                    <p className="text-xs text-muted-foreground mt-2">
                      • <strong>school</strong> can be school name or slug (e.g., "École Paris Nord" or "paris-nord")
                      <br />
                      • <strong>dateOfBirth</strong> format: YYYY-MM-DD
                      <br />
                      • Optional fields: email, phone, dateOfBirth, filizId, numeroOpco, numeroDekra
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      {csvData.length} student{csvData.length !== 1 ? 's' : ''} loaded. Review and edit below before importing.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCsvData([])}
                      data-testid="button-clear-csv"
                    >
                      Clear & Upload New
                    </Button>
                  </div>
                  
                  <div className="flex-1 overflow-auto border rounded-md">
                    <table className="w-full">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 text-sm font-semibold">First Name</th>
                          <th className="text-left p-2 text-sm font-semibold">Last Name</th>
                          <th className="text-left p-2 text-sm font-semibold">Email</th>
                          <th className="text-left p-2 text-sm font-semibold">Phone</th>
                          <th className="text-left p-2 text-sm font-semibold">Date of Birth</th>
                          <th className="text-left p-2 text-sm font-semibold">School</th>
                          <th className="text-left p-2 text-sm font-semibold">Filiz ID</th>
                          <th className="text-left p-2 text-sm font-semibold">N° OPCO</th>
                          <th className="text-left p-2 text-sm font-semibold">N° DEKRA</th>
                          <th className="text-right p-2 text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.map((student, index) => (
                          <tr key={index} className="border-b" data-testid={`csv-row-${index}`}>
                            <td className="p-2">
                              <Input
                                value={student.firstName}
                                onChange={(e) => updateCSVStudent(index, 'firstName', e.target.value)}
                                className={`h-8 ${!student.firstName ? 'border-destructive' : ''}`}
                                data-testid={`input-csv-firstname-${index}`}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={student.lastName}
                                onChange={(e) => updateCSVStudent(index, 'lastName', e.target.value)}
                                className={`h-8 ${!student.lastName ? 'border-destructive' : ''}`}
                                data-testid={`input-csv-lastname-${index}`}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={student.email}
                                onChange={(e) => updateCSVStudent(index, 'email', e.target.value)}
                                className="h-8"
                                data-testid={`input-csv-email-${index}`}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={student.phone}
                                onChange={(e) => updateCSVStudent(index, 'phone', e.target.value)}
                                className="h-8"
                                data-testid={`input-csv-phone-${index}`}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="date"
                                value={student.dateOfBirth}
                                onChange={(e) => updateCSVStudent(index, 'dateOfBirth', e.target.value)}
                                className={`h-8 ${student.dateOfBirth && !isValidDate(student.dateOfBirth) ? 'border-destructive' : ''}`}
                                data-testid={`input-csv-dob-${index}`}
                              />
                              {student.dateOfBirth && !isValidDate(student.dateOfBirth) && (
                                <p className="text-xs text-destructive mt-1">Invalid date format (use YYYY-MM-DD)</p>
                              )}
                            </td>
                            <td className="p-2">
                              <Input
                                value={student.school}
                                onChange={(e) => updateCSVStudent(index, 'school', e.target.value)}
                                className={`h-8 ${!student.tenantId ? 'border-destructive' : ''}`}
                                data-testid={`input-csv-school-${index}`}
                              />
                              {!student.tenantId && (
                                <p className="text-xs text-destructive mt-1">Invalid school</p>
                              )}
                            </td>
                            <td className="p-2">
                              <Input
                                value={student.filizId}
                                onChange={(e) => updateCSVStudent(index, 'filizId', e.target.value)}
                                className="h-8"
                                data-testid={`input-csv-filizid-${index}`}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={student.numeroOpco}
                                onChange={(e) => updateCSVStudent(index, 'numeroOpco', e.target.value)}
                                className="h-8"
                                data-testid={`input-csv-numeroopco-${index}`}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={student.numeroDekra}
                                onChange={(e) => updateCSVStudent(index, 'numeroDekra', e.target.value)}
                                className="h-8"
                                data-testid={`input-csv-numerodekra-${index}`}
                              />
                            </td>
                            <td className="p-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCSVStudent(index)}
                                className="h-8 w-8"
                                data-testid={`button-remove-csv-${index}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <DialogFooter className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCsvData([]);
                        setIsImportOpen(false);
                      }}
                      data-testid="button-cancel-import"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBulkImport}
                      disabled={bulkImportMutation.isPending || csvData.length === 0}
                      data-testid="button-confirm-import"
                    >
                      {bulkImportMutation.isPending ? "Importing..." : `Import ${csvData.length} Student${csvData.length !== 1 ? 's' : ''}`}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} data-testid="button-add-student">
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenantId">School</Label>
                <Select name="tenantId" defaultValue={editingStudent?.tenantId} required>
                  <SelectTrigger data-testid="select-student-school">
                    <SelectValue placeholder="Select a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={editingStudent?.firstName}
                    required
                    data-testid="input-student-firstname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={editingStudent?.lastName}
                    required
                    data-testid="input-student-lastname"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingStudent?.email || ""}
                    data-testid="input-student-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={editingStudent?.phone || ""}
                    data-testid="input-student-phone"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    defaultValue={editingStudent?.dateOfBirth ? format(new Date(editingStudent.dateOfBirth), 'yyyy-MM-dd') : ""}
                    data-testid="input-student-dob"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filizId">Filiz ID (optional)</Label>
                  <Input
                    id="filizId"
                    name="filizId"
                    defaultValue={editingStudent?.filizId || ""}
                    placeholder="External ID from Filiz"
                    data-testid="input-student-filizid"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroOpco">Numéro OPCO (optional)</Label>
                  <Input
                    id="numeroOpco"
                    name="numeroOpco"
                    defaultValue={editingStudent?.numeroOpco || ""}
                    placeholder="OPCO number"
                    data-testid="input-student-numeroopco"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroDekra">Numéro DEKRA (optional)</Label>
                  <Input
                    id="numeroDekra"
                    name="numeroDekra"
                    defaultValue={editingStudent?.numeroDekra || ""}
                    placeholder="DEKRA number"
                    data-testid="input-student-numerodekra"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-student">
                  {editingStudent ? "Update" : "Create"} Student
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-students"
          />
        </div>
        <Select value={selectedTenant} onValueChange={setSelectedTenant}>
          <SelectTrigger className="w-[200px]" data-testid="select-filter-school">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schools</SelectItem>
            {schools.map((school) => (
              <SelectItem key={school.id} value={school.id}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold">Name</th>
                  <th className="text-left p-4 font-semibold">School</th>
                  <th className="text-left p-4 font-semibold">Email</th>
                  <th className="text-left p-4 font-semibold">Phone</th>
                  <th className="text-left p-4 font-semibold">Date of Birth</th>
                  <th className="text-left p-4 font-semibold">N° OPCO</th>
                  <th className="text-left p-4 font-semibold">N° DEKRA</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const school = schools.find((s) => s.id === student.tenantId);
                  return (
                    <tr key={student.id} className="border-b hover-elevate" data-testid={`row-student-${student.id}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{student.firstName} {student.lastName}</div>
                            {student.filizId && (
                              <div className="text-xs text-muted-foreground font-mono">Filiz: {student.filizId}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{school?.name || "Unknown"}</span>
                      </td>
                      <td className="p-4 text-sm">{student.email || "-"}</td>
                      <td className="p-4 text-sm">{student.phone || "-"}</td>
                      <td className="p-4 text-sm">
                        {student.dateOfBirth ? format(new Date(student.dateOfBirth), 'PP') : "-"}
                      </td>
                      <td className="p-4 text-sm">{student.numeroOpco || "-"}</td>
                      <td className="p-4 text-sm">{student.numeroDekra || "-"}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(student)}
                            data-testid={`button-edit-student-${student.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Delete ${student.firstName} ${student.lastName}?`)) {
                                deleteMutation.mutate(student.id);
                              }
                            }}
                            data-testid={`button-delete-student-${student.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredStudents.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No students found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedTenant !== "all" ? "Try adjusting your filters" : "Get started by adding your first student"}
            </p>
            {!searchQuery && selectedTenant === "all" && (
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
