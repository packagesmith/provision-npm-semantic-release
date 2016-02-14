#!/usr/bin/env node
import { format as formatUrl, parse as parseUrl } from 'url';
import defaultsDeep from 'lodash.defaultsdeep';
import jsonFile from 'packagesmith.formats.json';
import repositoryQuestion from 'packagesmith.questions.repository';
import runProvisionerSet from 'packagesmith';
import sortPackageJson from 'sort-package-json';
function convertSshToProtocolUrl(url) {
  let parsed = parseUrl(String(url));
  if (parsed.protocol === null) {
    parsed = parseUrl(`git+ssh://${ String(url) }`);
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
        return sortPackageJson(defaultsDeep({
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
            'ghooks': '^1.0.1',
            'semantic-release': '^4.3.5',
            'validate-commit-msg': '^2.0.0',
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
