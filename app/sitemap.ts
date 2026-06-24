import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://sanel-ug.online', lastModified: new Date() },
    { url: 'https://sanel-ug.online/about', lastModified: new Date() },
    { url: 'https://sanel-ug.online/contact', lastModified: new Date() },
  ]
}