import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vat = searchParams.get("vat");

    if (!vat || vat.length < 4) {
      return NextResponse.json({ valid: false, error: "Numero TVA trop court" });
    }

    const countryCode = vat.substring(0, 2).toUpperCase();
    const vatNumber = vat.substring(2).replace(/\s/g, "");

    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
        <soapenv:Body>
          <urn:checkVat>
            <urn:countryCode>${countryCode}</urn:countryCode>
            <urn:vatNumber>${vatNumber}</urn:vatNumber>
          </urn:checkVat>
        </soapenv:Body>
      </soapenv:Envelope>`;

    const response = await fetch(
      "https://ec.europa.eu/taxation_customs/vies/services/checkVatService",
      {
        method: "POST",
        headers: { "Content-Type": "text/xml; charset=utf-8" },
        body: soapBody,
        signal: AbortSignal.timeout(8000),
      }
    );

    const text = await response.text();

    const validMatch = text.match(/<valid>(.*?)<\/valid>/);
    const nameMatch = text.match(/<traderName>(.*?)<\/traderName>/);
    const addressMatch = text.match(/<traderAddress>(.*?)<\/traderAddress>/);

    const valid = validMatch?.[1] === "true";
    const name = nameMatch?.[1] || "";
    const address = addressMatch?.[1] || "";

    return NextResponse.json({
      valid,
      countryCode,
      vatNumber,
      name: name === "---" ? "" : name,
      address: address === "---" ? "" : address,
    });

  } catch (error) {
    console.error("Erreur VIES:", error);
    return NextResponse.json({
      valid: false,
      error: "Service VIES indisponible",
    });
  }
}