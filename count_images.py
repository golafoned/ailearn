from docx import Document

def count_images():
    doc = Document('processed.docx')
    # Count inline shapes
    inline_count = len(doc.inline_shapes)
    
    # Count image parts in the document package
    image_parts = 0
    for rel in doc.part.rels.values():
        if "image" in rel.target_ref:
            image_parts += 1
            
    # Check for textbox or other shapes that might contain images
    # But for a basic check, we look at the XML if needed.
    
    print(f"InlineShapes count: {inline_count}")
    print(f"Image parts count: {image_parts}")

if __name__ == "__main__":
    try:
        count_images()
    except Exception as e:
        print(f"Error: {e}")
