const tei = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title level="a" type="main">A Study Without Any Conventional Section Numbering</title>
      </titleStmt>
    </fileDesc>
  </teiHeader>
  <text xml:lang="en">
    <body>
      <div xmlns="http://www.tei-c.org/ns/1.0">
        <head>What we set out to do</head>
        <p>We wanted to know whether the effect survives replication.</p>
      </div>
      <div xmlns="http://www.tei-c.org/ns/1.0">
        <head n="2">How we went about it</head>
        <p>We repeated the original protocol with a larger cohort &amp; a preregistration.</p>
      </div>
      <div xmlns="http://www.tei-c.org/ns/1.0">
        <head></head>
        <p>An untitled division must not become an empty heading.</p>
      </div>
    </body>
    <back>
      <div type="references">
        <listBibl>
          <biblStruct xml:id="b0"><monogr><title level="m">First cited work</title></monogr></biblStruct>
          <biblStruct xml:id="b1"><monogr><title level="m">Second cited work</title></monogr></biblStruct>
        </listBibl>
      </div>
    </back>
  </text>
</TEI>`;

export const routes = [
  {
    match: "/api/processFulltextDocument",
    body: tei,
    headers: { "content-type": "application/xml" },
  },
];
