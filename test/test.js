'use strict';
/* globals describe, it */
var ssg = require('../');
var expect = require('chai').expect;
var should = require('should');
var fs = require('fs');
var path = require('path');
var File = require('gulp-util').File;
var Buffer = require('buffer').Buffer;

function getMarkdownFile(path, content) {
    return new File({
        cwd: '',
        base: 'test/',
        path: path,
        contents: new Buffer(content)
    });
}

describe('gulp-ssg()', function() {

    describe('in buffer mode', function() {

        /*it('should rename indexes to path/index.html', function(done) {
            var stream = ssg({});
            var file = getMarkdownFile('test/index.md', 'test');

            stream.on('end', function() {
                var newFilePath = path.resolve(file.path);
                var expectedFilePath = path.resolve('test/index.html');
                newFilePath.should.equal(expectedFilePath);
                file.relative.should.equal('index.html');
                Buffer.isBuffer(file.contents).should.equal(true);
                done();
            });

            stream.write(file);
            stream.end();
        });*/

        /*it('should rename non-indexes to path/basename/index.html', function(done) {
            var stream = ssg({});
            var file = getMarkdownFile('test/hello.md', 'test');

            stream.on('end', function() {
                var newFilePath = path.resolve(file.path);
                var expectedFilePath = path.resolve('test/hello/index.html');
                newFilePath.should.equal(expectedFilePath);
                file.relative.should.equal(path.normalize('hello/index.html'));
                Buffer.isBuffer(file.contents).should.equal(true);
                done();
            });

            stream.write(file);
            stream.end();
        });*/

        /*it('should assign booleans for isHome and isIndex', function(done) {
            var website = {};
            var stream = ssg(website);
            var home = getMarkdownFile('test/index.md', 'home');
            var page = getMarkdownFile('test/hello.md', 'page');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'index');
            var sectionPage = getMarkdownFile('test/foo/bar.md', 'section page');

            stream.on('end', function() {
                expect(home.data.isHome).to.be.true;
                expect(home.data.isIndex).to.be.true;
                expect(page.data.isHome).to.be.false;
                expect(page.data.isIndex).to.be.false;
                expect(sectionIndex.data.isHome).to.be.false;
                expect(sectionIndex.data.isIndex).to.be.true;
                expect(sectionPage.data.isHome).to.be.false;
                expect(sectionPage.data.isIndex).to.be.false;
                done();
            });

            stream.write(home);
            stream.write(page);
            stream.write(sectionIndex);
            stream.write(sectionPage);
            stream.end();
        });*/

        /*it('should assign a name unique within the section', function(done) {
            var website = {};
            var stream = ssg(website);
            var home = getMarkdownFile('test/index.md', 'home');
            var page = getMarkdownFile('test/hello.md', 'page');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'index');
            var sectionPage = getMarkdownFile('test/foo/bar.md', 'section page');

            stream.on('end', function() {
                expect(home.data.name).to.equal('index');
                expect(page.data.name).to.equal('hello');
                expect(sectionIndex.data.name).to.equal('index');
                expect(sectionPage.data.name).to.equal('bar');
                done();
            });

            stream.write(home);
            stream.write(page);
            stream.write(sectionIndex);
            stream.write(sectionPage);
            stream.end();
        });*/

        it('should assign urls, truncating "index"', function(done) {
            var stream = ssg();
            var home = getMarkdownFile('test/index.html', 'home');
            var page = getMarkdownFile('test/hello.html', 'page');
            var sectionIndex = getMarkdownFile('test/foo/index.html', 'section index');
            var sectionPage = getMarkdownFile('test/foo/bar.html', 'section page');

            stream.on('end', function() {
                expect(home.data.url).to.equal('/');
                expect(page.data.url).to.equal('/hello.html');
                expect(sectionIndex.data.url).to.equal('/foo/');
                expect(sectionPage.data.url).to.equal('/foo/bar.html');
                done();
            });

            stream.write(home);
            stream.write(page);
            stream.write(sectionIndex);
            stream.write(sectionPage);
            stream.end();
        });

        it('should give each a file a pointer to the root', function(done) {
            var stream = ssg();
            var home = getMarkdownFile('test/index.html', 'home');
            var page = getMarkdownFile('test/hello.html', 'page');
            var sectionIndex = getMarkdownFile('test/foo/index.html', 'section index');
            var sectionPage = getMarkdownFile('test/foo/bar.html', 'section page');

            stream.on('end', function() {
                expect(home.data.root.data.url).to.equal('/');
                expect(page.data.root.data.url).to.equal('/');
                expect(sectionIndex.data.root.data.url).to.equal('/');
                expect(sectionPage.data.root.data.url).to.equal('/');
                done();
            });

            stream.write(home);
            stream.write(page);
            stream.write(sectionIndex);
            stream.write(sectionPage);
            stream.end();
        });

        it('should give each a file a pointer to their parent', function(done) {
            var stream = ssg();
            var home = getMarkdownFile('test/index.html', 'home');
            var page1 = getMarkdownFile('test/hello.html', 'page');
            var page2 = getMarkdownFile('test/foo/index.html', 'section index');
            var childPage1 = getMarkdownFile('test/foo/bar.html', 'section page');

            stream.on('end', function() {
                expect(home.data.parent).to.equal(null);
                expect(page1.data.parent.data.url).to.equal('/');
                expect(page2.data.parent.data.url).to.equal('/');
                expect(childPage1.data.parent.data.url).to.equal('/foo/');
                done();
            });

            stream.write(home);
            stream.write(page1);
            stream.write(page2);
            stream.write(childPage1);
            stream.end();
        });

        it('should give each a file a pointer to their children', function(done) {
            var stream = ssg();
            var home = getMarkdownFile('test/index.html', 'home');
            var page1 = getMarkdownFile('test/hello.html', 'page');
            var page2 = getMarkdownFile('test/foo/index.html', 'section index');
            var childPage1 = getMarkdownFile('test/foo/bar.html', 'section page');

            stream.on('end', function() {
                expect(home.data.children[0].data.url).to.equal('/hello.html');
                expect(home.data.children[1].data.url).to.equal('/foo/');
                expect(page1.data.children.length).to.equal(0);
                expect(page2.data.children[0].data.url).to.equal('/foo/bar.html');
                expect(childPage1.data.children.length).to.equal(0);
                done();
            });

            stream.write(home);
            stream.write(page1);
            stream.write(page2);
            stream.write(childPage1);
            stream.end();
        });

        it('should give each a file a pointer to their siblings', function(done) {

            var stream = ssg();
            var home = getMarkdownFile('test/index.html', 'home');
            var page1 = getMarkdownFile('test/hello.html', 'page');
            var page2 = getMarkdownFile('test/foo/index.html', 'section index');
            var childPage1 = getMarkdownFile('test/foo/bar.html', 'section page');

            stream.on('end', function() {
                expect(home.data.siblings.length).to.equal(0);
                expect(page1.data.siblings[0].data.url).to.equal('/hello.html');
                expect(page1.data.siblings[1].data.url).to.equal('/foo/');
                expect(page2.data.siblings[0].data.url).to.equal('/hello.html');
                expect(page2.data.siblings[1].data.url).to.equal('/foo/');
                expect(childPage1.data.siblings.length).to.equal(1);
                // Siblings includes self, so will always be one
                expect(childPage1.data.siblings[0].data.url).to.equal(childPage1.data.url);
                done();
            });

            stream.write(home);
            stream.write(page1);
            stream.write(page2);
            stream.write(childPage1);
            stream.end();
        });

        it('should use the specified base url', function(done) {
            var options = {
                baseUrl: '/path/to/site'
            };
            /*var stream = ssg(options);
            var home = getMarkdownFile('test/index.html', 'home');
            var page = getMarkdownFile('test/hello.html', 'page');
            var sectionIndex = getMarkdownFile('test/foo/index.html', 'section index');
            var sectionPage = getMarkdownFile('test/foo/bar.html', 'section page');

            stream.on('end', function() {
                expect(home.data.url).to.equal('/path/to/site/');
                expect(page.data.url).to.equal('/path/to/site/hello/');
                expect(sectionIndex.data.url).to.equal('/path/to/site/foo/');
                expect(sectionPage.data.url).to.equal('/path/to/site/foo/bar/');
                done();
            });

            stream.write(home);
            stream.write(page);
            stream.write(sectionIndex);
            stream.write(sectionPage);
            stream.end();*/

            var stream = ssg(options);
            var home = getMarkdownFile('test/index.html', 'home');
            var page1 = getMarkdownFile('test/hello.html', 'page');
            var page2 = getMarkdownFile('test/foo/index.html', 'section index');
            var childPage1 = getMarkdownFile('test/foo/bar.html', 'section page');

            stream.on('end', function() {
                expect(home.data.url).to.equal('/path/to/site/');
                expect(page1.data.url).to.equal('/path/to/site/hello.html');
                expect(page2.data.url).to.equal('/path/to/site/foo/');
                expect(childPage1.data.url).to.equal('/path/to/site/foo/bar.html');
                done();
            });

            stream.write(home);
            stream.write(page1);
            stream.write(page2);
            stream.write(childPage1);
            stream.end();
        });

        /*it('should remove a trailing slash from the specified base url', function(done) {
            var website = {};
            var options = {
                baseUrl: '/path/to/site/'
            };
            var stream = ssg(website, options);
            var home = getMarkdownFile('test/index.md', 'home');
            var page = getMarkdownFile('test/hello.md', 'page');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var sectionPage = getMarkdownFile('test/foo/bar.md', 'section page');

            stream.on('end', function() {
                expect(home.data.url).to.equal('/path/to/site/');
                expect(page.data.url).to.equal('/path/to/site/hello/');
                expect(sectionIndex.data.url).to.equal('/path/to/site/foo/');
                expect(sectionPage.data.url).to.equal('/path/to/site/foo/bar/');
                done();
            });

            stream.write(home);
            stream.write(page);
            stream.write(sectionIndex);
            stream.write(sectionPage);
            stream.end();
        });*/

        /*it('should generate an index tree of sections', function(done) {
            var website = {};
            var stream = ssg(website);
            var home = getMarkdownFile('test/index.md', 'home');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var subsectionIndex = getMarkdownFile('test/foo/bar/index.md', 'sub-section page');

            stream.on('end', function() {
                expect(website.map).to.not.be.undefined;
                expect(website.map.sections).to.not.be.undefined;
                expect(website.map.sections[0].name).to.equal('foo');
                expect(website.map.sections[0].url).to.equal('/foo/');
                expect(website.map.sections[0].sections[0].name).to.equal('bar');
                expect(website.map.sections[0].sections[0].url).to.equal('/foo/bar/');
                expect(website.map.sections[0].sections[0].sections).to.be.empty;
                done();
            });

            stream.write(home);
            stream.write(sectionIndex);
            stream.write(subsectionIndex);
            stream.end();
        });*/

        /*it('should generate an index tree of sections with correct baseUrl', function(done) {
            var website = {};
            var options = {
                baseUrl: '/path/to/site'
            };
            var stream = ssg(website, options);
            var home = getMarkdownFile('test/index.md', 'home');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var subsectionIndex = getMarkdownFile('test/foo/bar/index.md', 'sub-section page');

            stream.on('end', function() {
                expect(website.map).to.not.be.undefined;
                expect(website.map.sections).to.not.be.undefined;
                expect(website.map.sections[0].name).to.equal('foo');
                expect(website.map.sections[0].url).to.equal('/path/to/site/foo/');
                expect(website.map.sections[0].sections[0].name).to.equal('bar');
                expect(website.map.sections[0].sections[0].url).to.equal('/path/to/site/foo/bar/');
                expect(website.map.sections[0].sections[0].sections).to.be.empty;
                done();
            });

            stream.write(home);
            stream.write(sectionIndex);
            stream.write(subsectionIndex);
            stream.end();
        });*/

        /*it('should allow overriding section name in tree', function(done) {
            var website = {};
            var stream = ssg(website, {
                sectionProperties: ['sectionTitle']
            });
            var home = getMarkdownFile('test/index.md', 'home');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var subsectionIndex = getMarkdownFile('test/foo/bar/index.md', 'sub-section page');

            sectionIndex.data = { sectionTitle: 'This is foo' };
            subsectionIndex.data = { sectionTitle: 'This is bar' };

            stream.on('end', function() {
                expect(website.map).to.not.be.undefined;
                expect(website.map.sections).to.not.be.undefined;
                expect(website.map.sections[0].name).to.equal('foo');
                expect(website.map.sections[0].sectionTitle).to.equal('This is foo');
                expect(website.map.sections[0].url).to.equal('/foo/');
                expect(website.map.sections[0].sections[0].name).to.equal('bar');
                expect(website.map.sections[0].sections[0].sectionTitle).to.equal('This is bar');
                expect(website.map.sections[0].sections[0].url).to.equal('/foo/bar/');
                expect(website.map.sections[0].sections[0].sections).to.be.empty;
                done();
            });

            stream.write(home);
            stream.write(sectionIndex);
            stream.write(subsectionIndex);
            stream.end();
        });*/

        /*it('should add files to the section tree', function(done) {
            var website = {};
            var stream = ssg(website);
            var home = getMarkdownFile('test/index.md', 'home');
            var page1 = getMarkdownFile('test/hello.md', 'page');
            var page2 = getMarkdownFile('test/goodbye.md', 'page');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var sectionPage1 = getMarkdownFile('test/foo/page1.md', 'section page');
            var sectionPage2 = getMarkdownFile('test/foo/page2.md', 'section page');
            var sectionPage3 = getMarkdownFile('test/foo/page3.md', 'section page');
            var subsectionIndex = getMarkdownFile('test/foo/bar/index.md', 'subsection index');
            var subsectionPage1 = getMarkdownFile('test/foo/bar/page1.md', 'subsection page');
            var subsectionPage2 = getMarkdownFile('test/foo/bar/page2.md', 'subsection page');


            stream.on('end', function() {
                expect(website.map).to.not.be.undefined;
                expect(website.map.files.length).to.equal(3);
                expect(website.map.sections[0].files.length).to.equal(4);
                expect(website.map.sections[0].sections[0].files.length).to.equal(3);
                done();
            });

            stream.write(home);
            stream.write(page1);
            stream.write(page2);
            stream.write(sectionIndex);
            stream.write(sectionPage1);
            stream.write(sectionPage2);
            stream.write(sectionPage3);
            stream.write(subsectionIndex);
            stream.write(subsectionPage1);
            stream.write(subsectionPage2);
            stream.end();
        });*/

        /*it('should break if you have no index in a directory', function(done) {
            // ideally the inverse of this should pass, but it's difficult
            var website = {};
            var stream = ssg(website);
            var home = getMarkdownFile('test/index.md', 'home');
            var page1 = getMarkdownFile('test/hello.md', 'page');
            var page2 = getMarkdownFile('test/goodbye.md', 'page');
            var sectionPage1 = getMarkdownFile('test/foo/page1.md', 'section page');
            var sectionPage2 = getMarkdownFile('test/foo/page2.md', 'section page');
            var sectionPage3 = getMarkdownFile('test/foo/page3.md', 'section page');
            var subsectionPage1 = getMarkdownFile('test/foo/bar/page1.md', 'subsection page');
            var subsectionPage2 = getMarkdownFile('test/foo/bar/page2.md', 'subsection page');


            stream.on('end', function() {
                expect(website.map).to.not.be.undefined;
                expect(website.map.files.length).to.equal(3);
                expect(typeof website.map.sections[0]).to.equal('undefined');
                done();
            });

            stream.write(home);
            stream.write(page1);
            stream.write(page2);
            stream.write(sectionPage1);
            stream.write(sectionPage2);
            stream.write(sectionPage3);
            stream.write(subsectionPage1);
            stream.write(subsectionPage2);
            stream.end();
        });*/

        /*it('should give each file a section reference', function(done) {
            var website = {};
            var stream = ssg(website);
            var home = getMarkdownFile('test/index.md', 'home');
            var page1 = getMarkdownFile('test/hello.md', 'page');
            var page2 = getMarkdownFile('test/goodbye.md', 'page');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var sectionPage1 = getMarkdownFile('test/foo/page1.md', 'section page');
            var sectionPage2 = getMarkdownFile('test/foo/page2.md', 'section page');
            var sectionPage3 = getMarkdownFile('test/foo/page3.md', 'section page');
            var subsectionIndex = getMarkdownFile('test/foo/bar/index.md', 'subsection index');
            var subsectionPage1 = getMarkdownFile('test/foo/bar/page2.md', 'subsection page');
            var subsectionPage2 = getMarkdownFile('test/foo/bar/page3.md', 'subsection page');

            stream.on('end', function() {
                expect(home.data.section).to.not.be.undefined;
                expect(home.data.section.name).to.equal('root');
                expect(page1.data.section.name).to.equal('root');
                expect(page2.data.section.name).to.equal('root');
                expect(home.data.section.files).to.not.be.undefined;
                expect(page1.data.section.files).to.not.be.undefined;
                expect(page2.data.section.files).to.not.be.undefined;
                expect(sectionIndex.data.section.name).to.equal('foo');
                expect(sectionPage1.data.section.name).to.equal('foo');
                expect(sectionPage2.data.section.name).to.equal('foo');
                expect(sectionIndex.data.section.files).to.not.be.undefined;
                expect(sectionPage1.data.section.files).to.not.be.undefined;
                expect(sectionPage2.data.section.files).to.not.be.undefined;
                expect(subsectionIndex.data.section.name).to.equal('bar');
                expect(subsectionPage1.data.section.name).to.equal('bar');
                expect(subsectionPage2.data.section.name).to.equal('bar');
                expect(subsectionIndex.data.section.files).to.not.be.undefined;
                expect(subsectionPage1.data.section.files).to.not.be.undefined;
                expect(subsectionPage2.data.section.files).to.not.be.undefined;
                done();
            });

            stream.write(home);
            stream.write(page1);
            stream.write(page2);
            stream.write(sectionIndex);
            stream.write(sectionPage1);
            stream.write(sectionPage2);
            stream.write(sectionPage3);
            stream.write(subsectionIndex);
            stream.write(subsectionPage1);
            stream.write(subsectionPage2);
            stream.end();
        });*/

        /*it('should default to sort by url', function(done) {
            var website = {};
            var stream = ssg(website);
            var home = getMarkdownFile('test/index.md', 'home');
            var page1 = getMarkdownFile('test/xyz.md', 'page');
            var page2 = getMarkdownFile('test/abc.md', 'page');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var sectionPage1 = getMarkdownFile('test/foo/10-hello.md', 'section page');
            var sectionPage2 = getMarkdownFile('test/foo/05-goodbye.md', 'section page');

            stream.on('end', function() {
                var urls = website.map.files.map(function(file) {
                    return file.data.url;
                });
                expect(urls).to.deep.equal([
                    '/',
                    '/abc/',
                    '/xyz/'
                ]);
                var sectionUrls = website.map.sections[0].files.map(function(file) {
                    return file.data.url;
                });
                expect(sectionUrls).to.deep.equal([
                    '/foo/',
                    '/foo/05-goodbye/',
                    '/foo/10-hello/'
                ]);
                done();
            });

            stream.write(home);
            stream.write(page1);
            stream.write(page2);
            stream.write(sectionIndex);
            stream.write(sectionPage1);
            stream.write(sectionPage2);
            stream.end();
        });*/

        /*it('should be possible to sort pages by assigned property', function(done) {
            var website = {};
            var options = {
                sort: 'order'
            };
            var stream = ssg(website, options);
            var home = getMarkdownFile('test/index.md', 'home');
            var page1 = getMarkdownFile('test/xyz.md', 'page');
            var page2 = getMarkdownFile('test/abc.md', 'page');
            var page3 = getMarkdownFile('test/def.md', 'page');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var sectionPage1 = getMarkdownFile('test/foo/10-hello.md', 'section page');
            var sectionPage2 = getMarkdownFile('test/foo/05-goodbye.md', 'section page');

            page1.data = { order: 1 };
            page2.data = { order: 12 };
            page3.data = { order: 6 };
            sectionPage1.data = { order: 1 };
            sectionPage2.data = { order: 2 };

            stream.on('end', function() {
                var urls = website.map.files.map(function(file) {
                    return file.data.url;
                });
                expect(urls).to.deep.equal([
                    '/',
                    '/xyz/',
                    '/def/',
                    '/abc/'
                ]);
                var sectionUrls = website.map.sections[0].files.map(function(file) {
                    return file.data.url;
                });
                expect(sectionUrls).to.deep.equal([
                    '/foo/',
                    '/foo/10-hello/',
                    '/foo/05-goodbye/'
                ]);
                done();
            });

            stream.write(home);
            stream.write(page2);
            stream.write(page1);
            stream.write(sectionPage1);
            stream.write(page3);
            stream.write(sectionIndex);
            stream.write(sectionPage2);
            stream.end();
        });*/

        /*it('should be possible to sort indexes in section (but indexes always come first in their own section)', function(done) {
            var website = {};
            var options = {
                sort: 'order'
            };
            var stream = ssg(website, options);
            var home = getMarkdownFile('test/index.md', 'home');
            var section1Index = getMarkdownFile('test/foo/index.md', 'section index');
            var section1Page1 = getMarkdownFile('test/foo/10-hello.md', 'section page');
            var section1Page2 = getMarkdownFile('test/foo/05-goodbye.md', 'section page');
            var section2Index = getMarkdownFile('test/bar/index.md', 'section index');
            var section2Page1 = getMarkdownFile('test/bar/10-hello.md', 'section page');
            var section2Page2 = getMarkdownFile('test/bar/05-goodbye.md', 'section page');
            var section3Index = getMarkdownFile('test/xyz/index.md', 'section index');
            var section3Page1 = getMarkdownFile('test/xyz/10-hello.md', 'section page');
            var section3Page2 = getMarkdownFile('test/xyz/05-goodbye.md', 'section page');

            section1Index.data = { order: 5 };
            section1Page1.data = { order: 1 };
            section1Page2.data = { order: 2 };

            section2Index.data = { order: 3 };
            section2Page1.data = { order: 1 };
            section2Page2.data = { order: 2 };

            section3Index.data = { order: 1 };
            section3Page1.data = { order: 1 };
            section3Page2.data = { order: 2 };

            stream.on('end', function() {
                var sectionUrls = website.map.sections.map(function(section) {
                    return section.url;
                });
                expect(sectionUrls).to.deep.equal([
                    '/xyz/',
                    '/bar/',
                    '/foo/'
                ]);

                var section1Urls = website.map.sections[0].files.map(function(file) {
                    return file.data.url;
                });
                expect(section1Urls).to.deep.equal([
                    '/xyz/',
                    '/xyz/10-hello/',
                    '/xyz/05-goodbye/'
                ]);

                var section2Urls = website.map.sections[1].files.map(function(file) {
                    return file.data.url;
                });
                expect(section2Urls).to.deep.equal([
                    '/bar/',
                    '/bar/10-hello/',
                    '/bar/05-goodbye/'
                ]);

                var section3Urls = website.map.sections[2].files.map(function(file) {
                    return file.data.url;
                });
                expect(section3Urls).to.deep.equal([
                    '/foo/',
                    '/foo/10-hello/',
                    '/foo/05-goodbye/'
                ]);

                done();
            });

            stream.write(home);
            stream.write(section1Index);
            stream.write(section1Page1);
            stream.write(section1Page2);
            stream.write(section2Index);
            stream.write(section2Page1);
            stream.write(section2Page2);
            stream.write(section3Index);
            stream.write(section3Page1);
            stream.write(section3Page2);
            stream.end();
        });*/

        /*it('should emit file data after the full index is created', function(done) {
            var website = {};
            var stream = ssg(website);
            var home = getMarkdownFile('test/index.md', 'home');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var subsectionIndex = getMarkdownFile('test/foo/bar/index.md', 'sub-section page');
            var testCount = 0;

            stream.on('data', function() {
                expect(website.map).to.not.be.undefined;
                expect(website.map.sections).to.not.be.undefined;
                expect(website.map.sections[0].name).to.equal('foo');
                expect(website.map.sections[0].url).to.equal('/foo/');
                expect(website.map.sections[0].sections[0].name).to.equal('bar');
                expect(website.map.sections[0].sections[0].url).to.equal('/foo/bar/');
                expect(website.map.sections[0].sections[0].sections).to.be.empty;
                if (testCount++ === 2) {
                    done();
                }
            });

            stream.write(home);
            stream.write(sectionIndex);
            stream.write(subsectionIndex);
            stream.end();
        });*/

    });

});
