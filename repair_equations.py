import win32com.client
import time
import os
import zipfile
import re

def convert_to_omath():
    input_file = r"C:\storage\projs\ailearn\processed.docx"
    output_file = r"C:\storage\projs\ailearn\coursework.docx"
    
    if os.path.exists(output_file):
        os.remove(output_file)
        
    formulas = [
        r"M_{new} = \min(100, \max(0, M_{old} + w(d, r)))",
        r"EF' = EF + \left(0.1 - (5 - q)\left(0.08 + (5 - q) \cdot 0.02\right)\right)"
    ]
    
    word = None
    doc = None
    success = False
    
    for attempt in range(5):
        try:
            word = win32com.client.Dispatch("Word.Application")
            word.Visible = False
            doc = word.Documents.Open(input_file)
            
            converted_count = 0
            # iterate through paragraphs
            # some paragraphs might be rejected if we access them too fast
            paras = doc.Paragraphs
            count = paras.Count
            for i in range(1, count + 1):
                try:
                    para = paras.Item(i)
                    text = para.Range.Text.strip()
                    if text in formulas:
                        # Convert text to OMath
                        para.Range.OMaths.Add(para.Range)
                        para.Range.OMaths.BuildUp()
                        converted_count += 1
                except Exception as e:
                    if "rejected" in str(e).lower():
                        time.sleep(1)
                        # retry this item once
                        para = paras.Item(i)
                        text = para.Range.Text.strip()
                        if text in formulas:
                            para.Range.OMaths.Add(para.Range)
                            para.Range.OMaths.BuildUp()
                            converted_count += 1
                    else:
                        raise e
            
            doc.SaveAs(output_file)
            doc.Close()
            word.Quit()
            success = True
            print(f"Successfully converted {converted_count} formulas.")
            break
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if doc:
                try: doc.Close(False)
                except: pass
            if word:
                try: word.Quit()
                except: pass
            time.sleep(2)
            
    if not success:
        print("Failed to convert formulas after 5 attempts.")
        return

    # Validation
    if os.path.exists(output_file):
        size = os.path.getsize(output_file)
        print(f"coursework.docx exists, size: {size} bytes")
        
        with zipfile.ZipFile(output_file, 'r') as z:
            doc_xml = z.read('word/document.xml').decode('utf-8')
            omath_count = len(re.findall(r'<m:oMath>', doc_xml))
            print(f"m:oMath count in document.xml: {omath_count}")
    else:
        print("coursework.docx was not created.")

if __name__ == "__main__":
    convert_to_omath()
