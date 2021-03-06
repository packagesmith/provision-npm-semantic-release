import chai from 'chai';
chai.should();
import provisionNpmSemanticRelease from '../src/';
import repositoryQuestion from 'packagesmith.questions.repository';
import { devDependencies as versions } from '../package.json';
describe('provisionNpmSemanticRelease', () => {

  it('is a function', () => {
    provisionNpmSemanticRelease.should.be.a('function');
  });

  it('returns an object with `package.json`.`contents` function', () => {
    provisionNpmSemanticRelease()
      .should.be.an('object')
      .with.keys([ 'package.json' ])
      .with.property('package.json')
        .with.keys([ 'questions', 'contents', 'after' ])
        .with.property('contents')
          .that.is.a('function');
  });

  it('has a repository question in `package.json`.`questions`', () => {
    provisionNpmSemanticRelease()
      .should.have.property('package.json')
        .that.has.property('questions')
          .that.has.lengthOf(1);
    provisionNpmSemanticRelease()['package.json'].questions[0].name
      .should.equal('repository');
    provisionNpmSemanticRelease()['package.json'].questions[0].when.toString()
      .should.equal(repositoryQuestion().when.toString());
  });


  describe('contents function', () => {
    let subFunction = null;
    beforeEach(() => {
      subFunction = provisionNpmSemanticRelease()['package.json'].contents;
    });

    it('adds requesite dependencies and ghooks config to json', () => {
      JSON.parse(subFunction('{}', { repository: 'foobar.git/baz' }))
        .should.deep.equal({
          version: '0.0.0-development',
          repository: {
            type: 'git',
            url: 'git+ssh://foobar.git/baz',
          },
          devDependencies: {
            'ghooks': versions.ghooks || 'NO VERSION',
            'semantic-release': versions['semantic-release'] || 'NO VERSION',
            'validate-commit-msg': versions['validate-commit-msg'] || 'NO VERSION',
          },
          config: {
            ghooks: {
              'commit-msg': 'validate-commit-msg',
            },
          },
          scripts: {
            'semantic-release': 'semantic-release pre && npm publish && semantic-release post',
          },
        });
    });

    it('overwrites already existing older versions of dependencies', () => {
      const packageJson = JSON.stringify({
        devDependencies: {
          'semantic-release': '^1.0.0',
          'ghooks': '^1.0.0',
          'validate-commit-msg': '^1.0.0',
        },
      });
      const output = JSON.parse(subFunction(packageJson, { repository: 'foobar.git/baz' }));
      output.should.have.deep.property('devDependencies.semantic-release',
        versions['semantic-release'] || 'NO VERSION');
      output.should.have.deep.property('devDependencies.ghooks',
        versions.ghooks || 'NO VERSION');
      output.should.have.deep.property('devDependencies.validate-commit-msg',
        versions['validate-commit-msg'] || 'NO VERSION');
    });

    it('does not overwrite already existing newer versions of eslint', () => {
      const packageJson = JSON.stringify({
        devDependencies: {
          'semantic-release': '^999.999.991',
          'ghooks': '^999.999.992',
          'validate-commit-msg': '^999.999.993',
        },
      });
      const output = JSON.parse(subFunction(packageJson, { repository: 'foobar.git/baz' }));
      output.should.have.deep.property('devDependencies.semantic-release', '^999.999.991');
      output.should.have.deep.property('devDependencies.ghooks', '^999.999.992');
      output.should.have.deep.property('devDependencies.validate-commit-msg', '^999.999.993');
    });

    it('converts git implicit ssh urls to specific git urls', () => {
      JSON.parse(subFunction('{}', { repository: 'git@foobar.com/baz.git' }))
        .repository.url.should.equal('git+ssh://git@foobar.com/baz.git');
    });

    it('converts git implicit ssh urls with colons to specific git urls', () => {
      JSON.parse(subFunction('{}', { repository: 'git@foobar.com:baz.git' }))
        .repository.url.should.equal('git+ssh://git@foobar.com/baz.git');
    });

    it('retains protocol for explicit urls', () => {
      JSON.parse(subFunction('{}', { repository: 'http://git@foobar.com/baz.git' }))
        .repository.url.should.equal('http://git@foobar.com/baz.git');
      JSON.parse(subFunction('{}', { repository: 'git://git@foobar.com/baz.git' }))
        .repository.url.should.equal('git://git@foobar.com/baz.git');
      JSON.parse(subFunction('{}', { repository: 'gopher://git@foobar.com/baz.git' }))
        .repository.url.should.equal('gopher://git@foobar.com/baz.git');
    });

  });

});
