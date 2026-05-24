export interface Agent {
  id: string
  name: string
  model: string
  description: string
  tagline: string
  icon: string
  placeholder: string
  color: string
}

export const agents: Agent[] = [
  {
    id: 'docs',
    name: 'Docs Writer',
    model: 'techwriter-docs',
    description: 'API references, developer guides, and technical documentation',
    tagline: 'API refs & guides',
    icon: '📄',
    placeholder: 'Describe the API endpoint, feature, or guide you need documented. Include the product name, what it does, and any parameters or steps...',
    color: '#3b82f6',
  },
  {
    id: 'ux',
    name: 'UX Writer',
    model: 'techwriter-ux',
    description: 'Tooltips, error messages, empty states, and UI microcopy',
    tagline: 'Tooltips & microcopy',
    icon: '✏️',
    placeholder: 'Describe the UI element or user flow. Example: "Error message for when a user tries to delete a project that has active team members..."',
    color: '#8b5cf6',
  },
  {
    id: 'web',
    name: 'Web Copy',
    model: 'techwriter-web',
    description: 'Landing pages, feature pages, pricing copy, and homepage sections',
    tagline: 'Landing page copy',
    icon: '🌐',
    placeholder: 'Describe the product, target audience, and the page or section you need. Example: "Homepage hero for a CI/CD tool aimed at solo developers..."',
    color: '#10b981',
  },
  {
    id: 'blog',
    name: 'Blog Writer',
    model: 'techwriter-blog',
    description: 'Blog posts, tutorials, SEO content, and comparison articles',
    tagline: 'Posts & tutorials',
    icon: '📝',
    placeholder: 'Describe the blog post. Include the type (tutorial, comparison, opinion), target audience, primary keyword, and what the reader should take away...',
    color: '#f59e0b',
  },
  {
    id: 'humanizer',
    name: 'Humanizer',
    model: 'techwriter-humanizer',
    description: 'Paste AI-generated content to rewrite it in a natural human voice',
    tagline: 'Remove AI patterns',
    icon: '🔄',
    placeholder: 'Paste the AI-generated text you want rewritten. The humanizer preserves all facts and structure but strips out robotic phrasing, banned phrases, and uniform sentence rhythm...',
    color: '#f43f5e',
  },
]
