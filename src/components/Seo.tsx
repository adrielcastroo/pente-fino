import { Helmet } from 'react-helmet-async';

interface SeoProps {
  title: string;
  description: string;
  path?: string; // ex: "/estoque/mapa"
  noindex?: boolean;
}

const BASE_URL = 'https://pente-fino.lovable.app';

/**
 * SEO por rota: title (<=60 chars), description (<=160), canonical + og:url.
 * O og:image sitewide do index.html permanece como fallback para crawlers sem JS.
 */
export default function Seo({ title, description, path = '/', noindex = false }: SeoProps) {
  const url = `${BASE_URL}${path}`;
  const safeTitle = title.length > 60 ? `${title.slice(0, 57)}...` : title;
  const safeDesc = description.length > 160 ? `${description.slice(0, 157)}...` : description;

  return (
    <Helmet>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDesc} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDesc} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDesc} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
    </Helmet>
  );
}
