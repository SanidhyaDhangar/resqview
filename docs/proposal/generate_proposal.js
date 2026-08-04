const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak, TableOfContents,
} = require("docx");

// ---- palette ----
const C = {
  accent: "2F81F7", text: "1A2230", muted: "5B6675", line: "D5DBE3",
  crit: "D11F1A", high: "C26000", med: "9A7B00", low: "1F8A3B", info: "2563B0",
  panelDark: "0B0F14", panelMid: "161B22", chipText: "FFFFFF",
};
const CONTENT_W = 9360;

// ---- real engine output (25 raw reports -> 12 incidents) ----
const incidents = [
  ["rescue",  "4 trapped on roof, water rising",            "Hindmata, Dadar · 1 child · water at windows",   "4 · 112 + SMS + Twitter", "CRITICAL", C.crit],
  ["fire",    "Godown fire, possible workers inside",       "Kurla · spreading · units en route",             "4 · 112 + Twitter",       "CRITICAL", C.crit],
  ["rescue",  "Family stranded, rising water",              "Sion · 5 people incl. infant · 2nd floor",        "3 · 112 + SMS",           "CRITICAL", C.crit],
  ["flood",   "Mithi River overtopping risk",               "Sensor M17 · 4.4 m · pumps engaged",             "3 · IoT sensor",          "CRITICAL", C.crit],
  ["hazard",  "Suspected gas leak, lane evacuating",        "Chembur · ruptured pipeline reported",          "2 · 112 + Twitter",       "CRITICAL", C.crit],
  ["medical", "Diabetic patient, shelter out of insulin",   "Matunga shelter · no power · worsening",         "2 · SMS",                 "CRITICAL", C.crit],
  ["medical", "Collapsed wall, pedestrian leg pinned",      "BKC edge · conscious",                          "1 · 112",                 "HIGH",     C.high],
  ["medical", "Heart attack, ambulance needed",             "Bandra · elderly male collapsed",               "1 · 112",                 "HIGH",     C.high],
  ["medical", "Subway flooded, ambulance cannot pass",      "Andheri · access to hospital cut",              "1 · Twitter",             "HIGH",     C.high],
  ["shelter", "Shelter low on water and food",              "Matunga · many children present",               "2 · Twitter",             "MEDIUM",   C.med],
  ["infra",   "Subway flooded, road blocked",               "Andheri · vehicles submerged",                  "1 · Twitter",             "MEDIUM",   C.med],
  ["infra",   "Power outage, ~12,000 households",           "Chembur grid sector offline",                   "1 · IoT sensor",          "INFO",     C.info],
];

// ---- helpers ----
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const P  = (t, opts = {}) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t, color: opts.color || C.text, size: opts.size || 22, bold: !!opts.bold, italics: !!opts.italics })] });
const bullet = (t) => new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 22, color: C.text })] });

const cell = (children, { w, fill, valign } = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
  verticalAlign: valign || VerticalAlign.CENTER,
  margins: { top: 70, bottom: 70, left: 130, right: 130 },
  borders: {
    top:    { style: BorderStyle.SINGLE, size: 2, color: C.line },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: C.line },
    left:   { style: BorderStyle.SINGLE, size: 2, color: C.line },
    right:  { style: BorderStyle.SINGLE, size: 2, color: C.line },
  },
  children,
});

const runs = (text, o = {}) => new Paragraph({ children: [new TextRun({ text, size: o.size || 18, bold: !!o.bold, color: o.color || C.text, italics: !!o.italics })] });

// ---- the dashboard visual (native Word table) ----
function dashboardVisual() {
  const rows = [];

  // title bar
  rows.push(new TableRow({ children: [
    new TableCell({
      columnSpan: 4, width: { size: CONTENT_W, type: WidthType.DXA },
      shading: { fill: C.panelDark, type: ShadingType.CLEAR },
      margins: { top: 90, bottom: 90, left: 140, right: 140 },
      borders: { top:{style:BorderStyle.SINGLE,size:2,color:C.panelDark}, bottom:{style:BorderStyle.SINGLE,size:2,color:C.panelDark}, left:{style:BorderStyle.SINGLE,size:2,color:C.panelDark}, right:{style:BorderStyle.SINGLE,size:2,color:C.panelDark} },
      children: [ new Paragraph({ children: [
        new TextRun({ text: "ResQView", bold: true, color: "FFFFFF", size: 20 }),
        new TextRun({ text: "   Mumbai Monsoon Flood · Control Room", color: "9AA7B4", size: 18 }),
        new TextRun({ text: "          ● LIVE · 25 reports → 12 incidents", color: "3FB950", size: 18 }),
      ]})],
    }),
  ]}));

  // header row
  const head = ["SEV", "INCIDENT (merged from raw reports)", "LOCATION / DETAIL", "SOURCES"];
  const widths = [1050, 4050, 2660, 1600];
  rows.push(new TableRow({ tableHeader: true, children: head.map((h, i) =>
    cell([runs(h, { bold: true, color: "FFFFFF", size: 16 })], { w: widths[i], fill: C.panelMid })) }));

  // incident rows
  incidents.forEach((it) => {
    const [, title, detail, src, tier, color] = it;
    rows.push(new TableRow({ children: [
      cell([runs(tier, { bold: true, color: "FFFFFF", size: 14 })], { w: widths[0], fill: color }),
      cell([runs(title, { bold: true, size: 18 })], { w: widths[1] }),
      cell([runs(detail, { color: C.muted, size: 17 })], { w: widths[2] }),
      cell([runs(src, { color: C.muted, size: 16 })], { w: widths[3] }),
    ]}));
  });

  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths, rows });
}

// ---- resources/cost table ----
function costTable() {
  const widths = [1900, 3730, 3730];
  const head = ["Layer", "Prototype (free now)", "Funded scale-up"];
  const data = [
    ["Maps / GIS", "Leaflet + OpenStreetMap — no key, no fee", "Mapbox / Esri for high traffic"],
    ["Backend", "Python standard library — zero install", "FastAPI on AWS / GCP, autoscaling"],
    ["NLP / triage", "Rule-based keyword + geo matching", "Claude / GPT API for richer extraction"],
    ["Geocoding", "Nominatim (free) / pre-tagged coords", "Paid geocoder for volume + SLA"],
    ["Data feeds", "Simulated multi-channel crisis stream", "Live 112 / control-room CAD, social, sensors"],
    ["Hosting", "Runs on a laptop / free tier", "Cloud + redundancy + offline mesh"],
  ];
  const rows = [ new TableRow({ tableHeader: true, children: head.map((h, i) =>
    cell([runs(h, { bold: true, color: "FFFFFF", size: 18 })], { w: widths[i], fill: C.accent })) }) ];
  data.forEach((r, ri) => rows.push(new TableRow({ children: r.map((t, i) =>
    cell([runs(t, { size: 18, color: i === 1 ? C.low : C.text, bold: i === 0 })], { w: widths[i], fill: ri % 2 ? "F4F7FB" : "FFFFFF" })) })));
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths, rows });
}

// ---- build doc ----
const doc = new Document({
  creator: "ResQView Team",
  title: "ResQView — IEEE Response Quest Proposal",
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: C.text } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 34, bold: true, font: "Arial", color: C.text },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: C.accent },
        paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 1,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.line, space: 4 } } } },
    ],
  },
  numbering: { config: [
    { reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 260 } } } }] },
  ]},
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1260, left: 1440 } } },
    footers: { default: new Footer({ children: [ new Paragraph({
      tabStops: [{ type: "right", position: CONTENT_W }],
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 6 } },
      children: [
        new TextRun({ text: "ResQView · IEEE Response Quest™ Challenge 2026", size: 16, color: C.muted }),
        new TextRun({ text: "\tPage ", size: 16, color: C.muted }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.muted }),
      ] })] }) },
    children: [
      // ---- title block ----
      new Paragraph({ spacing: { before: 200, after: 40 }, children: [new TextRun({ text: "IEEE RESPONSE QUEST™ CHALLENGE · 2026", bold: true, color: C.accent, size: 18 })] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "ResQView", bold: true, size: 60, color: C.text })] }),
      new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: "A live common operating picture for disaster response — turning the flood of crisis data into one ranked, mapped view responders can read in five seconds.", size: 26, color: C.muted, italics: true })] }),
      new Paragraph({ spacing: { after: 60 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.line, space: 6 } }, children: [
        new TextRun({ text: "Category: ", bold: true, size: 20 }), new TextRun({ text: "Emergency Intelligence     ", size: 20, color: C.muted }),
        new TextRun({ text: "Disciplines: ", bold: true, size: 20 }), new TextRun({ text: "Data Science · GIS · NLP · Emergency Management     ", size: 20, color: C.muted }),
        new TextRun({ text: "Status: ", bold: true, size: 20 }), new TextRun({ text: "Concept + working prototype", size: 20, color: C.muted }),
      ]}),

      new Paragraph({ spacing: { before: 240, after: 80 }, children: [new TextRun({ text: "Contents", bold: true, size: 22, color: C.text })] }),
      new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "2-2" }),
      new Paragraph({ children: [new PageBreak()] }),

      // ---- 1 Executive summary ----
      H2("1. Executive summary"),
      P("In a disaster, the bottleneck is not a lack of information — it is too much of it, scattered across too many channels. ResQView ingests every incoming channel (112 emergency calls, social media, SMS, sensors), uses language processing to extract what is happening, where, and how urgent it is, then merges duplicate reports into single verified incidents and ranks them by severity on a live map."),
      P("The result is one screen that lets dispatchers and field commanders act with greater speed, clarity, and confidence. A working prototype already runs end-to-end on a simulated flood scenario at zero cost, with a clear path to scale on funding."),

      // ---- 2 Problem ----
      H2("2. The problem"),
      P("A single major flood can generate thousands of reports in the first hour. Today, responders monitor these channels separately and must manually read, locate, de-duplicate, and prioritise them while lives are on the line. Critical reports get buried, the same incident is reported dozens of times, and decisions are made on a partial picture."),
      bullet("Thousands of reports per hour during a major event."),
      bullet("A large share are duplicates of incidents already known."),
      bullet("Five or more channels are watched separately, with no unified ranked view."),

      // ---- 3 Solution ----
      H2("3. The solution — ResQView"),
      P("One screen. Every incident. Worst-first. ResQView fuses all channels into a single ranked, mapped operating picture. The mock-up below shows the responder's view during an active event — it reflects the real output of the working prototype, which collapsed 25 raw reports into 12 verified, ranked incidents."),
      new Paragraph({ spacing: { before: 60, after: 80 }, children: [] }),
      dashboardVisual(),
      new Paragraph({ spacing: { before: 100, after: 120 }, children: [new TextRun({ text: "Each incident shows how many raw reports were merged into it and from which channels, so a human always verifies against the original sources before acting. Severity colour runs critical (red) → high (orange) → medium (yellow) → informational (blue).", size: 18, color: C.muted, italics: true })] }),

      // ---- 4 How it works ----
      H2("4. How it works"),
      P("A four-stage pipeline runs continuously in near real-time:"),
      bullet("Ingest — pull 112 emergency calls, social posts, SMS hotlines and IoT sensors into one stream as they arrive."),
      bullet("Extract — read each message for location, need (rescue / fire / medical / hazard), and urgency, turning “stuck on roof, water rising” into structured, geocoded data."),
      bullet("Cluster — merge reports about the same event (by location and meaning) into one verified incident, removing duplicate noise."),
      bullet("Triage & map — score each incident by severity and place it on the map, ranked worst-first, with all sources attached."),
      P("Human-in-the-loop by design. ResQView is decision support, never autonomous dispatch. Every flag exposes its confidence and links back to raw sources, so commanders trust it and stay in control.", { bold: false }),

      // ---- 5 Build plan ----
      H2("5. Build plan"),
      bullet("Phase 1 — Demo (done): full pipeline on a simulated flood feed with a live map dashboard. Built now at zero cost."),
      bullet("Phase 2 — Pilot: connect a live social stream and a partner agency’s report intake; add language-model extraction and confidence tuning."),
      bullet("Phase 3 — Scale: multi-incident, multi-agency, offline-resilient; hardened, hosted, with role-based access for command centres."),

      // ---- 6 Resources & cost ----
      H2("6. Resources & cost"),
      P("Free to build today, with a clear path to scale on funding. The architecture is identical at every stage — funding only swaps individual components for higher-capacity paid ones."),
      costTable(),
      new Paragraph({ spacing: { before: 100 }, children: [
        new TextRun({ text: "Total cost to demo: ", size: 20, color: C.text }),
        new TextRun({ text: "$0.", bold: true, size: 20, color: C.low }),
      ]}),

      // ---- 7 Why it fits ----
      H2("7. Why it fits the challenge"),
      bullet("Directly answers the brief: identify, organise, and visualise emergency information in near real-time."),
      bullet("Genuinely cross-disciplinary — data science, GIS, NLP and emergency management in one tool."),
      bullet("Demoable: a judge sees a real, working dashboard, not just slides."),
      bullet("Responder-first: built around trust, source traceability, and human control."),
      bullet("Credible scaling story for funding without re-architecting."),

      new Paragraph({ spacing: { before: 260 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 6 } }, children: [
        new TextRun({ text: "Submission deadline: 29 May 2026 · entry must be led by an IEEE member. This document is accompanied by a runnable prototype (Python + Leaflet).", size: 18, color: C.muted, italics: true }),
      ]}),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("ResQView-Proposal.docx", buf);
  console.log("wrote ResQView-Proposal.docx", buf.length, "bytes");
});
