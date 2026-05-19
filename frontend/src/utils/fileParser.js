let pdfjsLoaded = null;

/** Lazy-load pdfjs-dist only when a PDF is actually opened */
async function getPdfjs() {
    if (!pdfjsLoaded) {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/build/pdf.worker.mjs",
            import.meta.url,
        ).toString();
        pdfjsLoaded = pdfjsLib;
    }
    return pdfjsLoaded;
}

const MAX_CHARS = 50000;
const SUPPORTED_EXTENSIONS = [".txt", ".md", ".pdf"];

/**
 * Parse a file and extract plain text content.
 * Supports .txt, .md, .pdf formats.
 * @param {File} file - The file to parse
 * @returns {Promise<{text: string, meta: {pages?: number, chars: number, lang: string|null}}>}
 */
export async function parseFile(file) {
    const ext = getExtension(file.name);

    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        throw new Error(
            `Unsupported file type "${ext}". Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`,
        );
    }

    let text;
    let pages;

    if (ext === ".pdf") {
        const result = await parsePDF(file);
        text = result.text;
        pages = result.pages;
    } else {
        text = await parseTextFile(file);
    }

    // Normalize whitespace
    text = text
        .replace(/\r\n?/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    if (text.length > MAX_CHARS) {
        text = text.slice(0, MAX_CHARS);
    }

    return {
        text,
        meta: {
            pages,
            chars: text.length,
            lang: detectLanguage(text),
        },
    };
}

async function parseTextFile(file) {
    return await file.text();
}

async function parsePDF(file) {
    const pdfjsLib = await getPdfjs();
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const totalPages = pdf.numPages;
    const pageTexts = [];

    for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item) => item.str);
        pageTexts.push(strings.join(" "));
    }

    return {
        text: pageTexts.join("\n\n"),
        pages: totalPages,
    };
}

function getExtension(filename) {
    const dot = filename.lastIndexOf(".");
    return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

/** Simple language detection from text sample */
export function detectLanguage(text) {
    if (!text) return null;
    const sample = text.slice(0, 500);
    const cyrillic = (sample.match(/[\u0400-\u04FF]/g) || []).length;
    const latin = (sample.match(/[A-Za-z]/g) || []).length;
    const cjk = (
        sample.match(/[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/g) || []
    ).length;

    if (cjk > 10) return "CJK";
    if (cyrillic > latin) {
        const ukr = (sample.match(/[іїєґІЇЄҐ]/g) || []).length;
        return ukr > 2 ? "Ukrainian" : "Cyrillic";
    }
    if (latin > 20) return "English";
    return null;
}

export { SUPPORTED_EXTENSIONS, MAX_CHARS };
