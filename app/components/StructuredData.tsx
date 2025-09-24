import Script from 'next/script'

interface OrganizationSchemaProps {
  name: string
  url: string
  logo: string
  description: string
  contactPoint?: {
    telephone: string
    contactType: string
    email: string
  }
  sameAs?: string[]
}

interface ProductSchemaProps {
  name: string
  description: string
  image: string
  brand: string
  sku: string
  price: number
  currency: string
  availability: string
  url: string
  features?: string[]
  aggregateRating?: {
    ratingValue: number
    reviewCount: number
  }
  offers?: {
    price: number
    currency: string
    availability: string
    validFrom?: string
  }
}

interface BreadcrumbSchemaProps {
  items: Array<{
    name: string
    url: string
  }>
}

interface BlogPostSchemaProps {
  headline: string
  description: string
  image: string
  author: string
  datePublished: string
  dateModified: string
  url: string
  publisher: {
    name: string
    logo: string
  }
}

export function OrganizationSchema({ 
  name, 
  url, 
  logo, 
  description, 
  contactPoint,
  sameAs 
}: OrganizationSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": name,
    "url": url,
    "logo": logo,
    "description": description,
    ...(contactPoint && { "contactPoint": contactPoint }),
    ...(sameAs && { "sameAs": sameAs })
  }

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function ProductSchema({ 
  name, 
  description, 
  image, 
  brand, 
  sku, 
  price, 
  currency, 
  availability, 
  url,
  features,
  aggregateRating,
  offers 
}: ProductSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "description": description,
    "image": image,
    "brand": {
      "@type": "Brand",
      "name": brand
    },
    "sku": sku,
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": currency,
      "availability": availability,
      "url": url,
      ...(offers?.validFrom && { "validFrom": offers.validFrom })
    },
    ...(aggregateRating && { "aggregateRating": aggregateRating }),
    ...(features && { "additionalProperty": features.map(feature => ({
      "@type": "PropertyValue",
      "name": "Feature",
      "value": feature
    })) })
  }

  return (
    <Script
      id="product-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BlogPostSchema({ 
  headline, 
  description, 
  image, 
  author, 
  datePublished, 
  dateModified, 
  url, 
  publisher 
}: BlogPostSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": headline,
    "description": description,
    "image": image,
    "author": {
      "@type": "Person",
      "name": author
    },
    "datePublished": datePublished,
    "dateModified": dateModified,
    "url": url,
    "publisher": {
      "@type": "Organization",
      "name": publisher.name,
      "logo": {
        "@type": "ImageObject",
        "url": publisher.logo
      }
    }
  }

  return (
    <Script
      id="blog-post-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BubbleBeads",
    "url": process.env.NEXT_PUBLIC_BASE_URL || "https://bubblebeads.in",
    "description": "Revolutionary laundry detergent pods for modern households. Premium cleaning solutions with eco-friendly ingredients.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${process.env.NEXT_PUBLIC_BASE_URL || "https://bubblebeads.in"}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <Script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}