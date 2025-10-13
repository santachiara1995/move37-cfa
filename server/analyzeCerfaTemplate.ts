// Utility script to analyze CERFA template form fields
import { PDFDocument } from "pdf-lib";
import { readFileSync } from "fs";
import { join } from "path";

async function analyzeCerfaTemplate() {
  try {
    const templatePath = join(process.cwd(), "attached_assets", "Template fillable - CERFA 10103-10 VS_1760375538229.pdf");
    const templateBytes = readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log(`\n=== CERFA 10103*10 Form Fields (${fields.length} total) ===\n`);

    fields.forEach((field) => {
      const type = field.constructor.name;
      const name = field.getName();
      console.log(`Field: "${name}" (${type})`);
    });

    console.log("\n=== End of Form Fields ===\n");
  } catch (error) {
    console.error("Error analyzing template:", error);
  }
}

analyzeCerfaTemplate();
