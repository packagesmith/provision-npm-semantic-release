#!/usr/bin/env node
import defaultsDeep from 'lodash.defaultsdeep';
import jsonFile from 'packagesmith.formats.json';
import repositoryQuestion from 'packagesmith.questions.repository';
import runProvisionerSet from 'packagesmith';
import sortPackageJson from 'sort-package-json';
const sshUrlRegExp = /^((?:[^\@]+)@)?([a-zA-Z0-9\.]+):(.+)$/;
function convertSshToProtocolUrl(url) {
  const [ fullUrl, username, domain, path ] = String(url).match(sshUrlRegExp) || [];
  if (fullUrl && domain && path) {
    return `git+ssh://${ username || '' }${ domain }/${ path }`;
  }
  return url;
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
