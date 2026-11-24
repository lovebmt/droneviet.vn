<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Content: articles are written locally, then published through the API

Any article or written page content (R&D guide/research/news, legal guides for /dao-tao/*) MUST follow the project skill `.claude/skills/write-article/SKILL.md` (skill name `write-article`):

- The source of every article is `content/<area>/<slug>/index.md` (+ images), committed to git. `content/` is the origin backup of what is in the database.
- Publish with `npm run content:publish -- content/<area>/<slug>` (draft) or `... --publish`, which uploads images to R2 and saves the article through the API into the database. No deploy is needed.
- Publish only after the owner has approved the text. Never edit articles only in the admin or the database without updating the file in `content/`.
- Legal guides (`kind: phap-ly`) cite the article and clause of the original text for every statement and end with the reference disclaimer; see the skill.
- Not articles: product, combo, course and workshop descriptions (admin) and fixed page copy in `src/content/*.ts` (code, needs a deploy).
