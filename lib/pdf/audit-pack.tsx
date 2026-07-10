import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

/**
 * Audit-pack cover + index pages (FR-5.4). The bundle assembler (pdf-lib)
 * appends the artefacts after these, so each index row carries the real page
 * number the artefact starts at.
 */
export interface AuditIndexRow {
  n: number;
  title: string;
  personName: string;
  dateLabel: string;
  examined: boolean;
  /** 1-based page the artefact starts at in the final bundle. */
  startPage: number;
}

export interface AuditCoverData {
  businessName: string;
  presetLabel: string;
  generatedLabel: string;
  dateRangeLabel: string;
  count: number;
  rows: AuditIndexRow[];
}

const INK = "#0E1B2C";
const GREEN = "#178055";
const NEUTRAL = "#5A626C";
const HAIRLINE = "#D8D3C8";

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: INK, backgroundColor: "#FDFBF5" },
  kicker: { fontSize: 8, letterSpacing: 1.5, color: NEUTRAL, textTransform: "uppercase", marginBottom: 8 },
  title: { fontSize: 24, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  sub: { fontSize: 12, color: NEUTRAL, marginBottom: 22 },
  metaRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: HAIRLINE, borderBottomWidth: 1, borderBottomColor: HAIRLINE, paddingVertical: 12, marginBottom: 24 },
  metaCell: { flex: 1 },
  metaLabel: { fontSize: 8, letterSpacing: 1, color: NEUTRAL, textTransform: "uppercase", marginBottom: 3 },
  metaValue: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  intro: { fontSize: 10.5, lineHeight: 1.55, color: "#2E3947", maxWidth: 420 },
  indexHead: { fontSize: 8, letterSpacing: 1.2, color: NEUTRAL, textTransform: "uppercase", marginBottom: 8, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", borderBottomWidth: 0.5, borderBottomColor: HAIRLINE, paddingVertical: 8 },
  n: { width: 26, fontSize: 10, fontFamily: "Helvetica-Bold", color: NEUTRAL },
  rowTitle: { flex: 1, fontSize: 10.5, fontFamily: "Helvetica-Bold" },
  rowMeta: { fontSize: 9, color: NEUTRAL, marginTop: 2 },
  examined: { fontSize: 8, color: GREEN, fontFamily: "Helvetica-Bold" },
  pageNo: { width: 50, textAlign: "right", fontSize: 10, fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 26, left: 48, right: 48, fontSize: 8, color: NEUTRAL, textAlign: "center" },
});

function AuditCoverDoc({ d }: { d: AuditCoverData }) {
  return (
    <Document title={`Audit pack — ${d.presetLabel} — ${d.businessName}`}>
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Audit pack · FirstEmployer</Text>
        <Text style={s.title}>{d.presetLabel}</Text>
        <Text style={s.sub}>{d.businessName}</Text>
        <View style={s.metaRow}>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Generated</Text>
            <Text style={s.metaValue}>{d.generatedLabel}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Covers</Text>
            <Text style={s.metaValue}>{d.dateRangeLabel}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Documents</Text>
            <Text style={s.metaValue}>{String(d.count)}</Text>
          </View>
        </View>
        <Text style={s.intro}>
          This pack contains every document in scope, in date order — oldest first, exactly how an inspector reads a
          file. Each item is listed in the index with the page it starts on. Documents marked as examined passed the
          FirstEmployer Examiner&apos;s statutory checks before they were released.
        </Text>
        <Text style={s.footer}>Compiled by FirstEmployer. Stored in the UK, encrypted.</Text>
      </Page>
      <Page size="A4" style={s.page}>
        <Text style={s.indexHead}>Index — {d.count} documents, chronological</Text>
        {d.rows.map((r) => (
          <View key={r.n} style={s.row} wrap={false}>
            <Text style={s.n}>{r.n}.</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{r.title}</Text>
              <Text style={s.rowMeta}>
                {r.personName} · {r.dateLabel}
                {r.examined ? "   " : ""}
                {r.examined ? <Text style={s.examined}>Examiner verified</Text> : null}
              </Text>
            </View>
            <Text style={s.pageNo}>p. {r.startPage}</Text>
          </View>
        ))}
        <Text style={s.footer}>Audit pack index. Artefacts follow in the order listed.</Text>
      </Page>
    </Document>
  );
}

export async function renderAuditCover(d: AuditCoverData): Promise<Buffer> {
  return renderToBuffer(<AuditCoverDoc d={d} />);
}
