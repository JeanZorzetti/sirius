import { Thing, WithContext } from 'schema-dts'

interface JsonLdProps {
  data: WithContext<Thing> | WithContext<Thing>[]
}

/**
 * Componente para injetar JSON-LD estruturado no HTML
 *
 * Aceita qualquer schema type-safe do schema-dts e injeta como script application/ld+json
 *
 * @example
 * ```tsx
 * <JsonLd data={blogPostingSchema} />
 * <JsonLd data={[blogPostingSchema, faqSchema]} />
 * ```
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0), // Minified for production
      }}
    />
  )
}
