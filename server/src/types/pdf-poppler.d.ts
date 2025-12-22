declare module 'pdf-poppler' {
    export class PdfConverter {
        constructor(pdfFilePath: string);
        convert(options: {
            format: string;
            out_dir: string;
            out_prefix: string;
            page: number | null;
        }): Promise<void>;
    }
}
