'use strict';
/* globals describe, it */
var ssg = require('../');
var gulp = require('gulp');
var expect = require('chai').expect;
var should = require('should');
var es = require('event-stream');
var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var File = gutil.File;
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

        it('should rename indexes to path/index.html', function(done) {
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
        });

        it('should rename non-indexes to path/basename/index.html', function(done) {
            var stream = ssg({});
            var file = getMarkdownFile('test/hello.md', 'test');

            stream.on('end', function() {
                var newFilePath = path.resolve(file.path);
                var expectedFilePath = path.resolve('test/hello/index.html');
                newFilePath.should.equal(expectedFilePath);
                file.relative.should.equal('hello/index.html');
                Buffer.isBuffer(file.contents).should.equal(true);
                done();
            });

            stream.write(file);
            stream.end();
        });

        it('should assign booleans for isHome and isIndex', function(done) {
            var site = {};
            var stream = ssg(site);
            var home = getMarkdownFile('test/index.md', 'home');
            var page = getMarkdownFile('test/hello.md', 'page');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'index');
            var sectionPage = getMarkdownFile('test/foo/bar.md', 'section page');

            stream.on('end', function() {
                expect(home.meta.isHome).to.be.true;
                expect(home.meta.isIndex).to.be.true;
                expect(page.meta.isHome).to.be.false;
                expect(page.meta.isIndex).to.be.false;
                expect(sectionIndex.meta.isHome).to.be.false;
                expect(sectionIndex.meta.isIndex).to.be.true;
                expect(sectionPage.meta.isHome).to.be.false;
                expect(sectionPage.meta.isIndex).to.be.false;
                done();
            });

            stream.write(home);
            stream.write(page);
            stream.write(sectionIndex);
            stream.write(sectionPage);
            stream.end();
        });

        it('should not override properties assigned to the site', function(done) {
            var site = { title: 'My Site' };
            var stream = ssg(site);
            var file1 = getMarkdownFile('test/index.md', 'home');

            stream.on('end', function() {
                expect(site.title).to.equal('My Site');
                done();
            });

            stream.write(file1);
            stream.end();
        });

        it('should assign urls', function(done) {
            var site = {};
            var stream = ssg(site);
            var home = getMarkdownFile('test/index.md', 'home');
            var page = getMarkdownFile('test/hello.md', 'page');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var sectionPage = getMarkdownFile('test/foo/bar.md', 'section page');

            stream.on('end', function() {
                expect(home.meta.url).to.equal('/');
                expect(page.meta.url).to.equal('/hello/');
                expect(sectionIndex.meta.url).to.equal('/foo/');
                expect(sectionPage.meta.url).to.equal('/foo/bar/');
                done();
            });

            stream.write(home);
            stream.write(page);
            stream.write(sectionIndex);
            stream.write(sectionPage);
            stream.end();
        });

        it('should assign section urls', function(done) {
            var site = {};
            var stream = ssg(site);
            var home = getMarkdownFile('test/index.md', 'home');
            var page = getMarkdownFile('test/hello.md', 'page');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var sectionPage = getMarkdownFile('test/foo/bar.md', 'sectionPage');

            stream.on('end', function() {
                expect(home.meta.sectionUrl).to.equal('/');
                expect(page.meta.sectionUrl).to.equal('/');
                expect(sectionIndex.meta.sectionUrl).to.equal('/foo/');
                expect(sectionPage.meta.sectionUrl).to.equal('/foo/');
                done();
            });

            stream.write(home);
            stream.write(page);
            stream.write(sectionIndex);
            stream.write(sectionPage);
            stream.end();
        });

        it('should use the specified base url', function(done) {
            var site = {};
            var options = {
                baseUrl: '/path/to/site'
            };
            var stream = ssg(site, options);
            var home = getMarkdownFile('test/index.md', 'home');
            var page = getMarkdownFile('test/hello.md', 'page');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var sectionPage = getMarkdownFile('test/foo/bar.md', 'section page');

            stream.on('end', function() {
                expect(home.meta.url).to.equal('/path/to/site/');
                expect(page.meta.url).to.equal('/path/to/site/hello/');
                expect(sectionIndex.meta.url).to.equal('/path/to/site/foo/');
                expect(sectionPage.meta.url).to.equal('/path/to/site/foo/bar/');
                done();
            });

            stream.write(home);
            stream.write(page);
            stream.write(sectionIndex);
            stream.write(sectionPage);
            stream.end();
        });

        it('should generate an index tree of sections', function(done) {
            var site = {};
            var stream = ssg(site);
            var home = getMarkdownFile('test/index.md', 'home');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var subsectionIndex = getMarkdownFile('test/foo/bar/index.md', 'sub-section page');

            stream.on('end', function() {
                expect(site.index).to.not.be.undefined;
                expect(site.index.sections).to.not.be.undefined;
                expect(site.index.sections[0].name).to.equal('foo');
                expect(site.index.sections[0].url).to.equal('/foo/');
                expect(site.index.sections[0].sections[0].name).to.equal('bar');
                expect(site.index.sections[0].sections[0].url).to.equal('/foo/bar/');
                expect(site.index.sections[0].sections[0].sections).to.be.empty;
                done();
            });

            stream.write(home);
            stream.write(sectionIndex);
            stream.write(subsectionIndex);
            stream.end();
        });

        it('should generate an index tree of sections with correct baseUrl', function(done) {
            var site = {};
            var options = {
                baseUrl: '/path/to/site'
            };
            var stream = ssg(site, options);
            var home = getMarkdownFile('test/index.md', 'home');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var subsectionIndex = getMarkdownFile('test/foo/bar/index.md', 'sub-section page');

            stream.on('end', function() {
                expect(site.index).to.not.be.undefined;
                expect(site.index.sections).to.not.be.undefined;
                expect(site.index.sections[0].name).to.equal('foo');
                expect(site.index.sections[0].url).to.equal('/path/to/site/foo/');
                expect(site.index.sections[0].sections[0].name).to.equal('bar');
                expect(site.index.sections[0].sections[0].url).to.equal('/path/to/site/foo/bar/');
                expect(site.index.sections[0].sections[0].sections).to.be.empty;
                done();
            });

            stream.write(home);
            stream.write(sectionIndex);
            stream.write(subsectionIndex);
            stream.end();
        });

        it('should allow overriding section name in tree', function(done) {
            var site = {};
            var stream = ssg(site, {
                sectionProperties: ['sectionTitle']
            });
            var home = getMarkdownFile('test/index.md', 'home');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var subsectionIndex = getMarkdownFile('test/foo/bar/index.md', 'sub-section page');

            sectionIndex.meta = { sectionTitle: 'This is foo' };
            subsectionIndex.meta = { sectionTitle: 'This is bar' };

            stream.on('end', function() {
                expect(site.index).to.not.be.undefined;
                expect(site.index.sections).to.not.be.undefined;
                expect(site.index.sections[0].name).to.equal('foo');
                expect(site.index.sections[0].sectionTitle).to.equal('This is foo');
                expect(site.index.sections[0].url).to.equal('/foo/');
                expect(site.index.sections[0].sections[0].name).to.equal('bar');
                expect(site.index.sections[0].sections[0].sectionTitle).to.equal('This is bar');
                expect(site.index.sections[0].sections[0].url).to.equal('/foo/bar/');
                expect(site.index.sections[0].sections[0].sections).to.be.empty;
                done();
            });

            stream.write(home);
            stream.write(sectionIndex);
            stream.write(subsectionIndex);
            stream.end();
        });

        it('should add files to the section tree', function(done) {
            var site = {};
            var stream = ssg(site);
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
                expect(site.index).to.not.be.undefined;
                expect(site.index.files.length).to.equal(3);
                expect(site.index.sections[0].files.length).to.equal(4);
                expect(site.index.sections[0].sections[0].files.length).to.equal(3);
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
        });

        it('should break if you have no index in a directory', function(done) {
            // ideally the inverse of this should pass, but it's difficult
            var site = {};
            var stream = ssg(site);
            var home = getMarkdownFile('test/index.md', 'home');
            var page1 = getMarkdownFile('test/hello.md', 'page');
            var page2 = getMarkdownFile('test/goodbye.md', 'page');
            var sectionPage1 = getMarkdownFile('test/foo/page1.md', 'section page');
            var sectionPage2 = getMarkdownFile('test/foo/page2.md', 'section page');
            var sectionPage3 = getMarkdownFile('test/foo/page3.md', 'section page');
            var subsectionPage1 = getMarkdownFile('test/foo/bar/page1.md', 'subsection page');
            var subsectionPage2 = getMarkdownFile('test/foo/bar/page2.md', 'subsection page');


            stream.on('end', function() {
                expect(site.index).to.not.be.undefined;
                expect(site.index.files.length).to.equal(3);
                expect(typeof site.index.sections[0]).to.equal('undefined');
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
        });

        it('should give each file a section reference', function(done) {
            var site = {};
            var stream = ssg(site);
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
                expect(home.meta.section).to.not.be.undefined;
                expect(home.meta.section.name).to.equal('root');
                expect(page1.meta.section.name).to.equal('root');
                expect(page2.meta.section.name).to.equal('root');
                expect(home.meta.section.files).to.not.be.undefined;
                expect(page1.meta.section.files).to.not.be.undefined;
                expect(page2.meta.section.files).to.not.be.undefined;
                expect(sectionIndex.meta.section.name).to.equal('foo');
                expect(sectionPage1.meta.section.name).to.equal('foo');
                expect(sectionPage2.meta.section.name).to.equal('foo');
                expect(sectionIndex.meta.section.files).to.not.be.undefined;
                expect(sectionPage1.meta.section.files).to.not.be.undefined;
                expect(sectionPage2.meta.section.files).to.not.be.undefined;
                expect(subsectionIndex.meta.section.name).to.equal('bar');
                expect(subsectionPage1.meta.section.name).to.equal('bar');
                expect(subsectionPage2.meta.section.name).to.equal('bar');
                expect(subsectionIndex.meta.section.files).to.not.be.undefined;
                expect(subsectionPage1.meta.section.files).to.not.be.undefined;
                expect(subsectionPage2.meta.section.files).to.not.be.undefined;
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
        });

        it('should default to sort by url', function(done) {
            var site = {};
            var stream = ssg(site);
            var home = getMarkdownFile('test/index.md', 'home');
            var page1 = getMarkdownFile('test/xyz.md', 'page');
            var page2 = getMarkdownFile('test/abc.md', 'page');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var sectionPage1 = getMarkdownFile('test/foo/10-hello.md', 'section page');
            var sectionPage2 = getMarkdownFile('test/foo/05-goodbye.md', 'section page');

            stream.on('end', function() {
                var urls = site.index.files.map(function(file) {
                    return file.meta.url;
                });
                expect(urls).to.deep.equal([
                    '/',
                    '/abc/',
                    '/xyz/'
                ]);
                var sectionUrls = site.index.sections[0].files.map(function(file) {
                    return file.meta.url;
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
        });

        it('should be possible to sort by assigned property', function(done) {
            var site = {};
            var options = {
                sort: 'order'
            };
            var stream = ssg(site, options);
            var home = getMarkdownFile('test/index.md', 'home');
            var page1 = getMarkdownFile('test/xyz.md', 'page');
            var page2 = getMarkdownFile('test/abc.md', 'page');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var sectionPage1 = getMarkdownFile('test/foo/10-hello.md', 'section page');
            var sectionPage2 = getMarkdownFile('test/foo/05-goodbye.md', 'section page');

            page1.page = { order: 1 };
            page2.page = { order: 2 };
            sectionPage1.page = { order: 1 };
            sectionPage2.page = { order: 30 };

            stream.on('end', function() {
                var urls = site.index.files.map(function(file) {
                    return file.meta.url;
                });
                expect(urls).to.deep.equal([
                    '/',
                    '/xyz/',
                    '/abc/'
                ]);
                var sectionUrls = site.index.sections[0].files.map(function(file) {
                    return file.meta.url;
                });
                expect(sectionUrls).to.deep.equal([
                    '/foo/',
                    '/foo/10-hello/',
                    '/foo/05-goodbye/'
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
        });

        it('should emit file data after the full index is created', function(done) {
            var site = {};
            var stream = ssg(site);
            var home = getMarkdownFile('test/index.md', 'home');
            var sectionIndex = getMarkdownFile('test/foo/index.md', 'section index');
            var subsectionIndex = getMarkdownFile('test/foo/bar/index.md', 'sub-section page');
            var testCount = 0;

            stream.on('data', function() {
                expect(site.index).to.not.be.undefined;
                expect(site.index.sections).to.not.be.undefined;
                expect(site.index.sections[0].name).to.equal('foo');
                expect(site.index.sections[0].url).to.equal('/foo/');
                expect(site.index.sections[0].sections[0].name).to.equal('bar');
                expect(site.index.sections[0].sections[0].url).to.equal('/foo/bar/');
                expect(site.index.sections[0].sections[0].sections).to.be.empty;
                if (testCount++ === 2) {
                    done();
                }
            });

            stream.write(home);
            stream.write(sectionIndex);
            stream.write(subsectionIndex);
            stream.end();
        });

    });

});
