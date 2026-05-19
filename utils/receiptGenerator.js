const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const generatePaymentReceipt = async (paymentData) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({ size: "A4", margin: 50 });

      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      const filename = `receipt-${paymentData.transactionId}-${Date.now()}.pdf`;
      const filepath = path.join(tempDir, filename);
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Professional Header
      doc.fontSize(24).font("Helvetica-Bold").text("RENTIFY", 50, 40);
      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Professional Property Management", 50, 68);

      // Horizontal line
      doc.moveTo(50, 85).lineTo(545, 85).stroke();

      // Receipt Title
      doc.fontSize(18).font("Helvetica-Bold").text("PAYMENT RECEIPT", 50, 110);
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          `Invoice #: ${paymentData.invoiceNumber || "INV-" + paymentData.transactionId}`,
          50,
          135,
        );
      doc.text(
        `Date: ${new Date(paymentData.createdAt).toLocaleDateString("en-IN")}`,
        50,
        153,
      );

      // Left Column - Payment Details
      doc.fontSize(11).font("Helvetica-Bold").text("Payment Details", 50, 185);
      doc.fontSize(10).font("Helvetica");
      doc.text(`Transaction ID: ${paymentData.transactionId}`, 50, 210);
      doc.text(
        `Payment Method: ${paymentData.paymentMethod?.toUpperCase() || "WALLET"}`,
        50,
        228,
      );
      doc.text(
        `Status: ${paymentData.status?.toUpperCase() || "COMPLETED"}`,
        50,
        246,
      );
      doc.text(
        `Paid On: ${new Date(paymentData.createdAt).toLocaleDateString("en-IN")} ${new Date(paymentData.createdAt).toLocaleTimeString("en-IN")}`,
        50,
        264,
      );

      // Tenant Information
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Tenant Information", 50, 300);
      doc.fontSize(10).font("Helvetica");
      const tenantName =
        `${paymentData.tenantId?.firstName || ""} ${paymentData.tenantId?.lastName || ""}`.trim();
      doc.text(`Name: ${tenantName}`, 50, 325);
      doc.text(`Email: ${paymentData.tenantId?.email || "N/A"}`, 50, 343);

      // Property Information
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Property Information", 300, 300);
      doc.fontSize(10).font("Helvetica");
      doc.text(
        `Property: ${paymentData.propertyId?.propertyName || "N/A"}`,
        300,
        325,
      );
      doc.text(
        `Location: ${paymentData.propertyId?.location || "N/A"}`,
        300,
        343,
      );

      // Horizontal line
      doc.moveTo(50, 380).lineTo(545, 380).stroke();

      // Amount Details
      doc.fontSize(11).font("Helvetica-Bold").text("Payment Amount", 50, 410);
      doc.fontSize(10).font("Helvetica");
      doc.text(
        `Monthly Rent: ₹${paymentData.propertyId?.rentAmount?.toLocaleString("en-IN") || "N/A"}`,
        50,
        435,
      );
      doc.text(
        `Amount Paid: ₹${paymentData.amount?.toLocaleString("en-IN")}`,
        50,
        453,
      );

      // Late Fees (if any)
      if (paymentData.lateFees && paymentData.lateFees > 0) {
        doc.fontSize(10).font("Helvetica");
        doc.text(
          `Late Fees: ₹${paymentData.lateFees.toLocaleString("en-IN")}`,
          50,
          471,
        );
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(
            `Total: ₹${(paymentData.amount + paymentData.lateFees).toLocaleString("en-IN")}`,
            50,
            489,
          );
      }

      // QR Code (with transaction details)
      const qrData = `TXN:${paymentData.transactionId}|AMT:${paymentData.amount}|DATE:${new Date(paymentData.createdAt).toLocaleDateString("en-IN")}`;
      const qrCodeImage = await QRCode.toDataURL(qrData);

      // Add QR Code to the right side
      doc.image(qrCodeImage, 450, 430, { width: 80, height: 80 });

      // Terms & Conditions
      doc.fontSize(9).font("Helvetica").text("Terms & Conditions:", 50, 530);
      doc
        .fontSize(8)
        .text(
          "This receipt serves as proof of payment. Please retain for your records. No objections will be entertained after 30 days of payment.",
          50,
          548,
          { width: 450, align: "left" },
        );

      // Footer
      doc
        .fontSize(8)
        .font("Helvetica")
        .text(
          "Rentify.software | Email: support@rentify.software | Phone: +91-XXXX-XXXX-XX",
          50,
          750,
          { width: 450, align: "center" },
        );
      doc.text(
        `Generated on ${new Date().toLocaleDateString("en-IN")} at ${new Date().toLocaleTimeString("en-IN")}`,
        50,
        765,
        { width: 450, align: "center" },
      );

      // Finalize PDF
      doc.end();

      stream.on("finish", () => {
        resolve({ filepath, filename });
      });

      stream.on("error", (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generatePaymentReceipt };
