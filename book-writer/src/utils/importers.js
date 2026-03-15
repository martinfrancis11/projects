import mammoth from 'mammoth';
import { createChapter } from './storage';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cleanText = (t) => t.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

/**
 * Try to split raw text into chapters.
 * Looks for lines like "Chapter 1", "CHAPTER ONE", "1.", etc.
 */
const splitIntoChapters = (text) => {
  const chapterHeadingRe = /^(chapter\s+[\w\d]+[.:—-]?\s*.{0,60})$/im;
  const lines = text.split('\n');

  const headingIndices = [];
  lines.forEach((line, i) => {
    if (chapterHeadingRe.test(line.trim()) && line.trim().length < 80) {
      headingIndices.push(i);
    }
  });

  if (headingIndices.length === 0) {
    // No chapter markers — treat whole text as one chapter
    return [{ title: 'Chapter 1', content: text }];
  }

  return headingIndices.map((startIdx, i) => {
    const endIdx = headingIndices[i + 1] ?? lines.length;
    const title = lines[startIdx].trim() || `Chapter ${i + 1}`;
    const content = lines.slice(startIdx + 1, endIdx).join('\n').trim();
    return { title, content };
  });
};

const buildChapters = (rawChapters) =>
  rawChapters.map((c, i) => ({
    ...createChapter(c.title || `Chapter ${i + 1}`),
    content: cleanText(c.content || ''),
  }));

// ─── PDF Import ───────────────────────────────────────────────────────────────

let pdfjsLib = null;

const getPdfJs = async () => {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import('pdfjs-dist');
  // Use the bundled worker via CDN to avoid bundler issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  return pdfjsLib;
};

export const importFromPDF = async (file) => {
  const pdfjs = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  const rawChapters = splitIntoChapters(fullText);
  const chapters = buildChapters(rawChapters);

  // Try to extract title from the first few lines
  const firstLines = fullText.split('\n').slice(0, 5).map((l) => l.trim()).filter(Boolean);
  const guessedTitle = firstLines[0] || file.name.replace(/\.pdf$/i, '');

  return { guessedTitle, chapters };
};

// ─── Word Import ──────────────────────────────────────────────────────────────

export const importFromWord = async (file) => {
  const arrayBuffer = await file.arrayBuffer();

  // Extract raw text
  const textResult = await mammoth.extractRawText({ arrayBuffer });
  const text = cleanText(textResult.value);

  // Also try HTML to detect headings for better chapter splitting
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const html = htmlResult.value;

  // Parse headings from HTML
  const parser = new DOMParser();
  const domDoc = parser.parseFromString(html, 'text/html');
  const headings = domDoc.querySelectorAll('h1, h2, h3');

  let chapters;
  if (headings.length > 0) {
    // Use heading structure for chapters
    const headingTexts = Array.from(headings).map((h) => h.textContent.trim());
    const textLines = text.split('\n');

    chapters = [];
    headingTexts.forEach((heading, i) => {
      const startIdx = textLines.findIndex((l) => l.trim() === heading);
      const nextHeading = headingTexts[i + 1];
      const endIdx = nextHeading
        ? textLines.findIndex((l, idx) => idx > startIdx && l.trim() === nextHeading)
        : textLines.length;

      const content = textLines.slice(startIdx + 1, endIdx).join('\n').trim();
      chapters.push({ title: heading, content });
    });
  } else {
    // Fallback: split by "Chapter" keyword
    chapters = splitIntoChapters(text);
  }

  const guessedTitle = file.name.replace(/\.(docx?|doc)$/i, '');
  return { guessedTitle, chapters: buildChapters(chapters) };
};
