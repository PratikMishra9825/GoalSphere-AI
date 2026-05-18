const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function testPdf() {
  try {
    const pdfBytes = fs.readFileSync('test-output.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    console.log('SUCCESS: pdf-lib successfully loaded the PDF.');
    console.log('Number of pages:', pdfDoc.getPageCount());
  } catch (error) {
    console.error('FAILED TO LOAD PDF:');
    console.error(error);
  }
}

testPdf();
