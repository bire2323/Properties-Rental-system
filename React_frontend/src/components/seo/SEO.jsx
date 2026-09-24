import { SITE_NAME, resolveUrl } from '../../lib/seo'

function SEO({
  title,
  description,
  canonical,
  path,
  image,
  noindex = false,
  structuredData,
  type = 'website',
}) {
  const canonicalUrl = resolveUrl(canonical || path || '/')
  const imageUrl = image ? resolveUrl(image) : null
  const robots = noindex ? 'noindex,nofollow' : 'index,follow'

  return (
    <>
      {title ? <title>{title}</title> : <title>{SITE_NAME}</title>}
      {description ? <meta name="description" content={description} /> : null}
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={robots} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      {title ? <meta property="og:title" content={title} /> : null}
      {description ? <meta property="og:description" content={description} /> : null}
      <meta property="og:url" content={canonicalUrl} />
      {imageUrl ? <meta property="og:image" content={imageUrl} /> : null}
      <meta name="twitter:card" content={imageUrl ? 'summary_large_image' : 'summary'} />
      {title ? <meta name="twitter:title" content={title} /> : null}
      {description ? <meta name="twitter:description" content={description} /> : null}
      {imageUrl ? <meta name="twitter:image" content={imageUrl} /> : null}
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      ) : null}
    </>
  )
}

export default SEO