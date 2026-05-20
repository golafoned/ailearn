import win32com.client as win32
import os
import time

def step3():
    try:
        word = win32.GetActiveObject("Word.Application")
    except:
        word = win32.Dispatch("Word.Application")
    
    word.Visible = False
    try:
        doc = word.Documents.Open(os.path.abspath('processed.docx'))
        
        equations = [
            'M_{new} = \\min(100, \\max(0, M_{old} + w(d, r)))',
            "EF' = EF + \\left(0.1 - (5 - q)\\left(0.08 + (5 - q) \\cdot 0.02\\right)\\right)"
        ]
        
        for eq_text in equations:
            rng = doc.Content
            find = rng.Find
            find.ClearFormatting()
            find.Text = eq_text
            if find.Execute():
                # Add OMath to the found range
                # Wait a bit to avoid "Call was rejected by callee"
                time.sleep(1)
                om_rng = rng.OMaths.Add(rng)
                om_rng.Item(1).BuildUp()
        
        doc.SaveAs(os.path.abspath('coursework.docx'), FileFormat=12)
        doc.Close()
    finally:
        word.Quit()

if __name__ == "__main__":
    step3()
