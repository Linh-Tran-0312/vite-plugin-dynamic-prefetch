import { Plugin, ResolvedConfig } from 'vite';
import MagicString from 'magic-string';
import {
  PREFETCH_LINK_MARK,
  getActualLink,
  getPreversedTransformation,
  createIsPrefetchLinkInHead,
  createPrefetchLinkElement,
} from './utils';

export default function vitePluginDynamicPrefetch(): Plugin<any> {
  const fileNameByImport: Map<string, string> = new Map();
  let config: ResolvedConfig;
  let sourceMapEnabled = false;
  return {
    name: 'vite-plugin-dynamic-prefetch',
    apply: 'build',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
      sourceMapEnabled = Boolean(resolvedConfig.build.sourcemap);
    },
    async transform(code, id) {
      const prefetchImportRE =
        /import\(\s*\/\*\s*vitePrefetch:\s*true\s*\*\/\s*['"]([^'"]+?)['"]\s*\)/g;

      const matches = [...code.matchAll(prefetchImportRE)];
      if (matches.length) {
        const dynamicImports: string[] = [];
        for (const match of matches) {
          const resolvedDynamicImport = await this.resolve(match[1], id);
          if (resolvedDynamicImport) {
            dynamicImports.push(resolvedDynamicImport.id);
          }
        }
        let script = '';
        dynamicImports.forEach((l) => {
          script += createPrefetchLinkElement(l);
        });
        const ms = new MagicString(code);
        ms.prepend(script);

        return {
          code: ms.toString(),
          map: sourceMapEnabled
            ? ms.generateMap({
                file: id,
                includeContent: true,
                hires: true,
              })
            : null,
        };
      }

      return getPreversedTransformation(sourceMapEnabled, code);
    },
    renderChunk(code, chunk) {
      if (chunk.type === 'chunk' && chunk.isEntry) {
        const ms = new MagicString(code);
        ms.prepend(createIsPrefetchLinkInHead());

        return {
          code: ms.toString(),
          map: sourceMapEnabled
            ? ms.generateMap({
                file: chunk.fileName,
                includeContent: true,
                hires: true,
              })
            : null,
        };
      }

      return getPreversedTransformation(sourceMapEnabled, code);
    },
    async generateBundle(_options, bundle) {
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk' && chunk.facadeModuleId) {
          fileNameByImport.set(chunk.facadeModuleId, fileName);
        }
      }

      for (const fileName in bundle) {
        const chunk = bundle[fileName];

        if (chunk.type === 'chunk' && chunk.code.includes(PREFETCH_LINK_MARK)) {
          const placeholderRE = new RegExp(
            `${PREFETCH_LINK_MARK}(\/[^"|']+\.(?:js|jsx|ts|tsx))(?![^"|'])`,
            'g'
          );

          const matches = [...chunk.code.matchAll(placeholderRE)];

          const ms = new MagicString(chunk.code);

          for (const match of matches) {
            const moduleId: string = match[1];
            const actualLink = getActualLink(
              config.base,
              moduleId,
              fileNameByImport
            );
            ms.replaceAll(`${PREFETCH_LINK_MARK}${moduleId}`, actualLink);
          }

          chunk.code = ms.toString();
          if (sourceMapEnabled && chunk.map) {
            const map = ms.generateMap({
              source: fileName,
              hires: true,
              includeContent: true,
            });

            if (chunk.map)
              chunk.map = {
                ...chunk.map,
                sourcesContent: map.sourcesContent,
                mappings: map.mappings,
              };
          }
        }
      }
    },
  };
}
