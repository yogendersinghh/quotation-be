const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs').promises;
const Quotation = require('../models/Quotation');
const Client = require('../models/Client');
const asyncHandler = require('express-async-handler');

// Generate PDF from quotation ID
const generateQuotationPDF = asyncHandler(async (req, res) => {
    try {
        const { quotationId } = req.params;

        // Find quotation with populated data
        const quotation = await Quotation.findById(quotationId)
            .populate('client')
            .populate('createdBy');

        if (!quotation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Quotation not found' 
            });
        }

        // Read the EJS template
        const templatePath = path.join(__dirname, '../views/quotation.ejs');
        const templateContent = await fs.readFile(templatePath, 'utf8');

        // Render the template with data
        const htmlContent = ejs.render(templateContent, {
            quotation,
            client: quotation.client,
            user: quotation.createdBy
        });

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set content and wait for network idle
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Define header HTML for every page
        const headerTemplate = `
          <div style="width:100%;padding:0 16px;box-sizing:border-box;">
            <div style="display:flex;align-items:flex-start;gap:10px;">
            //   <img src='https://via.placeholder.com/40x40/ff9900/ffffff?text=LOGO' style='width:40px;height:auto;margin:0;'>
              <div>
                <div style='font-size:18px;font-weight:bold;color:#222;'>FIVE STAR TECHNOLOGIES</div>
                <div style='font-size:10px;color:#111;'>
                  Address: C-177, Sector-10, Noida - 201301<br>
                  Ph: (0120)4548366, email: info@fstindia.in, fivestartech.net@gmail.com<br>
                  website: www.fstindia.in
                </div>
                <div style='font-size:12px;color:#003366;font-weight:bold;margin-top:2px;'>
                  FIVE STAR helps industries to efficiently manage <span style='color:#003366;'>LIGHT I AIR I ENERGY</span> in partnership with leading brands of India
                </div>
              </div>
            </div>
          </div>
        `;

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                // top: '80px', // enough space for header
                // right: '10mm',
                // bottom: '10mm',
                // left: '10mm'
            },
            displayHeaderFooter: true,
            headerTemplate: headerTemplate,
            footerTemplate: '<span></span>'
        });

        await browser.close();

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="quotation-${quotation.quotationRefNumber}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF buffer
        res.send(pdfBuffer);

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error generating PDF',
            error: error.message 
        });
    }
});

// Generate PDF and save to file system
const generateAndSavePDF = asyncHandler(async (req, res) => {
    try {
        const { quotationId } = req.params;

        // Find quotation with populated data
        const quotation = await Quotation.findById(quotationId)
            .populate({
                path: 'products.product',
                populate: {
                    path: 'model',
                    model: 'Model'
                }
            })
            .populate('client')
            .populate('createdBy');

        if (!quotation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Quotation not found' 
            });
        }

        // Read the EJS template
        const templatePath = path.join(__dirname, '../views/quotation.ejs');
        const templateContent = await fs.readFile(templatePath, 'utf8');

        // Render the template with data
        const htmlContent = ejs.render(templateContent, {
            quotation,
            client: quotation.client,
            user: quotation.createdBy,
            BASE_URL: process.env.BASE_URL
        });

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set content and wait for network idle
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Define header HTML for every page
        const headerTemplate = `
          <div style="width:100%;padding:0 16px;box-sizing:border-box;">
            <div style="display:flex;align-items:flex-start;gap:10px;">
              <img src='https://via.placeholder.com/40x40/ff9900/ffffff?text=LOGO' style='width:40px;height:auto;margin:0;'>
              <div>
                <div style='font-size:18px;font-weight:bold;color:#222;'>FIVE STAR TECHNOLOGIES</div>
                <div style='font-size:10px;color:#111;'>
                  Address: C-177, Sector-10, Noida - 201301<br>
                  Ph: (0120)4548366, email: info@fstindia.in, fivestartech.net@gmail.com<br>
                  website: www.fstindia.in
                </div>
                <div style='font-size:12px;color:#003366;font-weight:bold;margin-top:2px;'>
                  FIVE STAR helps industries to efficiently manage <span style='color:#003366;'>LIGHT I AIR I ENERGY</span> in partnership with leading brands of India
                </div>
              </div>
            </div>
          </div>
        `;

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '90px', // enough space for header
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            },
            displayHeaderFooter: true,
            headerTemplate: headerTemplate,
            footerTemplate: '<span></span>'
        });

        await browser.close();

        // Create PDFs directory if it doesn't exist
        const pdfsDir = path.join(__dirname, '../../public/pdfs');
        await fs.mkdir(pdfsDir, { recursive: true });

        // Save PDF to file system
        const fileName = `quotation-${quotation.quotationRefNumber}-${Date.now()}.pdf`;
        const filePath = path.join(pdfsDir, fileName);
        await fs.writeFile(filePath, pdfBuffer);

        // Attach the filename to the quotation document
        quotation.pdfFileName = fileName;
        await quotation.save();

        // Return file path and download URL
        const downloadUrl = `/public/pdfs/${fileName}`;

        res.json({
            success: true,
            message: 'PDF generated successfully',
            data: {
                fileName,
                filePath,
                downloadUrl,
                quotationRefNumber: quotation.quotationRefNumber
            }
        });

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error generating PDF',
            error: error.message 
        });
    }
});

// Preview quotation as HTML
const previewQuotation = asyncHandler(async (req, res) => {
    try {
        const { quotationId } = req.params;

        // Find quotation with populated data
        const quotation = await Quotation.findById(quotationId)
            .populate({
                path: 'products.product',
                populate: {
                    path: 'model',
                    model: 'Model'
                }
            })
            .populate('client')
            .populate('createdBy');

        if (!quotation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Quotation not found' 
            });
        }

        // Read the EJS template
        const templatePath = path.join(__dirname, '../views/quotation.ejs');
        const templateContent = await fs.readFile(templatePath, 'utf8');

        // Render the template with data
        const htmlContent = ejs.render(templateContent, {
            quotation,
            client: quotation.client,
            user: quotation.createdBy,
            BASE_URL:process.env.BASE_URL
        });

        // Send HTML content
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);

    } catch (error) {
        console.error('Preview Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error generating preview',
            error: error.message 
        });
    }
});

module.exports = {
    generateQuotationPDF,
    generateAndSavePDF,
    previewQuotation
}; 