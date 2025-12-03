// backend/services/PdfGenerationService.js
'use strict';

/**
 * PDFGenerationService (ESM)
 * - puppeteer (HTML -> PDF)
 * - sharp (image optimize)
 * - node-fetch (fetch images)
 * - pdf-lib (post-process: page numbers, watermark, metadata)
 *
 * Export: default class PDFGenerationService
 */

import puppeteer from 'puppeteer';
import sharp from 'sharp';
import fetch from 'node-fetch';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { URL } from 'url';

const DEFAULTS = {
  pageSize: 'A4',
  margins: { top: '18mm', bottom: '18mm', left: '15mm', right: '15mm' },
  dpi: 150,
  maxImageWidthPx: 2250,
  maxImageHeightPx: 3000,
  imageQuality: 85,
  inlineRemoteImages: true,
  allowLocalFileImages: false,
  userAgent: 'QuestionPaperPDFGenerator/1.0',
  waitUntil: 'networkidle0',
  launchOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // executablePath can be provided in constructor config
  },
};

class PDFGenerationService {
  constructor(config = {}) {
    this.config = { ...DEFAULTS, ...config };
    this.config.margins = { ...DEFAULTS.margins, ...(config.margins || {}) };
    this.config.launchOptions = { ...DEFAULTS.launchOptions, ...(config.launchOptions || {}) };
    this.baseUrl = config.baseUrl || process.env.APP_BASE_URL || null;
  }

  // -------------------------
  // Image optimization helpers
  // -------------------------
  async optimizeImageBuffer(buffer, opts = {}) {
    const maxW = opts.maxImageWidthPx || this.config.maxImageWidthPx;
    const maxH = opts.maxImageHeightPx || this.config.maxImageHeightPx;
    const quality = opts.imageQuality || this.config.imageQuality;
    try {
      return await sharp(buffer)
        .rotate()
        .resize({ width: maxW, height: maxH, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality })
        .toBuffer();
    } catch (err) {
      console.warn('optimizeImageBuffer failed, returning original:', err.message);
      return buffer;
    }
  }

  async fetchAndOptimizeImageAsDataUrl(url, opts = {}) {
    if (!url) throw new Error('No URL provided for image fetch');
    if (!/^https?:\/\//i.test(url)) throw new Error('Only http(s) images are supported for fetching');

    const res = await fetch(url, { timeout: 30000 });
    if (!res.ok) throw new Error(`Image fetch failed: ${res.status} ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const optimized = await this.optimizeImageBuffer(buffer, opts);
    const base64 = optimized.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  }

  resolveRelativeUrl(pathOrUrl) {
    const baseUrl = this.baseUrl || this.config.baseUrl || null;
    if (!baseUrl) return pathOrUrl;
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    if (/^\/\//.test(pathOrUrl)) {
      try {
        const proto = new URL(baseUrl).protocol;
        return `${proto}${pathOrUrl}`;
      } catch (e) {
        return `${baseUrl.replace(/\/$/, '')}${pathOrUrl}`;
      }
    }
    try {
      const origin = new URL(baseUrl).origin;
      return new URL(pathOrUrl, origin).toString();
    } catch (err) {
      return `${baseUrl.replace(/\/$/, '')}/${pathOrUrl.replace(/^\//, '')}`;
    }
  }

  /**
   * Inline & optimize images in HTML.
   */
  async inlineAndOptimizeImages(html, opts = {}) {
    if (!html) return html;
    const inlineRemote = opts.inlineRemote !== undefined ? opts.inlineRemote : this.config.inlineRemoteImages;
    const baseUrl = opts.baseUrl || this.baseUrl || null;
    const allowLocal = opts.allowLocalFileImages !== undefined ? opts.allowLocalFileImages : this.config.allowLocalFileImages;

    const imgRegex = /<img\b([^>]*?)\bsrc=(["'])(.*?)\2([^>]*?)\/?>/gi;
    const replacements = [];

    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const whole = match[0];
      const src = match[3];

      if (!src) continue;
      if (/^data:/i.test(src)) continue; // already inlined
      if (/^file:\/\//i.test(src) && !allowLocal) continue;

      let absoluteUrl = src;
      try {
        if (/^\/\//.test(src) && baseUrl) {
          const proto = new URL(baseUrl).protocol;
          absoluteUrl = `${proto}${src}`;
        } else if (/^\//.test(src) || (!/^[a-zA-Z][a-zA-Z0-9+-.]*:/.test(src) && baseUrl)) {
          absoluteUrl = this.resolveRelativeUrl(src);
        } else {
          absoluteUrl = src;
        }
      } catch (e) {
        absoluteUrl = src;
      }

      const promise = (async () => {
        try {
          if (/^https?:\/\//i.test(absoluteUrl) && inlineRemote) {
            const dataUrl = await this.fetchAndOptimizeImageAsDataUrl(absoluteUrl, {
              maxImageWidthPx: this.config.maxImageWidthPx,
              maxImageHeightPx: this.config.maxImageHeightPx,
              imageQuality: this.config.imageQuality,
            });
            return whole.replace(src, dataUrl);
          }
          if (absoluteUrl !== src) return whole.replace(src, absoluteUrl);
          return whole;
        } catch (err) {
          console.warn('inlineAndOptimizeImages: failed for', absoluteUrl, err.message);
          return whole;
        }
      })();

      replacements.push({ index: match.index, length: whole.length, promise });
    }

    if (replacements.length === 0) return html;

    const results = await Promise.all(replacements.map(r => r.promise));
    let newHtml = html;
    for (let i = replacements.length - 1; i >= 0; --i) {
      const r = replacements[i];
      newHtml = newHtml.slice(0, r.index) + results[i] + newHtml.slice(r.index + r.length);
    }
    return newHtml;
  }

  // -------------------------
  // Puppeteer: HTML -> PDF
  // -------------------------
  async htmlToPdfBuffer(html, options = {}) {
    const opts = { ...this.config, ...options };
    let browser;
    try {
      browser = await puppeteer.launch(opts.launchOptions);
      const page = await browser.newPage();
      await page.setUserAgent(opts.userAgent || DEFAULTS.userAgent);

      const dpi = opts.dpi || DEFAULTS.dpi;
      const pageWidthIn = opts.pageSize === 'Letter' ? 8.5 : 8.27;
      const pageHeightIn = opts.pageSize === 'Letter' ? 11 : 11.69;
      const vpWidth = Math.round(pageWidthIn * dpi);
      const vpHeight = Math.round(pageHeightIn * dpi);
      await page.setViewport({ width: vpWidth, height: vpHeight });

      await page.setContent(html, { waitUntil: opts.waitUntil || DEFAULTS.waitUntil });
      await page.emulateMediaType('print');

      const pdfBuffer = await page.pdf({
        format: opts.pageSize || DEFAULTS.pageSize,
        printBackground: true,
        margin: opts.margins || DEFAULTS.margins,
        preferCSSPageSize: true,
        displayHeaderFooter: !!(opts.headerTemplate || opts.footerTemplate),
        headerTemplate: opts.headerTemplate || '<div></div>',
        footerTemplate:
          opts.footerTemplate ||
          `<div style="font-size:10px; width:100%; padding:0 8mm;">
            <span class="date"></span>
            <span style="float:right">Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
          </div>`,
      });

      await page.close();
      await browser.close();
      return pdfBuffer;
    } catch (err) {
      if (browser) try { await browser.close(); } catch (e) {}
      throw err;
    }
  }

  // -------------------------
  // pdf-lib post-processing
  // -------------------------
  async postProcessPdfWithPdfLib(pdfBuffer, postOptions = {}) {
    if (!postOptions) return pdfBuffer;
    const { addPageNumbers, pageNumberOptions, watermark, metadata } = postOptions;

    if (!addPageNumbers && !watermark && !metadata) return pdfBuffer;

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    if (metadata) {
      if (metadata.Title) pdfDoc.setTitle(metadata.Title);
      if (metadata.Author) pdfDoc.setAuthor(metadata.Author);
      if (metadata.Subject) pdfDoc.setSubject(metadata.Subject);
      if (metadata.Keywords) pdfDoc.setKeywords(Array.isArray(metadata.Keywords) ? metadata.Keywords : [metadata.Keywords]);
    }

    if (addPageNumbers) {
      const fontSize = (pageNumberOptions && pageNumberOptions.fontSize) || 10;
      const marginBottom = (pageNumberOptions && pageNumberOptions.marginBottom) || 20;
      pages.forEach((page, idx) => {
        const { width } = page.getSize();
        const text = `Page ${idx + 1} / ${pages.length}`;
        const textWidth = timesRomanFont.widthOfTextAtSize(text, fontSize);
        const x = width - textWidth - 40;
        const y = marginBottom;
        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font: timesRomanFont,
          color: rgb(0.2, 0.2, 0.2),
        });
      });
    }

    if (watermark && watermark.text) {
      const wText = String(watermark.text);
      const wmSize = watermark.size || 60;
      const wmOpacity = watermark.opacity !== undefined ? watermark.opacity : 0.08;
      const rotateDeg = watermark.rotateDeg !== undefined ? watermark.rotateDeg : -45;

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const textWidth = timesRomanFont.widthOfTextAtSize(wText, wmSize);
        const x = (width - textWidth) / 2;
        const y = height / 2;
        page.drawText(wText, {
          x,
          y,
          size: wmSize,
          font: timesRomanFont,
          color: rgb(0.5, 0.5, 0.5),
          rotate: degrees(rotateDeg),
          opacity: wmOpacity,
        });
      });
    }

    const modified = await pdfDoc.save();
    return Buffer.from(modified);
  }

  // -------------------------
  // Build HTML from DB paper object
  // -------------------------
  buildHtmlFromPaper(paper = {}) {
  const title = this.escapeHtml(paper.title || 'Question Paper');
  const course = this.escapeHtml(paper.course || '');
  const metadata = paper.metadata || {};
  
  // Extract data for the specific format
  const institution = 'TEZPUR UNIVERSITY';
  const semester = this.escapeHtml(metadata.semester || '');
  const examType = this.escapeHtml(metadata.exam_type || 'End Term Examination');
  const academicYear = this.escapeHtml(metadata.academic_year || '');
  const duration = metadata.duration ? `${metadata.duration} mins` : '';
  const fullMarks = metadata.full_marks ? `${metadata.full_marks}` : '';

  // Build the header lines in your exact format
  const headerLine1 = institution;
  const headerLine2 = `${semester} Semester ${examType}, ${academicYear}`;
  const headerLine3 = `${course}`;
  
  const questions = (paper.questions || []).sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0));
  
  // NEW: Calculate total marks
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  
  const questionsHtml = questions
    .map((q, idx) => {
      // NEW: Add marks display at the end of each question
      const marksDisplay = q.marks ? `<span class="question-marks">[${q.marks} marks]</span>` : '';
      
      return `<div class="question" data-qid="${q.question_id || ''}">
        <div class="question-row">
          <div class="qnum"><strong>${q.sequence_number || idx + 1}.</strong></div>
          <div class="qcontent">${q.content_html || ''}</div>
          ${marksDisplay}
        </div>
      </div>`;
    })
    .join('\n');

  const css = `
    @page { 
      size: A4; 
      margin: 5mm 10mm 5mm 10mm;
    }
    html,body { 
      font-family: "Times New Roman", "Georgia", serif; 
      color:#111; 
    }
    body { 
      margin:0; 
      padding:0; 
      font-size:10pt; 
      line-height:1.2;
    }
    .container { 
      padding: 2mm 4mm;
      box-sizing: border-box; 
    }
    .header { 
      text-align:center; 
      margin-bottom: 3mm;
    }
    .header-line1 {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 1px;
    }
    .header-line2 {
      font-size: 12pt;
      margin-bottom: 1px;
    }
    .header-line3 {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 2mm;
    }
    .marks-time-line {
      display: flex;
      justify-content: space-between;
      font-size: 11pt;
      margin-bottom: 2mm;
      padding-bottom: 1mm;
      border-bottom: 1px solid #000;
    }
    .marks-time-line .full-marks {
      text-align: left;
    }
    .marks-time-line .time {
      text-align: right;
    }
    
    /* NEW: Question row layout for marks at the end */
    .question-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      width: 100%;
    }
    
    .question { 
      margin-bottom: 2mm;
      page-break-inside: avoid;
      width: 100%;
    }
    .qnum { 
      font-weight: bold;
      flex-shrink: 0;
      margin: 0;
      padding: 0;
      line-height: 1.2;
      margin-right: 3px;
    }
    .qcontent { 
      flex: 1;
      margin: 0;
      padding: 0;
      line-height: 1.2;
    }
    
    /* NEW: Marks display at the end */
    .question-marks {
      font-weight: bold;
      color: #111;
      margin-left: 8px;
      flex-shrink: 0;
      white-space: nowrap;
      font-size: 8pt;
    }
    
    .qcontent p {
      margin: 0 0 1mm 0;
      line-height: 1.2;
    }
    
    strong, b { font-weight: bold !important; }
    em, i { font-style: italic !important; }
    
    img { 
      max-width: 100%; 
      height: auto; 
      display:block; 
      margin:2px 0;
    }
    img, .question-content img, figure img, figure.image img, .image img {
      max-width: 100% !important;
      max-height: 250px !important;
      width: auto !important;
      height: auto !important;
      display: block !important;
      margin: 4px auto !important;
      object-fit: contain !important;
    }
    figure.image {
      max-width: 100% !important;
    }
    .question-content img {
      max-width: 100% !important;
      height: auto !important;
      display: block;
      margin: 2px 0;
      max-height: 400px !important;
      object-fit: contain !important;
    } 
    .footer { 
      display: none !important;
    }
    nav, .no-print, .sidebar { display:none !important; }
  `;

  return `<!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>${css}</style>
    </head>
    <body>
      <div class="container">
        <header class="header">
          <div class="header-line1">${headerLine1}</div>
          <div class="header-line2">${headerLine2}</div>
          <div class="header-line3">${headerLine3}</div>
          
          <div class="marks-time-line">
            <div class="full-marks">Full mark : ${fullMarks}</div>
            <div class="time">Time: ${duration}</div>
          </div>
        </header>

        <main>
          ${questionsHtml}
        </main>
      </div>
    </body>
    </html>`;
}

  escapeHtml(s = '') {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // -------------------------
  // High-level generate method
  // -------------------------
  async generatePdf(params = {}) {
    const { html, paperId, fetchPaperData, baseUrl, pdfOptions, postOptions } = params;
    if (baseUrl) this.baseUrl = baseUrl;

    let finalHtml = html;
    if (!finalHtml) {
      if (!paperId || typeof fetchPaperData !== 'function') {
        throw new Error('Either html OR (paperId and fetchPaperData) must be provided');
      }
      const paper = await fetchPaperData(paperId);
      finalHtml = this.buildHtmlFromPaper(paper);
    }

    const htmlWithImages = await this.inlineAndOptimizeImages(finalHtml, { baseUrl: this.baseUrl });

    const pdfBuffer = await this.htmlToPdfBuffer(htmlWithImages, pdfOptions || {});

    const finalBuffer = await this.postProcessPdfWithPdfLib(pdfBuffer, postOptions || {});

    return finalBuffer;
  }
}

export default PDFGenerationService;
