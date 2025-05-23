export const prompts = {
  codingStyle: {
    fumadocsComponents: `
## Available Fumadocs Components

This documentation uses Fumadocs UI components to enhance readability and interactivity. Here's how to use them:

### Layout Components

#### Tabs and Tab
Create tabbed interfaces for toggling between related content:

\`\`\`jsx
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';

<Tabs items={['JavaScript', 'TypeScript', 'Python']}>
  <Tab value="JavaScript">JavaScript content here</Tab>
  <Tab value="TypeScript">TypeScript content here</Tab>
  <Tab value="Python">Python content here</Tab>
</Tabs>
\`\`\`

Options:
- \`groupId\`: Share tab state across multiple tab components
- \`persist\`: Save selected tab in localStorage
- \`defaultIndex\`: Set initial active tab
- \`updateAnchor\`: Update URL hash when changing tabs

#### Steps and Step
Create step-by-step guides:

\`\`\`jsx
import { Steps, Step } from 'fumadocs-ui/components/steps';

<Steps>
  <Step>First step content</Step>
  <Step>Second step content</Step>
  <Step>Final step content</Step>
</Steps>
\`\`\`

#### Accordion
Create collapsible sections:

\`\`\`jsx
import { Accordions, Accordion } from 'fumadocs-ui/components/accordion';

<Accordions>
  <Accordion title="Section 1" value="item-1">
    Content for section 1
  </Accordion>
  <Accordion title="Section 2" value="item-2">
    Content for section 2
  </Accordion>
</Accordions>
\`\`\`

IMPORTANT: Always use this pattern with an outer \`<Accordions>\` wrapper and individual \`<Accordion>\` components inside. DO NOT use the pattern with \`items\` prop as it will cause the error: "AccordionItem must be used within Accordion".

INCORRECT pattern (DO NOT USE):
\`\`\`jsx
<Accordion items={[
  {
    value: 'item-1',
    title: 'Section 1',
    content: 'Content for section 1'
  }
]} />
\`\`\`

#### Files, File, Folder
Display file structures:

\`\`\`jsx
import { Files, File, Folder } from 'fumadocs-ui/components/files';

<Files>
  <Folder name="app" defaultOpen>
    <File name="layout.tsx" />
    <File name="page.tsx" />
    <File name="global.css" />
  </Folder>
  <Folder name="components">
    <File name="button.tsx" />
  </Folder>
  <File name="package.json" />
</Files>
\`\`\`

#### InlineTOC
Add table of contents within the page:

\`\`\`jsx
import { InlineTOC } from 'fumadocs-ui/components/inline-toc';

<InlineTOC items={toc} />
\`\`\`

### Visual Elements

#### Callout
Highlight important information:

\`\`\`jsx
<Callout type="info">
  This is an informational callout.
</Callout>

<Callout type="warn">
  This is a warning callout.
</Callout>

<Callout type="error">
  This is an error callout.
</Callout>
\`\`\`

#### TypeTable
Document types:

\`\`\`jsx
import { TypeTable } from 'fumadocs-ui/components/type-table';

<TypeTable
  type={{
    percentage: {
      description: 'The percentage of scroll position',
      type: 'number',
      default: '0.2',
    },
    enabled: {
      description: 'Whether the feature is enabled',
      type: 'boolean',
      default: 'true',
    }
  }}
/>
\`\`\`

#### DynamicCodeBlock
Code blocks with syntax highlighting:

\`\`\`jsx
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

<DynamicCodeBlock 
  lang="typescript" 
  code="console.log('Hello world');" 
/>
\`\`\`

#### GithubInfo
Display GitHub repository information:

\`\`\`jsx
import { GithubInfo } from 'fumadocs-ui/components/github-info';

<GithubInfo
  owner="organization"
  repo="repository"
  token={process.env.GITHUB_TOKEN} // optional
/>
\`\`\`

#### ImageZoom
Allow images to be zoomed:

\`\`\`jsx
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';

<ImageZoom>
  <img src="/path/to/image.png" alt="Description" />
</ImageZoom>
\`\`\`
    `,
  },

  instructions: {
    enhanceUpdates: `
When enhancing update files, follow these guidelines:

1. Maintain a clear and consistent structure
2. Use appropriate Fumadocs components for better presentation
3. Include code examples where relevant
4. Add explanatory notes for complex changes
5. Keep the tone professional and technical
6. Ensure all links and references are valid
7. Use proper markdown formatting
    `,

    rules: `
Rules:
1. Keep all technical information intact
2. Use professional but conversational tone
3. Organize content logically
4. Break down complex changes into clear explanations
5. Maintain all MDX code components and syntax
6. Use proper Markdown formatting including headings, lists, and code blocks
7. IMPORTANT: Only use the MDX components listed above that are available in the project
8. DO NOT use components like <APIEndpoints>, <ServiceOperations>, <DynamicCodeBlock>, or any other component not listed above - this will cause a build failure!
9. Keep information about breaking changes prominent
10. Do not add fictional or assumed information
11. Preserve all links and references
12. Format code examples properly
13. IMPORTANT: Remove any automatically generated warnings like "This page contains automatically generated documentation based on Git activity..."
14. IMPORTANT: For code blocks containing JSON, XML, or other content with syntax like "/" or "<", ensure proper escaping or use appropriate code fence formatting to prevent MDX parsing errors
15. Be especially careful with JSON in code blocks when the content has property names or values containing slash characters
16. ALWAYS use standard markdown code blocks with triple backticks (\`\`\`) for code examples, NOT custom components like <DynamicCodeBlock>
    `,

    serviceSpecific: `
Last conclusion: being professional does not stop you from being humurous. From time to time, when appropriate, you can make a joke about a fish (meeting baas == meeting bass) or bass the API or whatever ;) 🐟. Emoji is: 🐟🐟🐟. If you have something light-hearted to say, put it on beginning of page. 

IMPORT NOTE: FOR ANY UPDATES TO services: $API OR $PRODUCTION what matters is:
A. Not the code, but impact on the users of API
B. For now, **absolute** confidentiality on code itself, authors of commits, etc. THIS INCLUDES FILE NAMES AND AUTHORS.
IMPORTANT NOTE: FOR $API FILES which do not change the openapi.json OR any external facing documentation, etc then change to to PRODUCTION service from this data structure in title:
    {
        name: 'API',
        icon: 'Webhook',
        serviceKey: 'api',
        description: 'API changes and improvements',
        href: '/docs/updates#api-updates',
        additionalTags: ['api-reference'],
    }
to:
    {
        name: 'Production Updates',
        icon: 'Zap',
        serviceKey: 'production',
        description: 'API Internal Updates and Improvements',
        href: '/docs/updates#production-updates',
        additionalTags: ['production', 'release'],
    }

Code Note: ALWAYS ADD EMPTY LINE SPACING FOR LISTS ITEMS, ITEMS INSIDE TABS, etc.

ALWAYS PUT <Accordion> inside <Accordions>, etc

USE THE FUMADOCS COMPONENTS AS MUCH AS POSSIBLE to hance readability. YOU CAN REFACTORIZE CONTENT AS MUCH AS YOU WANT and keep it SHORT.
    `,
  },

  templates: {
    updateHeader: `
---
title: "{title}"
date: "{date}"
description: "{description}"
---

# {title}

{description}
    `,

    updateFooter: `
---
Last updated: {date}
    `,
  },

  formatting: {
    codeBlock: `
\`\`\`{language}
{code}
\`\`\`
    `,

    table: `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
    `,
  },

  metadata: {
    updateTypes: [
      "feature",
      "bugfix",
      "improvement",
      "breaking-change",
      "deprecation",
      "security",
      "performance",
      "documentation"
    ],

    services: [
      "api",
      "speaking-bots",
      "sdk-generator",
      "mcp-servers",
      "mcp-docs",
      "mcp-baas"
    ],
  },

  validation: {
    requiredFields: [
      "title",
      "date",
      "description",
      "type",
      "service"
    ],

    dateFormat: "YYYY-MM-DD",
  },
} as const;

// Type definitions for the prompts
export type PromptCategory = keyof typeof prompts;
export type CodingStylePrompt = keyof typeof prompts.codingStyle;
export type InstructionsPrompt = keyof typeof prompts.instructions;
export type TemplatesPrompt = keyof typeof prompts.templates;
export type FormattingPrompt = keyof typeof prompts.formatting;
export type MetadataPrompt = keyof typeof prompts.metadata;
export type ValidationPrompt = keyof typeof prompts.validation;

// Helper function to get a prompt by category and key
export function getPrompt<T extends PromptCategory>(
  category: T,
  key: keyof typeof prompts[T]
): string {
  return prompts[category][key] as string;
}

// Helper function to get all prompts for a category
export function getCategoryPrompts<T extends PromptCategory>(
  category: T
): Record<keyof typeof prompts[T], string> {
  return prompts[category] as Record<keyof typeof prompts[T], string>;
} 