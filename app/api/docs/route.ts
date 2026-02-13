import { NextRequest, NextResponse } from 'next/server'
import { publicRateLimit } from '@/lib/ratelimit'

/**
 * GET /api/docs
 * Interactive API documentation using Scalar UI
 */
export async function GET(req: NextRequest) {
  const blocked = await publicRateLimit(req)
  if (blocked) return blocked

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>CRM API Documentation</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/api/openapi.json"
      data-proxy-url="https://proxy.scalar.com"
    ></script>

    <script>
      var configuration = {
        theme: 'default',
        darkMode: true,
        layout: 'modern',
        hideModels: false,
        hideDownloadButton: false,
        hideDarkModeToggle: false,
        authentication: {
          preferredSecurityScheme: 'BearerAuth',
          http: {
            bearer: {
              token: ''
            }
          }
        },
        customCss: \`
          .scalar-app {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
          .scalar-card {
            border-radius: 8px;
          }
        \`
      }

      document.getElementById('api-reference').dataset.configuration = JSON.stringify(configuration)
    </script>

    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}
