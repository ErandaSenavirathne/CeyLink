import { Helmet } from 'react-helmet-async'

export default function SEO({ title, description, name, type }) {
  const defaultTitle = 'CeyLink | Find Local Service Providers in Sri Lanka'
  const defaultDescription = 'Connect with trusted plumbers, electricians, tutors, and more across Sri Lanka.'
  
  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title || defaultTitle}</title>
      <meta name='description' content={description || defaultDescription} />
      
      {/* OpenGraph tags */}
      <meta property='og:type' content={type || 'website'} />
      <meta property='og:title' content={title || defaultTitle} />
      <meta property='og:description' content={description || defaultDescription} />
      <meta property='og:site_name' content='CeyLink' />
      
      {/* Twitter tags */}
      <meta name='twitter:creator' content={name || 'CeyLink'} />
      <meta name='twitter:card' content='summary' />
      <meta name='twitter:title' content={title || defaultTitle} />
      <meta name='twitter:description' content={description || defaultDescription} />
    </Helmet>
  )
}
