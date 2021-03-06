#!/usr/bin/env node
import { format as formatUrl, parse as parseUrl } from 'url';
import defaultsDeep from 'lodash.defaultsdeep';
import jsonFile from 'packagesmith.formats.json';
import repositoryQuestion from 'packagesmith.questions.repository';
import runProvisionerSet from 'packagesmith';
import sortPackageJson from 'sort-package-json';
import { sortRange as sortSemverRanges } from 'semver-addons';
import { devDependencies as versions } from '../package.json';
function convertSshToProtocolUrl(url) {
  let parsed = parseUrl(String(url));
  if (parsed.protocol === null) {
    parsed = parseUrl(`git+ssh://${ String(url) }`);
    if (/^\/:/.test(parsed.pathname)) {
      parsed.pathname = parsed.pathname.replace(/^\/:/, '/');
    }
  }
  return formatUrl(parsed);
}

export function provisionNpmSemanticRelease() {
  return {
    'package.json': {
      after: 'npm install',
      questions: [ repositoryQuestion() ],
      contents: jsonFile((packageJson, { repository }) => {
        if (typeof packageJson.repository === 'string') {
          delete packageJson.repository; // eslint-disable-line prefer-reflect
        }
        packageJson.devDependencies = packageJson.devDependencies || {};
        return sortPackageJson(defaultsDeep({
          version: '0.0.0-development',
          repository: {
            type: 'git',
            url: convertSshToProtocolUrl(repository),
          },
          config: {
            ghooks: {
              'commit-msg': 'validate-commit-msg',
            },
          },
          scripts: {
            'semantic-release': 'semantic-release pre && npm publish && semantic-release post',
          },
          devDependencies: {
            'ghooks': sortSemverRanges(
              versions.ghooks,
              packageJson.devDependencies.ghooks || '0.0.0'
            ).pop(),
            'semantic-release': sortSemverRanges(
              versions['semantic-release'],
              packageJson.devDependencies['semantic-release'] || '0.0.0'
            ).pop(),
            'validate-commit-msg': sortSemverRanges(
              versions['validate-commit-msg'],
              packageJson.devDependencies['validate-commit-msg'] || '0.0.0'
            ).pop(),
          },
        }, packageJson));
      }),
    },
  };
}
export default provisionNpmSemanticRelease;

if (require.main === module) {
  const directoryArgPosition = 2;
  runProvisionerSet(process.argv[directoryArgPosition] || '.', provisionNpmSemanticRelease());
}
