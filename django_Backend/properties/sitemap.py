from django.http import HttpResponse

from .models import ListingStatus, ListingType, Property

FRONTEND_BASE_URL = "https://getspace-v1.vercel.app"

STATIC_URLS = [
    {"loc": "/", "changefreq": "daily", "priority": "1.0"},
    {"loc": "/properties", "changefreq": "daily", "priority": "0.9"},
    {"loc": "/vehicles", "changefreq": "daily", "priority": "0.8"},
    {"loc": "/about", "changefreq": "monthly", "priority": "0.6"},
    {"loc": "/become-owner", "changefreq": "monthly", "priority": "0.5"},
]


def _escape(value):
    if value is None:
        return ""
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def _url_block(loc, lastmod=None, changefreq=None, priority=None):
    parts = [f"    <loc>{_escape(loc)}</loc>"]
    if lastmod:
        parts.append(f"    <lastmod>{lastmod}</lastmod>")
    if changefreq:
        parts.append(f"    <changefreq>{changefreq}</changefreq>")
    if priority:
        parts.append(f"    <priority>{priority}</priority>")
    return "  <url>\n" + "\n".join(parts) + "\n  </url>"


def sitemap_xml(request):
    url_blocks = []

    for entry in STATIC_URLS:
        url_blocks.append(
            _url_block(
                f"{FRONTEND_BASE_URL}{entry['loc']}",
                changefreq=entry["changefreq"],
                priority=entry["priority"],
            )
        )

    public_properties = (
        Property.objects.filter(status=ListingStatus.ACTIVE, is_available=True)
        .only("id", "listing_type", "updated_at")
    )

    for prop in public_properties.iterator():
        if prop.listing_type == ListingType.HOUSE:
            path = f"properties/{prop.id}"
        else:
            path = f"vehicles/{prop.id}"
        lastmod = prop.updated_at.strftime("%Y-%m-%d") if prop.updated_at else None
        url_blocks.append(
            _url_block(
                f"{FRONTEND_BASE_URL}/{path}",
                lastmod=lastmod,
                changefreq="weekly",
                priority="0.7",
            )
        )

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(url_blocks)
        + "\n</urlset>"
    )

    response = HttpResponse(xml, content_type="application/xml")
    response["Cache-Control"] = "public, max-age=3600, s-maxage=86400"
    return response