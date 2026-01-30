import { Thing, WithContext } from 'schema-dts'

interface JsonLdProps {
  data: WithContext<Thing> | WithContext<Thing>[] | Record<string, any>
}

/**
 * Componente para injetar JSON-LD estruturado no HTML
 *
 * Aceita qualquer schema type-safe do schema-dts ou objetos JSON-LD customizados
 *
 * @example
 * ```tsx
 * // Com schema type-safe
 * <JsonLd data={blogPostingSchema} />
 *
 * // Com schema customizado (FAQ, etc)
 * <JsonLd data={faqSchema} />
 *
 * // Array de schemas
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
