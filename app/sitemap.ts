import { MetadataRoute } from 'next' 

export default function sitemap():
MetadataRoute.Sitemap{
  return [
   {
     url:'https://sanel-ug.online',
     lastModified: newDate(),
     changeFrequency: 'weekly',
     priority:1,
    }
  ]
}