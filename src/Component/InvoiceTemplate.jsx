import React from 'react';
import { format } from 'date-fns';

const numberToWords = (num) => {
  const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if ((num = num.toString()).length > 9) return 'overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] !== '00') ? (a[Number(n[1])] || (b[n[1][0]] + ' ' + a[n[1][1]])) + 'Crore ' : '';
  str += (n[2] !== '00') ? (a[Number(n[2])] || (b[n[2][0]] + ' ' + a[n[2][1]])) + 'Lakh ' : '';
  str += (n[3] !== '00') ? (a[Number(n[3])] || (b[n[3][0]] + ' ' + a[n[3][1]])) + 'Thousand ' : '';
  str += (n[4] !== '0') ? (a[Number(n[4])] || (b[n[4][0]] + ' ' + a[n[4][1]])) + 'Hundred ' : '';
  str += (n[5] !== '00') ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || (b[n[5][0]] + ' ' + a[n[5][1]])) + 'Only' : '';
  return str.trim() || 'Zero Rupees Only';
};

const splitAddressIntoTwo = (addr) => {
  if (!addr) return ['', ''];
  const a = addr.trim();
  const kilRegex = /\bKil\b/i;
  const kilMatch = a.match(kilRegex);
  if (kilMatch) {
    const idx = kilMatch.index;
    const line1 = a.slice(0, idx).trim().replace(/,+$/, '');
    const line2 = a.slice(idx).trim();
    return [line1, line2];
  }
  const parts = a.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length <= 2) return [parts.join(', '), ''];
  const half = Math.ceil(parts.length / 2);
  return [parts.slice(0, half).join(', '), parts.slice(half).join(', ')];
};

const safeParseItems = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

export default function InvoiceTemplate({ booking = {}, company = {}, states = [], billDate }) {
  const customer = {
    name: booking.customer_name || '',
    address: booking.customer_address || '',
    gstin: booking.customer_gstin || '',
    place: booking.customer_place || ''
  };

  const cart = safeParseItems(booking.items);
  const through = booking.through || 'DIRECT';
  const destination = booking.destination || '';
  const subtotal = parseFloat(booking.subtotal || 0);
  const packing_amount = parseFloat(booking.packing_amount || 0);
  const extra_amount = parseFloat(booking.extra_amount || 0);
  const cgst = parseFloat(booking.cgst_amount || 0);
  const sgst = parseFloat(booking.sgst_amount || 0);
  const igst = parseFloat(booking.igst_amount || 0);
  const netAmount = parseFloat(booking.net_amount || 0);
  const billNumber = booking.bill_no || '';
  const billType = (booking.type || 'tax').toLowerCase();
  const isIGST = booking.customer_state_code !== '33';

  const totalCases = cart.reduce((sum, i) => sum + (parseInt(i.cases) || 0), 0);
  const taxableValue = subtotal + packing_amount + extra_amount;

  const [addrLine1, addrLine2] = splitAddressIntoTwo(company?.address || '');

  const getPlaceOfSupply = () => {
    if (!customer.place) return "33 - Tamil Nadu";
    const s = states.find(st => st.state_name === customer.place);
    return s ? `${s.code} - ${s.state_name}` : customer.place;
  };

  const invoiceTitle = billType === 'tax' ? 'TAX INVOICE' : 'BILL OF SUPPLY';

  return (
    <div style={{ padding: 2, background: "#fff", color: "#000", fontFamily: "Arial, sans-serif", boxSizing: "border-box" }}>
      <div style={{ border: "1px solid #000" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px double #000", padding: "10px 20px" }}>
          <div style={{ width: "150px" }}>
            {/* Logo placeholder */}
          </div>
          <div style={{ textAlign: "center", lineHeight: 1.4, width: "1000px" }}>
            <div style={{ display: "inline-flex", justifyContent: "center", alignItems: "center", fontSize: 15, fontWeight: 900, textTransform: "uppercase", border: "1px solid #000", padding: "8px 10px", minWidth: "200px" }}>
              {invoiceTitle}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, textTransform: "uppercase", marginTop: 8 }}>
              {company?.company_name || "NISHA TRADERS"}
            </div>
            <div style={{ fontSize: 15 }}>{addrLine1}</div>
            <div style={{ fontSize: 15 }}>{addrLine2}</div>
            <div style={{ fontSize: 14, marginTop: 6, fontWeight: "bold" }}>
              GSTIN: {company?.gstin || ""} &nbsp;&nbsp; 
              Mobile: {company?.mobile || ""} &nbsp;&nbsp; 
              Email: {company?.email || ""}
            </div>
          </div>
          <div style={{ width: "150px" }} />
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
          <div style={{ flex: 1, padding: 15, fontSize: 14, borderRight: "1px solid #000" }}>
            <strong>To:</strong>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
              {customer.name || "______________________"}
            </div>
            {(customer.address || "").split("\n").map((line, i) => (
              <div key={i}>{line || "\u00A0"}</div>
            ))}
            <div style={{ marginTop: 6 }}>
              Place of Supply : {getPlaceOfSupply()}
            </div>
          </div>
          <div style={{ width: 383, padding: 15, fontSize: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #000", paddingBottom: 6 }}>
              <div>No. : <strong>{billNumber}</strong></div>
              <div>Date : {billDate ? format(new Date(billDate), "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy")}</div>
            </div>
            <div style={{ marginTop: 6 }}>Through : {through}</div>
            <div style={{ marginTop: 6 }}>No. of Cases : {totalCases} Cases</div>
            <div style={{ marginTop: 6 }}>GSTIN : {customer.gstin || "---"}</div>
            <div style={{ marginTop: 6 }}>Destination : {destination || customer.place || "__________"}</div>
          </div>
        </div>

        {/* Table remains the same */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "center" }}>
          <thead>
            <tr>
              <th style={{ padding: 6, width: "14%", background: "#f1f1f1", fontWeight: 700, borderBottom: "1px solid #000" }}>
                COMPANY
              </th>
              <th style={{ padding: 6, width: "35%", background: "#f1f1f1", fontWeight: 700, borderLeft: "1px solid #000", borderBottom: "1px solid #000" }}>
                PRODUCT NAME <span style={{ fontSize: "15px", fontWeight: 900 }}>HSN: 360410</span>
              </th>
              <th style={{ padding: 6, width: "8%", background: "#f1f1f1", fontWeight: 700, borderLeft: "1px solid #000", borderBottom: "1px solid #000" }}>
                CASES
              </th>
              <th style={{ padding: 6, width: "14%", background: "#f1f1f1", fontWeight: 700, borderLeft: "1px solid #000", borderBottom: "1px solid #000" }}>
                QUANTITY
              </th>
              <th style={{ padding: 6, width: "16%", background: "#f1f1f1", fontWeight: 700, borderLeft: "1px solid #000", borderBottom: "1px solid #000" }}>
                RATE PER
              </th>
              <th style={{ padding: 6, width: "20%", background: "#f1f1f1", fontWeight: 700, borderLeft: "1px solid #000", borderBottom: "1px solid #000" }}>
                AMOUNT
              </th>
            </tr>
          </thead>
          <tbody>
            {cart.map((it, idx) => (
              <tr key={idx}>
                <td style={{ borderBottom: "1px solid #000", padding: 6 }}></td>
                <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 6 }}>
                  {it.productname || ''}
                </td>
                <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 6, fontWeight: 700 }}>
                  {it.cases || 0}
                </td>
                <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 6 }}>
                  {it.cases || 0} Case
                </td>
                <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 6 }}>
                  {(parseFloat(it.rate_per_box) || 0).toFixed(2)}
                </td>
                <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 6, fontWeight: 700 }}>
                  {((parseInt(it.cases) || 0) * (parseFloat(it.rate_per_box) || 0)).toFixed(2)}
                </td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 10 - cart.length) }).map((_, i) => (
              <tr key={"blank-" + i}>
                <td style={{ borderBottom: "1px solid #000", padding: 12 }}>&nbsp;</td>
                <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 12 }}>&nbsp;</td>
                <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 12 }}>&nbsp;</td>
                <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 12 }}>&nbsp;</td>
                <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 12 }}>&nbsp;</td>
                <td style={{ borderBottom: "1px solid #000", borderLeft: "1px solid #000", padding: 12 }}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
          <div style={{ flex: 1, fontSize: 12, padding: 12, borderRight: "1px solid #000" }}>
            <div style={{ marginBottom: 6 }}>
              <strong>Total Cases: {totalCases}</strong>
            </div>
            <div>
              <strong>Our Bank Account:</strong>
              <div>Bank: {company?.bank_name || "Tamilnad Mercantile Bank Ltd."}</div>
              <div>Branch: {company?.branch || "SIVAKASI"}</div>
              <div>A/c No.: {company?.account_no || ""}</div>
              <div>IFSC: {company?.ifsc_code || ""}</div>
            </div>
          </div>
          <div style={{ width: 383, padding: 12, fontSize: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td>Total</td>
                  <td style={{ textAlign: "right" }}>{subtotal.toFixed(2)}</td>
                </tr>

                {/* Tax lines only for TAX INVOICE */}
                {billType === 'tax' && (
                  <>
                    <tr>
                      <td>Taxable Value</td>
                      <td style={{ textAlign: "right" }}>{taxableValue.toFixed(2)}</td>
                    </tr>
                    {!isIGST && (
                      <>
                        <tr><td>CGST 9%</td><td style={{ textAlign: "right" }}>{cgst.toFixed(2)}</td></tr>
                        <tr><td>SGST 9%</td><td style={{ textAlign: "right" }}>{sgst.toFixed(2)}</td></tr>
                      </>
                    )}
                    {isIGST && (
                      <tr><td>IGST 18%</td><td style={{ textAlign: "right" }}>{igst.toFixed(2)}</td></tr>
                    )}
                  </>
                )}

                <tr style={{ fontWeight: 800, borderTop: "1px solid #000" }}>
                  <td>NET AMOUNT</td>
                  <td style={{ textAlign: "right" }}>{netAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "10px 0", borderBottom: "1px solid #000", fontWeight: 700 }}>
          Rupees {numberToWords(Math.round(netAmount))} Only
        </div>

        {/* Footer - Terms vs Party Signature */}
        <div style={{ height: 110, display: "flex" }}>
          {billType === 'tax' ? (
            <div style={{ flex: 1, padding: 12, fontSize: 12, borderRight: "1px solid #000" }}>
              <strong>TERMS & CONDITIONS:</strong>
              <div>• Goods once sold cannot be taken back</div>
              <div>• We are not responsible for damage / shortage</div>
              <div>• Subject to SIVAKASI jurisdiction</div>
              <div style={{ marginTop: 5 }}>• E.&O.E.</div>
            </div>
          ) : (
            <div style={{ flex: 1, padding: 12, fontSize: 14, borderRight: "1px solid #000", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <strong>Party Signature</strong>
              <div style={{ marginTop: 20, height: 80, width: "80%", borderBottom: "2px dashed #000" }} />
            </div>
          )}
          <div style={{ width: 383, padding: 12, fontSize: 14, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <div>For {company?.company_name || "NISHA TRADERS"}</div>
            <div style={{ marginTop: 4, width: 150, textAlign: "center" }}>
              {company?.signature_url ? (
                <img 
                  src={company.signature_url} 
                  style={{ maxHeight: 50, maxWidth: "100%", objectFit: "contain" }} 
                  alt="Signature"
                />
              ) : (
                <div style={{ borderTop: "1px solid #000", height: 70, width: "100%" }} />
              )}
            </div>
            <div style={{ fontWeight: 700 }}>Partner / Manager</div>
          </div>
        </div>
      </div>
    </div>
  );
}