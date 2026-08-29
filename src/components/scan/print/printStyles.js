// Print stylesheet for the PDF report route. Injected as a <style> tag by the
// print page so none of this leaks into the app's screen styles.
//
// print-color-adjust: exact is REQUIRED — Chrome drops background colors when
// printing by default, which would erase both the dark header band and the amber
// emphasis that tells the reader which findings matter.
export const PRINT_CSS = `
  @page { size: Letter; margin: 14mm 14mm 18mm 14mm; }

  html, body {
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* The consent widget injects itself into every page of this app. It must not
     appear in a printed document. */
  #dros-root { display: none !important; }

  .pr-doc {
    font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
    color: #1A2733;
    max-width: 720px;
    margin: 0 auto;
    padding: 0 0 8px;
  }

  .pr-band {
    background: #0E1B26;
    padding: 22px 24px;
    margin-bottom: 22px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .pr-band img { height: 46px; display: block; }
  .pr-band-kicker {
    color: #9FB3C4; font-size: 10px; letter-spacing: .14em;
    text-transform: uppercase; margin: 12px 0 0; font-weight: 600;
  }

  .pr-meta { margin-bottom: 18px; }
  .pr-meta-row { font-size: 11px; color: #55636F; margin: 0 0 3px; word-break: break-all; }
  .pr-meta-row strong { color: #1A2733; font-weight: 600; }

  .pr-summary {
    border: 1px solid #D8E0E7; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px;
    background: #F7F9FB;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .pr-summary h2 {
    font-size: 10px; letter-spacing: .12em; text-transform: uppercase;
    color: #55636F; margin: 0 0 8px; font-weight: 700;
  }
  .pr-summary p { font-size: 12.5px; margin: 0 0 4px; }

  .pr-scope { font-size: 11px; color: #55636F; line-height: 1.6; margin: 0 0 18px; }

  .pr-section-label {
    font-size: 10px; letter-spacing: .12em; text-transform: uppercase;
    color: #55636F; font-weight: 700; margin: 0 0 8px;
  }

  /* Findings must not be split across a page break mid-card. */
  .pr-card {
    border: 1px solid #D8E0E7; border-radius: 6px; padding: 14px 16px; margin-bottom: 12px;
    break-inside: avoid; page-break-inside: avoid;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .pr-card-amber { border: 2px solid #D89B2A; background: #FDF6E7; }

  .pr-eyebrow {
    font-size: 9px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase;
    color: #8A5F12; margin: 0 0 6px;
  }
  .pr-card-head {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 6px;
  }
  .pr-card-title { font-size: 12.5px; font-weight: 700; margin: 0; }
  .pr-pill {
    flex-shrink: 0; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 4px;
    background: #EEF2F5; color: #55636F; border: 1px solid #D8E0E7; white-space: nowrap;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .pr-pill-amber { background: #F7E4B8; color: #8A5F12; border-color: #D89B2A; }

  .pr-observation { font-size: 12px; margin: 0; line-height: 1.55; }
  .pr-details { margin: 7px 0 0; padding-left: 16px; }
  .pr-details li { font-size: 10.5px; color: #55636F; line-height: 1.5; margin-bottom: 2px; }

  .pr-context { margin-top: 11px; padding-top: 10px; border-top: 1px solid #D8E0E7; }
  .pr-context-label {
    font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    color: #55636F; margin: 0 0 2px;
  }
  .pr-context-body { font-size: 10.5px; color: #34424F; line-height: 1.55; margin: 0 0 8px; }
  .pr-context-body:last-child { margin-bottom: 0; }

  .pr-domains {
    border: 1px solid #D8E0E7; border-radius: 6px; padding: 14px 16px; margin-bottom: 14px;
    break-inside: avoid; page-break-inside: avoid;
  }
  .pr-domains h3 { font-size: 12px; font-weight: 700; margin: 0 0 6px; }
  .pr-domains p { font-size: 10.5px; color: #55636F; margin: 0; word-break: break-all; line-height: 1.6; }

  .pr-disclaimer {
    font-size: 9.5px; color: #6B7885; line-height: 1.6; text-align: center;
    border-top: 1px solid #D8E0E7; padding-top: 12px; margin: 0;
  }
`;