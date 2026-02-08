# Documentation Migration Research: MkDocs + Material → Astro + Starlight

## Context
Evaluating the feasibility and complexity of migrating the LoKO documentation from MkDocs + Material for MkDocs to Astro + Starlight.

**Current setup:**
- Main docs: `/Users/boki/Code/GitHub/getloko/getloko.github.io` (MkDocs + Material)
- Catalog docs: `/Users/boki/Code/GitHub/getloko/catalog/docs` (MkDocs + Material)

**Questions to answer:**
1. What's the current MkDocs setup and structure?
2. What features are being used (Material theme, plugins, extensions)?
3. How complex would migration to Astro + Starlight be?
4. What would be gained/lost in the migration?

## Phase 1: Initial Understanding - Complete ✓

### Current MkDocs Setup Summary

**Two Separate Documentation Sites:**

#### Main Docs (`getloko.github.io`)
- **Pages:** 29 markdown files (~14,143 lines, 532 KB)
- **Theme:** Material for MkDocs v9.5.3+
- **Features:** 28 Material features enabled (navigation tabs, instant loading, search enhancements, code annotations, tooltips)
- **Plugins:** 4 (search, minify, git-revision-date-localized, built-in search)
- **Extensions:** 26 markdown extensions (PyMdown suite, Mermaid diagrams, math support, emoji, admonitions)
- **Custom Code:** Minimal CSS, MathJax configuration
- **Deployment:** GitHub Actions → GitHub Pages (gh-pages branch)
- **Advanced Features:**
  - 7 files with Mermaid diagrams
  - LaTeX math support (arithmatex)
  - Grid cards layout (Material-specific)
  - Collapsible sections, tabs, admonitions
  - MagicLink for GitHub issues/mentions

#### Catalog Docs (`catalog/docs`)
- **Pages:** 16 markdown files (~4,138 lines)
- **Theme:** Material for MkDocs (lighter configuration)
- **Features:** Minimal Material features (basic navigation, search)
- **Plugins:** 3 (search, minify, git-revision-date-localized)
- **Extensions:** 15 markdown extensions (focused subset)
- **Custom Code:** CSS with custom color variables
- **Deployment:** No GitHub Actions found (manual or external)
- **Simpler Features:**
  - Mermaid support via superfences
  - Basic admonitions and details
  - Tabbed content
  - Read-only (no edit buttons)

### Key Dependencies
- Python 3.11+
- MkDocs ≥1.5.3
- Material for MkDocs ≥9.5.3
- PyMdown Extensions ≥10.7
- Git revision plugin ≥1.2.2
- Minify plugin ≥0.8.0

### Migration Complexity Factors

**Low Complexity:**
- No custom theme overrides in `/overrides/`
- Minimal custom CSS (6 lines main, 9 lines catalog)
- Minimal custom JavaScript (only MathJax)
- Standard markdown features
- Clear content structure
- Well-organized navigation

**Moderate Complexity:**
- 7 files with Mermaid diagrams (main docs)
- 26 markdown extensions to replicate
- Material-specific features (grid cards, navigation features)
- GitHub Actions CI/CD pipeline
- Git-based revision dates
- Google Analytics integration

**High Complexity:**
- Two separate doc sites to migrate
- Different feature sets per site
- Subdirectory deployment for catalog (`/catalog/`)
- Existing URLs and SEO to preserve

---

## Phase 2: Astro Starlight Research - Complete ✓

### Starlight Capabilities

**What Starlight Offers:**
- [Modern framework](https://starlight.astro.build/) built on Astro (Go-based compiler)
- Zero client-side JavaScript by default (better performance)
- Framework-agnostic component support (React, Vue, Svelte, Solid)
- Built-in components: tabs, cards, badges, file trees, steps
- Markdown, MDX, and Markdoc support
- Dark/light/auto theme modes
- Internationalization support
- SEO optimization and accessibility
- TypeScript-powered frontmatter validation

**What Requires Plugins/Custom Work:**
- **Mermaid diagrams**: [No native support](https://github.com/withastro/starlight/discussions/1259) - requires third-party plugins like [astro-mermaid](https://www.npmjs.com/package/astro-mermaid) or [remark-mermaidjs](https://agramont.net/blog/diagraming-with-mermaidjs-astro/)
- **Math equations**: [No native support](https://github.com/withastro/starlight/issues/721) - requires custom integration (MathJax/KaTeX)
- **Git revision dates**: Not built-in, would need custom implementation
- **Advanced search**: Basic search included, but [advanced features require Algolia DocSearch](https://www.algolia.com/blog/engineering/algolia-docsearch-astro-starlight-part-2) integration

**Migration Tools:**
- [Docusaurus migration guide](https://docs.astro.build/en/guides/migrate-to-astro/from-docusaurus/) exists
- No specific MkDocs migration tool found

---

## Phase 3: Comparison & Analysis

### Feature-by-Feature Comparison

| Feature | Material for MkDocs | Astro Starlight | Migration Impact |
|---------|-------------------|----------------|------------------|
| **Setup Complexity** | Low (Python, pip install) | Moderate (Node.js, npm/pnpm) | 🟡 Different tech stack |
| **Markdown Extensions** | 26 built-in (PyMdown) | Basic + MDX components | 🔴 Significant rework needed |
| **Mermaid Diagrams** | ✅ Built-in | ⚠️ Plugin required | 🟡 7 files affected |
| **Math Equations** | ✅ Built-in (arithmatex) | ❌ Custom integration | 🔴 Would need custom work |
| **Admonitions** | ✅ Native syntax (`!!!`) | ✅ Native Starlight component | 🟢 Good compatibility |
| **Code Highlighting** | ✅ Pygments | ✅ Expressive Code | 🟢 Good compatibility |
| **Search** | ✅ Advanced (built-in) | ⚠️ Basic (Algolia for advanced) | 🟡 Would lose features or need Algolia |
| **Grid Cards** | ✅ Material feature | ✅ Built-in cards | 🟢 Similar functionality |
| **Tabs** | ✅ Built-in | ✅ Built-in | 🟢 Compatible |
| **Git Revision Dates** | ✅ Plugin | ❌ Custom implementation | 🔴 Would lose feature |
| **Navigation Features** | ✅ 28 features | ✅ Basic navigation | 🟡 Would lose advanced features |
| **Dark Mode** | ✅ Built-in | ✅ Built-in | 🟢 Compatible |
| **Performance** | Fast (Python-based) | Faster (Go compiler, zero JS) | 🟢 Performance gain |
| **Customization** | CSS + Template overrides | Components + CSS | 🟡 Different approach |
| **Deployment** | GitHub Pages ready | GitHub Pages compatible | 🟢 Similar |
| **Python Dependency** | ✅ Required | ❌ Node.js instead | 🟡 Stack change |

### Real-World Experience

From [community feedback](https://squidfunk.github.io/mkdocs-material/alternatives/):
- One developer tried Starlight but returned to Material for MkDocs due to:
  - Limited icon set and inline icon issues
  - Odd spacing gaps when using MDX
  - Too many brackets/braces in configuration
  - Eventually preferred Material after gaining experience

From [performance comparisons](https://blog.logrocket.com/starlight-vs-docusaurus-building-documentation/):
- Starlight's Go-based compiler is significantly faster than JavaScript-based tools
- Development server starts in less than half the time

---

## Migration Complexity Assessment

### Low Effort (Straightforward)
✅ Basic Markdown content (29 + 16 files)
✅ Navigation structure
✅ Dark/light mode themes
✅ Tabs and basic components
✅ Code blocks with syntax highlighting
✅ Admonitions (different syntax but similar concept)
✅ Deployment to GitHub Pages

### Moderate Effort (Additional Work Required)
🟡 **Mermaid diagrams (7 files)**: Install and configure [astro-mermaid](https://www.npmjs.com/package/astro-mermaid) plugin
🟡 **Advanced search**: Implement Algolia DocSearch or accept basic search
🟡 **Navigation features**: Recreate Material-specific navigation (tabs, instant loading, tracking)
🟡 **Markdown extensions**: Convert PyMdown syntax to MDX components where needed
🟡 **CI/CD pipeline**: Rewrite GitHub Actions for Astro build process
🟡 **Two separate sites**: Maintain catalog as subdirectory deployment

### High Effort (Significant Custom Development)
🔴 **Math equations**: No built-in support - custom MathJax/KaTeX integration required (affects MathJax.js config)
🔴 **Git revision dates**: No plugin exists - would need custom implementation or lose feature
🔴 **26 markdown extensions**: Many PyMdown-specific features would need recreation
🔴 **Material grid cards**: Different syntax, all instances need updating
🔴 **MagicLink**: GitHub issue/PR shorthand not available
🔴 **Testing**: All content needs visual review to ensure proper rendering

### Blockers & Risks
⚠️ **Stack change**: Python → Node.js affects local dev setup and CI/CD
⚠️ **Learning curve**: Team needs to learn Astro/MDX/component architecture
⚠️ **Feature loss**: Git dates, advanced search, some Material features would be lost
⚠️ **Content rework**: 45 total files need review and potential syntax updates
⚠️ **URL preservation**: Careful routing needed to maintain SEO and existing links
⚠️ **Two-site complexity**: Catalog subdirectory deployment needs special configuration

---

## What You'd Gain

### Performance Benefits
- ⚡ **Faster builds**: Go compiler vs Python
- ⚡ **Zero JS by default**: Better page load times
- ⚡ **Modern framework**: Better caching and optimization

### Developer Experience
- 🎨 **Component flexibility**: React/Vue/Svelte if needed
- 🎯 **TypeScript support**: Type-safe frontmatter
- 🔧 **Modern tooling**: NPM ecosystem and Astro integrations
- 📦 **MDX support**: More powerful content authoring

### Future-Proofing
- 🚀 **Active development**: Astro is gaining momentum
- 🌐 **Framework-agnostic**: Not locked into Python ecosystem
- 🔌 **Plugin ecosystem**: Growing Astro integration library

## What You'd Lose

### Out-of-the-Box Features
- 📅 **Git revision dates**: No plugin available
- 🔍 **Advanced search**: Would need Algolia or custom solution
- 🎨 **28 Material features**: Many navigation enhancements
- 🔢 **Math support**: Requires custom integration
- 🔗 **MagicLink**: GitHub shorthand not available

### Convenience
- 🐍 **Python ecosystem**: Familiar if team uses Python
- 📝 **PyMdown extensions**: Rich markdown features built-in
- ⚙️ **Established workflows**: Current CI/CD is working
- 📚 **Community knowledge**: Material for MkDocs has mature ecosystem

---

## Estimated Migration Effort

**Time Investment:**
- Content migration: 2-3 weeks
- Theme/styling customization: 1-2 weeks
- Plugin setup (Mermaid, search): 1 week
- Math equation integration: 1-2 weeks
- CI/CD pipeline: 3-5 days
- Testing and QA: 1-2 weeks
- **Total: 6-10 weeks** for complete migration

**Team Requirements:**
- Frontend developer with React/Astro experience
- Technical writer for content review
- DevOps for CI/CD updates

**Cost-Benefit Analysis:**
- **High cost**: 6-10 weeks of work, potential feature loss
- **Moderate benefit**: Performance gains, modern stack
- **Risk**: Learning curve, potential content issues

---

## Phase 4: Recommendation

### Should You Migrate?

**❌ Recommendation: STAY WITH MATERIAL FOR MKDOCS**

### Reasoning

1. **Current Setup is Excellent**
   - Material for MkDocs is well-suited for your needs
   - All features you use are built-in and working
   - Minimal customization needed (clean codebase)
   - Well-established deployment pipeline

2. **Migration Provides Minimal Value**
   - Performance gains would be marginal for documentation sites
   - Zero-JS benefit is negligible (docs don't have heavy JS)
   - Most Starlight benefits don't apply to static docs

3. **High Migration Cost**
   - 6-10 weeks of work for uncertain benefits
   - Would lose Git revision dates (no replacement)
   - Math equations require custom work
   - 7 Mermaid files need plugin configuration
   - All 45 markdown files need review

4. **Feature Parity Issues**
   - Material has 28 navigation features vs Starlight's basic nav
   - Advanced search is built-in vs requiring Algolia
   - PyMdown extensions are richer than Starlight's built-ins
   - MagicLink for GitHub issues has no equivalent

5. **Community Feedback**
   - [Real users](https://squidfunk.github.io/mkdocs-material/alternatives/) tried Starlight and returned to Material
   - Material for MkDocs has mature ecosystem and extensive documentation
   - Starlight is still evolving (v0.37 as of 2026)

### When Would Migration Make Sense?

Consider Astro Starlight if:
- 🔄 **You need component frameworks**: Integrating React/Vue components for interactive demos
- 🎨 **Custom UI requirements**: Building a branded experience beyond docs
- 🚀 **Part of larger Astro ecosystem**: Already using Astro for other projects
- 💻 **Team is JS-focused**: Python is friction for your workflow
- 🔧 **Need advanced customization**: Component-level control is essential

None of these apply to your current documentation needs.

---

## Alternative: Improve Current Setup

Instead of migrating, consider these optimizations:

### Quick Wins (1-2 days)
1. **Consolidate assets**: Use symlinks to share logos between main and catalog docs
2. **Add GitHub Actions for catalog**: Automate catalog doc deployments
3. **Extract shared config**: Create base mkdocs.yml to DRY up configuration
4. **Optimize images**: Compress logo/favicon for faster loading

### Medium Improvements (1 week)
5. **Enhance catalog features**: Add more Material features to catalog docs for consistency
6. **Improve search**: Configure search plugin with better separators for catalog
7. **Add versioning**: Consider [mike](https://github.com/jimporter/mike) for versioned docs
8. **Performance audit**: Minification is enabled, but could optimize further

### Future-Proofing (2-3 weeks)
9. **Document structure**: Create developer guide for maintaining both doc sites
10. **Content templates**: Standardize workload documentation format
11. **CI/CD documentation**: Document deployment process
12. **Accessibility audit**: Ensure WCAG compliance across all pages

**Total effort: 3-4 weeks** vs 6-10 weeks for migration, with tangible improvements and zero risk.

---

## Sources

- [Starlight Documentation](https://starlight.astro.build/)
- [Mermaid Support Discussion](https://github.com/withastro/starlight/discussions/1259)
- [Math Equations Issue](https://github.com/withastro/starlight/issues/721)
- [Material for MkDocs Alternatives](https://squidfunk.github.io/mkdocs-material/alternatives/)
- [Starlight vs Docusaurus Comparison](https://blog.logrocket.com/starlight-vs-docusaurus-building-documentation/)
- [Algolia DocSearch + Starlight](https://www.algolia.com/blog/engineering/algolia-docsearch-astro-starlight-part-2)
- [Astro Mermaid Integration](https://www.npmjs.com/package/astro-mermaid)

---

**Document Date:** 2026-02-10
**Recommendation:** Stay with Material for MkDocs and implement incremental improvements instead.
