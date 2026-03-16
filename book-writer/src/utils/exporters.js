import jsPDF from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  convertInchesToTwip,
  PageOrientation,
  BorderStyle,
  ImageRun,
} from 'docx';

// ─── KDP 6×9 Constants ────────────────────────────────────────────────────────
//
// Amazon KDP recommended trim: 6" × 9"
// KDP required margins (for up to 700 pages, gutter 0.75"):
//   Outside : 0.5"  (12.7 mm)
//   Inside  : 0.75" (19.05 mm)  ← gutter side
//   Top     : 0.75" (19.05 mm)
//   Bottom  : 0.75" (19.05 mm)
//
// Mirror margins: odd (recto) pages have gutter on LEFT,
//                 even (verso) pages have gutter on RIGHT.

const KDP = {
  W: 152.4,   // mm  (6")
  H: 228.6,   // mm  (9")
  marginTop:     19.05,  // 0.75"
  marginBottom:  19.05,  // 0.75"
  marginOutside: 12.7,   // 0.5"
  marginInside:  19.05,  // 0.75" gutter
  headerY:        10,    // mm from top of page
  footerY:       (228.6 - 7), // mm from top (near bottom)
  bodyFontSize:  11,
  lineHeight:    6.5,    // mm — ~1.3× for 11pt
  headingFontPt: 18,
  subheadFontPt: 10,
};

// Text area width (same regardless of which side the gutter is on)
KDP.textWidth = KDP.W - KDP.marginInside - KDP.marginOutside; // 120.65 mm

// Left margin for recto (odd) pages — gutter on left
const rectoLeft  = KDP.marginInside;
// Left margin for verso (even) pages — gutter on right
const versoLeft  = KDP.marginOutside;

// ─── PDF Export ───────────────────────────────────────────────────────────────

export const exportToPDF = async (book) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [KDP.W, KDP.H],
    orientation: 'portrait',
    putOnlyUsedFonts: true,
    compress: true,
  });

  let pageNum = 0; // 0-indexed internally; page 1 = title page (no number printed)

  // Returns the left margin for the current page (mirror margins)
  const leftMargin = () => (pageNum % 2 === 1 ? rectoLeft : versoLeft);
  const rightMargin = () => (pageNum % 2 === 1 ? KDP.marginOutside : KDP.marginInside);

  const fillPage = () => {
    doc.setFillColor(252, 248, 240);
    doc.rect(0, 0, KDP.W, KDP.H, 'F');
  };

  // Running header (not on chapter-opening pages)
  const addRunningHeader = (chapterTitle) => {
    doc.setFont('Times', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 90, 65);

    const lm = leftMargin();
    const rm = rightMargin();

    if (pageNum % 2 === 0) {
      // Verso (even): book title flush-left (outer edge)
      doc.text(book.title, lm, KDP.headerY);
    } else {
      // Recto (odd): chapter title flush-right (outer edge)
      doc.text(chapterTitle, KDP.W - rm, KDP.headerY, { align: 'right' });
    }

    // Thin rule under header
    doc.setDrawColor(180, 150, 110);
    doc.setLineWidth(0.25);
    doc.line(lm, KDP.headerY + 2, KDP.W - rm, KDP.headerY + 2);
  };

  // Page number: bottom outer corner (verso→left, recto→right)
  const addPageNumber = (displayNum) => {
    doc.setFont('Times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 80, 60);

    const lm = leftMargin();
    const rm = rightMargin();

    if (pageNum % 2 === 0) {
      // Verso: page number at bottom-left (outer)
      doc.text(String(displayNum), lm, KDP.footerY);
    } else {
      // Recto: page number at bottom-right (outer)
      doc.text(String(displayNum), KDP.W - rm, KDP.footerY, { align: 'right' });
    }
  };

  // ── Half-Title Page (page i — not numbered) ──────────────────────────────────
  pageNum = 1;
  fillPage();
  doc.setFont('Times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(44, 26, 14);
  doc.text(book.title, KDP.W / 2, KDP.H * 0.35, { align: 'center' });

  // ── Verso Blank / Copyright (page ii) ────────────────────────────────────────
  doc.addPage();
  pageNum = 2;
  fillPage();
  doc.setFont('Times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 65, 45);
  const year = new Date(book.createdAt).getFullYear();
  const copyrightLines = [
    `Copyright © ${year} ${book.author}`,
    'All rights reserved.',
    '',
    'No part of this publication may be reproduced,',
    'distributed, or transmitted in any form or by any means,',
    'without the prior written permission of the author.',
    '',
    `First published ${year}`,
    '',
    `Genre: ${book.genre}`,
  ];
  let cpY = KDP.H * 0.72;
  copyrightLines.forEach((line) => {
    doc.text(line, KDP.W / 2, cpY, { align: 'center' });
    cpY += 4.5;
  });

  // ── Title Page (page iii — recto) ────────────────────────────────────────────
  doc.addPage();
  pageNum = 3;
  fillPage();

  // Decorative border
  doc.setDrawColor(180, 140, 80);
  doc.setLineWidth(0.6);
  doc.rect(rectoLeft - 4, 10, KDP.textWidth + 8, KDP.H - 20);
  doc.setLineWidth(0.2);
  doc.rect(rectoLeft - 2, 12, KDP.textWidth + 4, KDP.H - 24);

  doc.setFont('Times', 'bold');
  doc.setTextColor(44, 26, 14);
  const titleLines = doc.splitTextToSize(book.title, KDP.textWidth - 10);
  let tFontSize = 30;
  if (titleLines.length > 2) tFontSize = 24;
  doc.setFontSize(tFontSize);
  doc.text(titleLines, KDP.W / 2, KDP.H * 0.36, { align: 'center' });

  const afterTitleY = KDP.H * 0.36 + tFontSize * 0.38 * titleLines.length + 5;
  doc.setDrawColor(180, 140, 80);
  doc.setLineWidth(0.4);
  doc.line(KDP.W / 2 - 20, afterTitleY, KDP.W / 2 + 20, afterTitleY);

  doc.setFont('Times', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(90, 65, 35);
  doc.text(book.author, KDP.W / 2, afterTitleY + 10, { align: 'center' });

  doc.setFont('Times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(130, 105, 70);
  doc.text(book.genre.toUpperCase(), KDP.W / 2, afterTitleY + 18, { align: 'center' });

  // ── Table of Contents (page iv — verso) ──────────────────────────────────────
  doc.addPage();
  pageNum = 4;
  fillPage();
  addRunningHeader('Contents');

  doc.setFont('Times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(44, 26, 14);
  doc.text('Contents', KDP.W / 2, KDP.marginTop + 8, { align: 'center' });

  // Estimate chapter start pages: pages 1-4 = front matter, chapters start at page 5
  // Each chapter: at least 1 page
  let estimatedPage = 5;
  let tocY = KDP.marginTop + 22;
  doc.setFontSize(KDP.bodyFontSize);

  book.chapters.forEach((ch, idx) => {
    const lm = leftMargin();
    const rm = rightMargin();
    doc.setFont('Times', 'normal');
    doc.setTextColor(44, 26, 14);
    const label = `${idx + 1}.\u2003${ch.title}`;
    doc.text(label, lm + 4, tocY);
    const pageStr = String(estimatedPage);
    const labelW = doc.getTextWidth(label);
    const pageW = doc.getTextWidth(pageStr);
    const dotStart = lm + 4 + labelW + 1;
    const dotEnd = KDP.W - rm - 4 - pageW - 1;
    doc.setTextColor(160, 130, 90);
    for (let x = dotStart; x < dotEnd; x += 2.8) doc.text('.', x, tocY);
    doc.setTextColor(44, 26, 14);
    doc.text(pageStr, KDP.W - rm - 4, tocY, { align: 'right' });
    tocY += 8;
    estimatedPage += Math.max(1, Math.ceil((ch.content || '').split(/\n+/).filter(Boolean).length * 1.5 / 30));
  });

  // ── Chapters ──────────────────────────────────────────────────────────────────
  // Page numbers for body start at arabic 1 from chapter 1
  let arabicNum = 1;

  for (let chIdx = 0; chIdx < book.chapters.length; chIdx++) {
    const chapter = book.chapters[chIdx];

    // Ensure chapters start on a recto (odd) page — KDP standard
    doc.addPage();
    pageNum++;
    if (pageNum % 2 === 0) {
      fillPage();
      doc.addPage();
      pageNum++;
      arabicNum++;
    }

    fillPage();

    const lm = leftMargin();

    // "Chapter N" label
    doc.setFont('Times', 'italic');
    doc.setFontSize(KDP.subheadFontPt);
    doc.setTextColor(130, 105, 70);
    doc.text(`Chapter ${chIdx + 1}`, KDP.W / 2, KDP.marginTop + 14, { align: 'center' });

    // Chapter title
    doc.setFont('Times', 'bold');
    doc.setFontSize(KDP.headingFontPt);
    doc.setTextColor(30, 18, 8);
    const chTitleLines = doc.splitTextToSize(chapter.title, KDP.textWidth);
    doc.text(chTitleLines, KDP.W / 2, KDP.marginTop + 24, { align: 'center' });

    // Ornamental separator
    doc.setFont('Times', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(140, 110, 75);
    const sepY = KDP.marginTop + 24 + chTitleLines.length * 7 + 8;
    doc.text('* * *', KDP.W / 2, sepY, { align: 'center' });

    // Chapter image (if present)
    let y = sepY + 12;
    if (chapter.imageUrl) {
      try {
        const imgDataURL = await fetchAsDataURL(chapter.imageUrl);
        const aspect = chapter.imageHeight && chapter.imageWidth
          ? chapter.imageHeight / chapter.imageWidth : 0.75;
        const imgW = Math.min(KDP.textWidth, 100);
        const imgH = imgW * aspect;
        const imgX = lm + (KDP.textWidth - imgW) / 2;
        const imageType = imgDataURL.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(imgDataURL, imageType, imgX, y, imgW, imgH);
        y += imgH + 10;
      } catch (e) {
        console.warn('Could not load chapter image for PDF:', e);
      }
    }

    // Body text
    const paragraphs = (chapter.content || '').split(/\n+/).filter(Boolean);
    const bottomBoundary = KDP.H - KDP.marginBottom;

    doc.setFont('Times', 'normal');
    doc.setFontSize(KDP.bodyFontSize);
    doc.setTextColor(20, 12, 4);

    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const para = paragraphs[pIdx];
      const textX = pageNum % 2 === 1 ? rectoLeft : versoLeft;
      const paraLines = doc.splitTextToSize(para, KDP.textWidth);

      if (y + paraLines.length * KDP.lineHeight > bottomBoundary) {
        addPageNumber(arabicNum);
        doc.addPage();
        pageNum++;
        arabicNum++;
        fillPage();
        addRunningHeader(chapter.title);
        y = KDP.marginTop + 2;
      }

      const indent = pIdx === 0 ? 0 : 7.6;
      doc.text(paraLines, textX + indent, y, { align: 'justify', maxWidth: KDP.textWidth - indent });
      y += paraLines.length * KDP.lineHeight + 1.5;
    }

    addPageNumber(arabicNum);
    arabicNum++;
  }

  doc.save(`${sanitizeFilename(book.title)}_KDP_6x9.pdf`);
};

// ─── Word Export (KDP 6×9) ────────────────────────────────────────────────────

export const exportToWord = async (book) => {
  const in2t = convertInchesToTwip;
  const year = new Date(book.createdAt).getFullYear();

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const bodyPara = (text, firstInChapter = false) =>
    new Paragraph({
      children: [new TextRun({ text, font: 'Times New Roman', size: 22 })],
      alignment: AlignmentType.JUSTIFIED,
      indent: firstInChapter ? undefined : { firstLine: in2t(0.3) },
      spacing: { line: 276, lineRule: 'auto', after: 0 },
    });

  const spacer = (before = 0) =>
    new Paragraph({ children: [new TextRun('')], spacing: { before } });

  // ── All content in a single section (most Word-compatible) ───────────────────
  const children = [

    // ── Half-title ──────────────────────────────────────────────────────────────
    new Paragraph({
      children: [new TextRun({ text: book.title, bold: true, size: 48, font: 'Times New Roman' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: in2t(2.5), after: in2t(0.5) },
    }),
    new Paragraph({ children: [new PageBreak()] }),

    // ── Copyright ───────────────────────────────────────────────────────────────
    spacer(in2t(4)),
    new Paragraph({
      children: [new TextRun({ text: `Copyright \u00A9 ${year} ${book.author}`, size: 18, font: 'Times New Roman' })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'All rights reserved.', size: 18, font: 'Times New Roman' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: in2t(0.2) },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Genre: ${book.genre}`, size: 18, font: 'Times New Roman', italics: true })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ children: [new PageBreak()] }),

    // ── Title page ──────────────────────────────────────────────────────────────
    spacer(in2t(1.5)),
    new Paragraph({
      children: [new TextRun({ text: book.title, bold: true, size: 56, font: 'Times New Roman' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: in2t(0.3) },
    }),
    new Paragraph({
      children: [new TextRun({ text: `by ${book.author}`, italics: true, size: 28, font: 'Times New Roman', color: '6B4E2A' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: in2t(0.15) },
    }),
    new Paragraph({
      children: [new TextRun({ text: book.genre.toUpperCase(), size: 18, font: 'Times New Roman', color: '8C7050' })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ children: [new PageBreak()] }),

    // ── Table of Contents ────────────────────────────────────────────────────────
    new Paragraph({
      children: [new TextRun({ text: 'Contents', bold: true, size: 36, font: 'Times New Roman' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: in2t(0.5), after: in2t(0.4) },
    }),
    ...book.chapters.map((ch, idx) =>
      new Paragraph({
        children: [new TextRun({ text: `${idx + 1}.\u2003${ch.title}`, font: 'Times New Roman', size: 22 })],
        spacing: { after: in2t(0.1) },
        indent: { left: in2t(0.3) },
      })
    ),
    new Paragraph({ children: [new PageBreak()] }),

  ];

  // ── Chapters (built with for loop to support async image loading) ─────────────
  for (let idx = 0; idx < book.chapters.length; idx++) {
    const chapter = book.chapters[idx];
    const paras = (chapter.content || '').split(/\n+/).filter(Boolean);
    const isLast = idx === book.chapters.length - 1;

    children.push(
      spacer(in2t(1.2)),
      new Paragraph({
        children: [new TextRun({ text: `Chapter ${idx + 1}`, italics: true, size: 20, font: 'Times New Roman', color: '8C7050' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: in2t(0.1) },
      }),
      new Paragraph({
        children: [new TextRun({ text: chapter.title, bold: true, size: 36, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: in2t(0.4) },
      }),
      new Paragraph({
        children: [new TextRun({ text: '* * *', size: 22, font: 'Times New Roman', color: '8C7050' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: in2t(0.35) },
      }),
    );

    if (chapter.imageUrl) {
      try {
        const dataURL = await fetchAsDataURL(chapter.imageUrl);
        const base64 = dataURL.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const maxWidthEmu = 914400 * 4;
        const aspect = chapter.imageHeight && chapter.imageWidth
          ? chapter.imageHeight / chapter.imageWidth : 0.75;
        const heightEmu = Math.round(maxWidthEmu * aspect);
        const imgType = dataURL.startsWith('data:image/png') ? 'png' : 'jpg';
        children.push(new Paragraph({
          children: [new ImageRun({ data: bytes, transformation: { width: maxWidthEmu, height: heightEmu }, type: imgType })],
          alignment: AlignmentType.CENTER,
          spacing: { after: in2t(0.25) },
        }));
      } catch (e) {
        console.warn('Could not load chapter image for Word:', e);
      }
    }

    children.push(...paras.map((p, pIdx) => bodyPara(p, pIdx === 0)));
    if (!isLast) children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // ── Document ─────────────────────────────────────────────────────────────────
  const wordDoc = new Document({
    title: book.title,
    creator: book.author,
    description: `${book.genre} \u2014 Amazon KDP 6\u00D79 format`,
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.PORTRAIT,
              width:  in2t(6),
              height: in2t(9),
            },
            margin: {
              top:    in2t(0.75),
              bottom: in2t(0.75),
              left:   in2t(0.75),
              right:  in2t(0.5),
              header: in2t(0.4),
              footer: in2t(0.4),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: book.title, italics: true, size: 16, color: '7A6040' }),
                  new TextRun({ text: '   \u2014   ', size: 16, color: 'B09060' }),
                  new TextRun({ text: book.author, italics: true, size: 16, color: '7A6040' }),
                ],
                alignment: AlignmentType.CENTER,
                border: {
                  bottom: { color: 'C8A870', size: 4, space: 4, style: BorderStyle.SINGLE },
                },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: '7A6040',
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(wordDoc);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${sanitizeFilename(book.title)}_KDP_6x9.docx`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Util ─────────────────────────────────────────────────────────────────────
const sanitizeFilename = (name) => name.replace(/[^a-z0-9\-_ ]/gi, '_').trim();

const fetchAsDataURL = (url) =>
  fetch(url)
    .then(r => r.blob())
    .then(blob => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
