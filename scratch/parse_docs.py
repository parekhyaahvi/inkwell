import os
import zipfile
import xml.etree.ElementTree as ET

def docx_to_text(path):
    try:
        with zipfile.ZipFile(path) as z:
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            # Namespaces
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            paragraphs = []
            for p in root.findall('.//w:p', ns):
                texts = []
                for node in p.findall('.//w:t', ns):
                    if node.text:
                        texts.append(node.text)
                if texts:
                    paragraphs.append(''.join(texts))
            return '\n\n'.join(paragraphs)
    except Exception as e:
        return f"Error reading {path}: {str(e)}"

def main():
    src_dir = "reference"
    dest_dir = "reference_txt"
    os.makedirs(dest_dir, exist_ok=True)
    
    files = [f for f in os.listdir(src_dir) if f.endswith(".docx")]
    print(f"Found {len(files)} docx files in {src_dir}")
    
    for f in sorted(files):
        src_path = os.path.join(src_dir, f)
        dest_name = f.replace(".docx", ".txt")
        dest_path = os.path.join(dest_dir, dest_name)
        
        print(f"Parsing {f} -> {dest_name}...")
        text = docx_to_text(src_path)
        
        with open(dest_path, "w", encoding="utf-8") as out:
            out.write(text)
            
    print("Done converting docx files to text!")

if __name__ == "__main__":
    main()
