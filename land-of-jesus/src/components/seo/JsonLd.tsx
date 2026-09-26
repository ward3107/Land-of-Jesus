/**
 * Renders a JSON-LD structured-data block from our own trusted data (site
 * constants + translated strings, never user input). We still escape `<` so a
 * stray `</script>` inside any string can't break out of the script tag — the
 * standard safe way to embed JSON-LD.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
