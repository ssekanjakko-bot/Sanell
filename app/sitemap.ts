import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://sanel-ug.online/', lastModified: new Date() }
  ]
}