import fitz
import json
import easyocr
import numpy as np

def extract_and_chunk(pdf_path, chunk_size=300, overlap=50):
    print(f"Reading PDF: {pdf_path}")
    doc = fitz.open(pdf_path)
    text_full = ""
    
    print("Initializing EasyOCR for Telugu...")
    reader = easyocr.Reader(['te', 'en'])
    
    # Process all pages in the PDF
    num_pages = len(doc)
    print(f"Extracting text from all {num_pages} pages using OCR...")
    
    for i in range(num_pages):
        page = doc[i]
        pix = page.get_pixmap(dpi=150)
        
        # Convert to numpy array for EasyOCR
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
        if pix.n == 4: # RGBA
            img = img[:, :, :3]
            
        print(f"Running OCR on page {i+1}...")
        results = reader.readtext(img, detail=0)
        page_text = " ".join(results)
        text_full += page_text + "\n"

    print(f"Extracted {len(text_full)} characters.")
    
    words = text_full.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
        if i + chunk_size >= len(words):
            break
            
    print(f"Generated {len(chunks)} chunks.")
    
    with open("chunks.json", "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    pdf_file = "The Village By The Sea - anita desai - telugu.pdf"
    extract_and_chunk(pdf_file)
