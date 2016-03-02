import chai from 'chai';
chai.should();
import provisionNpmSemanticRelease from '../src/';
import repositoryQuestion from 'packagesmith.questions.repository';
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
          repository: {
            type: 'git',
            url: 'git+ssh://foobar.git/baz',
          },
          devDependencies: {
            'ghooks': '^1.0.1',
            'semantic-release': '^4.3.5',
            'validate-commit-msg': '^2.0.0',
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
