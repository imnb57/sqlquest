/**
 * Renders JSON-LD structured data.
 *
 * The payload is stringified and the closing-tag sequence escaped, which is
 * the one XSS vector a `<script type="application/ld+json">` block has.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
           
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
