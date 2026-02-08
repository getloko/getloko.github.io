// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import starlightLinksValidator from 'starlight-links-validator';
import starlightImageZoom from 'starlight-image-zoom';
import starlightThemeGalaxy from 'starlight-theme-galaxy';

// https://astro.build/config
export default defineConfig({
	site: 'https://getloko.github.io/',
	integrations: [
		mermaid(),
		starlight({
			title: 'LoKO Documentation',
			description: 'Local Kubernetes Oasis (LoKO) - Simplified local Kubernetes development environments with Kind, DNS, certificates, registry, and workload management.',
			logo: {
				src: './src/assets/loko-logo.png',
			},
			favicon: '/favicon.ico',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/getloko/loko' },
			],
			components: {
				Head: './src/components/Head.astro',
			},
			plugins: [
				starlightThemeGalaxy(),
				starlightLinksValidator({
					errorOnRelativeLinks: false,
				}),
				starlightImageZoom(),
			],
			customCss: [
				'./src/styles/custom.css',
			],
			sidebar: [
				{
					label: 'Getting Started',
					// Not collapsed - users start here
					items: [
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
						{ label: 'Prerequisites', slug: 'getting-started/prerequisites' },
					],
				},
				{
					label: 'How It Works',
					collapsed: true,
					items: [
						{ label: 'Architecture', slug: 'architecture' },
					],
				},
				{
					label: 'Comparisons',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: 'comparisons' },
					],
				},
				{
					label: 'User Guide',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: 'user-guide' },
						{ label: 'Configuration', slug: 'user-guide/configuration' },
						{ label: 'Environment Lifecycle', slug: 'user-guide/environment-lifecycle' },
						{ label: 'Workload Management', slug: 'user-guide/workload-management' },
						{ label: 'Network & DNS', slug: 'user-guide/network-dns' },
						{ label: 'Certificates', slug: 'user-guide/certificates' },
						{ label: 'Registry', slug: 'user-guide/registry' },
						{ label: 'Tunnel Sharing', slug: 'user-guide/tunnel' },
						{ label: 'GitOps', slug: 'user-guide/gitops' },
						{ label: 'GitOps: Gitless Mode', slug: 'user-guide/gitops-gitless' },
						{ label: 'Shell Completions', slug: 'user-guide/shell-completions' },
						{ label: 'Companion Tools', slug: 'user-guide/companion-tools' },
						{ label: 'Advanced Configuration', slug: 'user-guide/advanced-configuration' },
						{ label: 'CLI Reference', slug: 'user-guide/cli-reference' },
					],
				},
				{
					label: 'Catalog',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: '_catalog' },
						{ label: 'System', slug: '_catalog/system' },
						{ label: 'Remote Sync', slug: '_catalog/remote-sync' },
						{ label: 'Components', slug: '_catalog/components' },
						{ label: 'Repositories', slug: '_catalog/repositories' },
						{
							label: 'Workloads',
							collapsed: true,
							items: [
								{ label: 'Overview', slug: '_catalog/workloads' },
								{ label: 'Databases', slug: '_catalog/workloads/databases' },
								{ label: 'Cache & KV', slug: '_catalog/workloads/cache' },
								{ label: 'Message Queues', slug: '_catalog/workloads/messaging' },
								{ label: 'Object Storage', slug: '_catalog/workloads/storage' },
								{ label: 'DevOps & CI/CD', slug: '_catalog/workloads/devops' },
								{ label: 'Dev & Testing Tools', slug: '_catalog/workloads/devtools' },
								{ label: 'GitOps', slug: '_catalog/workloads/gitops' },
								{ label: 'Collaboration', slug: '_catalog/workloads/collaboration' },
								{ label: 'User Workloads', slug: '_catalog/workloads/user-workloads' },
							],
						},
						{
							label: 'Contributing',
							collapsed: true,
							items: [
								{ label: 'Guidelines', slug: '_catalog/contributing' },
								{ label: 'Schema', slug: '_catalog/schema' },
								{ label: 'Testing', slug: '_catalog/testing' },
							],
						},
					],
				},
				{
					label: 'Examples',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: '_examples' },
						{ label: 'Config Examples', slug: '_examples/configs' },
						{ label: 'Project Templates', slug: '_examples/templates' },
					],
				},
				{
					label: 'Tutorials',
					collapsed: true,
					items: [
						{ label: 'First Cluster', slug: 'tutorials/first-cluster' },
						{ label: 'Deploy Database', slug: 'tutorials/deploy-database' },
						{ label: 'Custom Workload', slug: 'tutorials/custom-workload' },
						{ label: 'Multi-Node Setup', slug: 'tutorials/multi-node-setup' },
						{ label: 'GitOps Setup', slug: 'tutorials/gitops-setup' },
					],
				},
				{
					label: 'Reference',
					collapsed: true,
					items: [
						{ label: 'Commands', slug: 'reference/commands' },
						{ label: 'Configuration Schema', slug: 'reference/config-schema' },
						{ label: 'Troubleshooting', slug: 'reference/troubleshooting' },
						{ label: 'FAQ', slug: 'reference/faq' },
					],
				},
			],
		}),
	],
});
