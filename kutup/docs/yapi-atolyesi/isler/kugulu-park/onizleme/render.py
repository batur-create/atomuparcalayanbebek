"""Rasterize the isolated SVG studies; no app, network, database or user session."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/usr/bin/chromium", headless=True,
                                args=["--no-sandbox"])
    for name, height in [("yakin", 900), ("gece", 900), ("olcek", 850)]:
        page = browser.new_page(viewport={"width": 1400, "height": height},
                                device_scale_factor=1)
        page.set_content("<html><style>html,body{margin:0}svg{display:block}</style>"
                         + (root / (name + ".svg")).read_text() + "</html>")
        page.screenshot(path=str(root / (name + ".png")))
        print(name, "rendered")
        page.close()
    browser.close()
