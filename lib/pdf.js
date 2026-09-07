const GREEN = [11, 107, 58];
const GREEN_DARK = [8, 74, 40];
const GOLD = [244, 182, 61];
const INK = [26, 32, 27];
const MUTED = [110, 118, 112];
const LINE = [225, 228, 220];
const ROW_ALT = [246, 248, 243];
const NOTE_BG = [255, 247, 230];

const MARGIN_X = 44;
const HEADER_HEIGHT = 84;
const SUBHEADER_HEIGHT = 60;
const PHOTO_BOX_SIZE = 46;

async function loadLogoDataUrl() {
  try {
    const response = await fetch("/logo.png");
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not load logo."));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function loadImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
    img.onerror = () => resolve({ width: 1, height: 1 });
    img.src = dataUrl;
  });
}

function imageFormatFor(type) {
  return type?.includes("png") ? "PNG" : "JPEG";
}

// Fits an image inside a square box without distorting its aspect ratio
// (like CSS `object-fit: contain`), returning the draw rect centered in the box.
function containFit(naturalWidth, naturalHeight, boxSize) {
  const scale = Math.min(boxSize / naturalWidth, boxSize / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  return { width, height, offsetX: (boxSize - width) / 2, offsetY: (boxSize - height) / 2 };
}

// Builds a branded, multi-section registration confirmation PDF. Returns the
// jsPDF document -- call doc.save(filename) to trigger the download.
export async function generateRegistrationPdf({
  orgName,
  orgTagline,
  documentTitle,
  registrationId,
  submittedAt,
  photo,
  sections,
  notes = [],
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN_X * 2;

  const [logoDataUrl, photoDims] = await Promise.all([
    loadLogoDataUrl(),
    photo?.data ? loadImageDimensions(photo.data) : Promise.resolve(null),
  ]);

  function drawPageHeader() {
    doc.setFillColor(...GREEN);
    doc.rect(0, 0, pageWidth, HEADER_HEIGHT, "F");
    doc.setFillColor(...GOLD);
    doc.rect(0, HEADER_HEIGHT, pageWidth, 3, "F");

    let textX = MARGIN_X;
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, "PNG", MARGIN_X, 14, 52, 52);
        textX = MARGIN_X + 64;
      } catch {
        // Skip the logo if it can't be decoded.
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(orgName, textX, 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.text(orgTagline, textX, 52);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(255, 226, 150);
    doc.text(documentTitle.toUpperCase(), textX, 68);

    doc.setFillColor(...ROW_ALT);
    doc.rect(0, HEADER_HEIGHT + 3, pageWidth, SUBHEADER_HEIGHT, "F");
    doc.setDrawColor(...LINE);
    doc.line(0, HEADER_HEIGHT + 3 + SUBHEADER_HEIGHT, pageWidth, HEADER_HEIGHT + 3 + SUBHEADER_HEIGHT);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...GREEN_DARK);
    doc.text("REGISTRATION ID", MARGIN_X, HEADER_HEIGHT + 25);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(String(registrationId), MARGIN_X, HEADER_HEIGHT + 41);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...GREEN_DARK);
    doc.text("SUBMITTED ON", MARGIN_X + 220, HEADER_HEIGHT + 25);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(String(submittedAt), MARGIN_X + 220, HEADER_HEIGHT + 41);

    if (photo?.data && photoDims) {
      const size = PHOTO_BOX_SIZE;
      const x = pageWidth - MARGIN_X - size;
      const y = HEADER_HEIGHT + 3 + (SUBHEADER_HEIGHT - size) / 2;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x - 3, y - 3, size + 6, size + 6, 4, 4, "F");
      doc.setDrawColor(...GREEN);
      doc.setLineWidth(1);
      doc.roundedRect(x - 3, y - 3, size + 6, size + 6, 4, 4, "S");
      try {
        const fit = containFit(photoDims.width, photoDims.height, size);
        doc.addImage(
          photo.data,
          imageFormatFor(photo.type),
          x + fit.offsetX,
          y + fit.offsetY,
          fit.width,
          fit.height
        );
      } catch {
        // Skip the photo if it can't be decoded (e.g. unsupported image type).
      }
    }

    return HEADER_HEIGHT + 3 + SUBHEADER_HEIGHT + 26;
  }

  let y = drawPageHeader();

  function ensureSpace(nextBlockHeight) {
    if (y + nextBlockHeight > pageHeight - 70) {
      doc.addPage();
      y = drawPageHeader();
    }
  }

  const labelWidth = 150;

  for (const section of sections) {
    ensureSpace(30);
    doc.setFillColor(...GREEN);
    doc.rect(MARGIN_X, y - 11, 3, 14, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...GREEN_DARK);
    doc.text(section.heading.toUpperCase(), MARGIN_X + 10, y);
    y += 14;
    doc.setDrawColor(...LINE);
    doc.line(MARGIN_X, y, pageWidth - MARGIN_X, y);
    y += 6;

    section.rows.forEach(([label, value], rowIndex) => {
      const valueStr = String(value ?? "").trim() || "-";
      const valueLines = doc.splitTextToSize(valueStr, contentWidth - labelWidth - 10);
      const rowHeight = Math.max(18, 14 * valueLines.length + 6);
      ensureSpace(rowHeight);

      if (rowIndex % 2 === 0) {
        doc.setFillColor(...ROW_ALT);
        doc.rect(MARGIN_X, y - 12, contentWidth, rowHeight, "F");
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...MUTED);
      doc.text(label.toUpperCase(), MARGIN_X + 8, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(...INK);
      doc.text(valueLines, MARGIN_X + labelWidth, y);

      y += rowHeight;
    });
    y += 14;
  }

  if (notes.length) {
    const lineHeight = 15;
    ensureSpace(20 + notes.length * lineHeight);
    const boxHeight = 14 + notes.length * lineHeight;
    doc.setFillColor(...NOTE_BG);
    doc.roundedRect(MARGIN_X, y - 10, contentWidth, boxHeight, 6, 6, "F");
    doc.setDrawColor(...GOLD);
    doc.roundedRect(MARGIN_X, y - 10, contentWidth, boxHeight, 6, 6, "S");

    let noteY = y + 6;
    for (const note of notes) {
      doc.setFillColor(...GOLD);
      doc.rect(MARGIN_X + 12, noteY - 7, 5, 5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...GREEN_DARK);
      doc.text(note, MARGIN_X + 24, noteY);
      noteY += lineHeight;
    }
    y += boxHeight + 16;
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.line(MARGIN_X, pageHeight - 50, pageWidth - MARGIN_X, pageHeight - 50);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text("This is a system-generated confirmation.", MARGIN_X, pageHeight - 34);
    doc.setFont("helvetica", "normal");
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - MARGIN_X, pageHeight - 34, { align: "right" });
  }

  return doc;
}
