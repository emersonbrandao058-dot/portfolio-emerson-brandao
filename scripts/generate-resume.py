"""Build the downloadable résumé from the unchanged public HTML content."""
from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import re

root=Path(__file__).resolve().parents[1]
font_dir=Path('/usr/share/fonts/truetype/dejavu')
pdfmetrics.registerFont(TTFont('ResumeSans',str(font_dir/'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('ResumeSans-Bold',str(font_dir/'DejaVuSans-Bold.ttf')))
pdfmetrics.registerFontFamily('ResumeSans',normal='ResumeSans',bold='ResumeSans-Bold',italic='ResumeSans',boldItalic='ResumeSans-Bold')
styles={
 'h1':ParagraphStyle('name',fontName='ResumeSans-Bold',fontSize=22,leading=28,spaceAfter=9),
 'h2':ParagraphStyle('section',fontName='ResumeSans-Bold',fontSize=11,leading=16,spaceBefore=15,spaceAfter=6,keepWithNext=True),
 'p':ParagraphStyle('body',fontName='ResumeSans',fontSize=9.1,leading=14,spaceAfter=5),
 'li':ParagraphStyle('bullet',fontName='ResumeSans',fontSize=9.1,leading=14,leftIndent=10,firstLineIndent=-10,spaceAfter=2),
}
source=(root/'public/curriculo.html').read_text()
def markup(node):
    text=str(node)
    text=re.sub(r'^<(?:p|h1|h2|li)[^>]*>|</(?:p|h1|h2|li)>$','',text)
    text=text.replace('<strong>','<b>').replace('</strong>','</b>').replace('<br>','<br/>')
    text=text.replace('–','-').replace('—','-')
    text=re.sub(r'<a href="([^"]+)">',r'<a href="\1" color="#3344cc">',text)
    return text
story=[]
for kind, content in re.findall(r'<(h1|h2|p|li)\b[^>]*>(.*?)</\1>',source,re.S):
    story.append(Paragraph(('• ' if kind=='li' else '')+markup(content),styles[kind]))
out=root/'public/curriculo-emerson-brandao.pdf'
doc=SimpleDocTemplate(str(out),pagesize=A4,rightMargin=43,leftMargin=43,topMargin=37,bottomMargin=34,title='Currículo - Emerson Brandão',author='Emerson Brandão')
doc.build(story)
print(out)
