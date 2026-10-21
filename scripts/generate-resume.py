"""Generate the one-page A4 resume from the standalone HTML (no duplicate copy).

Requires ReportLab. Fonts: Arial on Windows, DejaVu Sans on Linux;
RESUME_FONT_DIR can point to a folder containing either family.
Run: python scripts/generate-resume.py
"""
from html.parser import HTMLParser
from pathlib import Path
import os
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Flowable, Paragraph, SimpleDocTemplate

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'public/curriculo-emerson-brandao.pdf'


def register_fonts():
    candidates = [Path(os.environ['RESUME_FONT_DIR'])] if os.environ.get('RESUME_FONT_DIR') else []
    candidates += [Path(os.environ.get('WINDIR', 'C:/Windows')) / 'Fonts',
                   Path('/usr/share/fonts/truetype/dejavu')]
    for folder in candidates:
        for regular, bold in [('arial.ttf', 'arialbd.ttf'), ('DejaVuSans.ttf', 'DejaVuSans-Bold.ttf')]:
            if (folder / regular).exists() and (folder / bold).exists():
                pdfmetrics.registerFont(TTFont('Resume', str(folder / regular)))
                pdfmetrics.registerFont(TTFont('Resume-Bold', str(folder / bold)))
                pdfmetrics.registerFontFamily('Resume', normal='Resume', bold='Resume-Bold')
                return
    raise RuntimeError('Arial or DejaVu Sans required; set RESUME_FONT_DIR.')


class ResumeParser(HTMLParser):
    """Read only semantic text blocks inside main; preserve links and emphasis."""
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.in_main = False
        self.kind = None
        self.parts = []
        self.blocks = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'main':
            self.in_main = True
        if not self.in_main:
            return
        if tag in ('h1', 'h2', 'h3', 'p', 'li'):
            self.kind = attrs.get('class', tag)
            self.parts = []
        elif self.kind and tag == 'strong':
            self.parts.append('<b>')
        elif self.kind and tag == 'a':
            self.parts.append(f'<a href="{attrs["href"]}">')

    def handle_endtag(self, tag):
        if tag == 'main':
            self.in_main = False
        elif tag in ('h1', 'h2', 'h3', 'p', 'li') and self.kind:
            self.blocks.append((self.kind, ''.join(self.parts)))
            self.kind = None
        elif self.kind and tag in ('strong', 'a'):
            self.parts.append('</b>' if tag == 'strong' else '</a>')

    def handle_data(self, data):
        if self.kind:
            self.parts.append(data)

    def handle_entityref(self, name):
        if self.kind:
            self.parts.append(f'&{name};')

    def handle_charref(self, name):
        if self.kind:
            self.parts.append(f'&#{name};')


class HeaderRule(Flowable):
    def __init__(self):
        super().__init__()
        self.height = 12

    def wrap(self, available_width, available_height):
        self.width = available_width
        return self.width, self.height

    def draw(self):
        self.canv.setStrokeColor(colors.HexColor('#171717'))
        self.canv.setLineWidth(1)
        self.canv.line(0, 5, self.width, 5)


def generate():
    register_fonts()
    body = ParagraphStyle('body', fontName='Resume', fontSize=10, leading=14,
                          textColor=colors.HexColor('#171717'), spaceAfter=3.75)
    styles = {
        'p': body,
        'h1': ParagraphStyle('name', parent=body, fontName='Resume-Bold', fontSize=28,
                             leading=31, spaceAfter=7),
        'position': ParagraphStyle('position', parent=body, fontSize=12, leading=16, spaceAfter=8),
        'contact': ParagraphStyle('contact', parent=body, fontSize=9, leading=13, spaceAfter=0),
        'h2': ParagraphStyle('section', parent=body, fontName='Resume-Bold', fontSize=8.5,
                            leading=11, spaceBefore=13, spaceAfter=6, keepWithNext=True),
        'h3': ParagraphStyle('entry', parent=body, fontName='Resume-Bold', fontSize=10.5,
                            leading=14, spaceBefore=4, spaceAfter=2, keepWithNext=True),
        'meta': ParagraphStyle('meta', parent=body, fontSize=9, leading=12, spaceAfter=4),
        'stack': ParagraphStyle('stack', parent=body, fontSize=9, leading=12, spaceAfter=4),
        'li': ParagraphStyle('bullet', parent=body, leftIndent=10, firstLineIndent=-10,
                            spaceAfter=1.5),
    }
    parser = ResumeParser()
    parser.feed((ROOT / 'public/curriculo.html').read_text(encoding='utf-8-sig'))
    story = []
    in_header = True
    for kind, content in parser.blocks:
        if kind == 'h2' and in_header:
            story.append(HeaderRule())
            in_header = False
        if in_header and kind == 'p':
            kind = 'contact'
        if kind == 'h2':
            content = content.upper()
        content = re.sub(r'\s+', ' ', content).strip()
        story.append(Paragraph(('•&nbsp;&nbsp; ' if kind == 'li' else '') + content, styles[kind]))
    margin = 16 * 72 / 25.4
    doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, leftMargin=margin, rightMargin=margin,
                            topMargin=margin, bottomMargin=margin,
                            title='Currículo — Emerson da Silva Brandão', author='Emerson da Silva Brandão')
    def page(canvas, document):
        if document.page > 1:
            raise ValueError('Resume overflowed one A4 page; review spacing and content.')
    doc.build(story, onFirstPage=page, onLaterPages=page)
    print(OUTPUT)


if __name__ == '__main__':
    generate()
