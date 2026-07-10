import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

/**
 * Server-rendered Right to Work Check Record — the statutory-excuse document
 * (FR-4.3). This record IS the employer's legal defence, so it is deposited to
 * the evidence vault and kept for the retention period. It is a factual record of
 * a correctly conducted check, not an examined artefact.
 */
export interface RtwRecordPdfData {
  businessName: string;
  personName: string;
  personRole?: string | null;
  method: string; // "Manual check" | "Online check" | "Home Office check"
  whatChecked: string;
  checkedBy: string;
  checkedDate: string;
  resultLabel: string; // "Permanent right to work" | "Time-limited permission until …"
  followUpDue?: string | null;
  evidenceCount: number;
  reference: string; // short record hash, e.g. "6D1A-9E44"
}

const INK = "#0E1B2C";
const GREEN = "#178055";
const NEUTRAL = "#5A626C";
const HAIRLINE = "#D8D3C8";

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: INK, backgroundColor: "#FDFBF5" },
  kicker: { fontSize: 8, letterSpacing: 1.5, color: NEUTRAL, textTransform: "uppercase", marginBottom: 6 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  company: { fontSize: 11, color: NEUTRAL, marginBottom: 16 },
  sealBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: GREEN, borderRadius: 6, padding: 12, marginBottom: 20, backgroundColor: "#E4F3EC" },
  sealLabel: { fontSize: 8, letterSpacing: 1, color: GREEN, textTransform: "uppercase", marginBottom: 3 },
  sealValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: GREEN },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: HAIRLINE, paddingVertical: 9 },
  rowLabel: { width: 150, fontSize: 9, color: NEUTRAL, textTransform: "uppercase", letterSpacing: 0.6 },
  rowValue: { flex: 1, fontSize: 11, fontFamily: "Helvetica-Bold" },
  note: { marginTop: 18, padding: 12, backgroundColor: "rgba(14,27,44,0.05)", borderRadius: 6, fontSize: 9, color: NEUTRAL, lineHeight: 1.5 },
  footer: { marginTop: 14, fontSize: 8, color: NEUTRAL, lineHeight: 1.4 },
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

function RtwDoc({ d }: { d: RtwRecordPdfData }) {
  return (
    <Document title={`Right to Work Check Record — ${d.personName}`}>
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Right to Work Check Record · Statutory excuse</Text>
        <Text style={s.title}>{d.personName}</Text>
        <Text style={s.company}>{d.businessName}</Text>

        <View style={s.sealBox}>
          <View>
            <Text style={s.sealLabel}>Check completed</Text>
            <Text style={s.sealValue}>{d.resultLabel}</Text>
          </View>
          <View>
            <Text style={s.sealLabel}>Record</Text>
            <Text style={s.sealValue}>{d.reference}</Text>
          </View>
        </View>

        <Row label="Who checked" value={d.checkedBy} />
        <Row label="Who was checked" value={d.personRole ? `${d.personName} — ${d.personRole}` : d.personName} />
        <Row label="What was checked" value={d.whatChecked} />
        <Row label="Method" value={d.method} />
        <Row label="Date of check" value={d.checkedDate} />
        <Row label="Result" value={d.resultLabel} />
        {d.followUpDue ? <Row label="Follow-up due by" value={d.followUpDue} /> : null}
        <Row label="Evidence" value={`${d.evidenceCount} image${d.evidenceCount === 1 ? "" : "s"} attached, stored securely`} />

        <Text style={s.note}>
          A correct, dated right to work check gives the employer a statutory excuse — a complete legal defence against a
          civil penalty, even if it later turns out the person was not allowed to work. This record, kept with the
          evidence, is that defence.
        </Text>
        <Text style={s.footer}>
          Recorded by FirstEmployer. Reference {d.reference}. Every worker is checked the same way (Equality Act 2010).
          Retained for the statutory period (employment plus two years).
        </Text>
      </Page>
    </Document>
  );
}

export async function renderRtwRecordPdf(d: RtwRecordPdfData): Promise<Buffer> {
  return renderToBuffer(<RtwDoc d={d} />);
}
