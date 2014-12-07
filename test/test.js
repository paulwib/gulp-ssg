'use strict';
/* globals describe, it */
var ssg = require('../');
var expect = require('chai').expect;
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

        it('should assign urls, truncating "index"', function(done) {
            var stream = ssg();
            var home = getMarkdownFile('test/index.html', 'home');
            var page1 = getMarkdownFile('test/hello.html', 'page');
            var page2 = getMarkdownFile('test/foo/index.html', 'section index');
            var childPage1 = getMarkdownFile('test/foo/bar.html', 'section page');

            stream.on('end', function() {
                expect(home.data.url).to.equal('/');
                expect(page1.data.url).to.equal('/hello.html');
                expect(page2.data.url).to.equal('/foo/');
                expect(childPage1.data.url).to.equal('/foo/bar.html');
                done();
            });

            stream.write(home);
            stream.write(page1);
            stream.write(page2);
            stream.write(childPage1);
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
                expect(home.data.children[0].data.url).to.equal('/foo/');
                expect(home.data.children[1].data.url).to.equal('/hello.html');
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
                expect(page1.data.siblings[0].data.url).to.equal('/foo/');
                expect(page1.data.siblings[1].data.url).to.equal('/hello.html');
                expect(page2.data.siblings[0].data.url).to.equal('/foo/');
                expect(page2.data.siblings[1].data.url).to.equal('/hello.html');
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

        it('should remove a trailing slash from the specified base url', function(done) {
            var options = {
                baseUrl: '/path/to/site/'
            };
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

        it('should sort by url by default', function(done) {
            var stream = ssg();
            var home = getMarkdownFile('test/index.html', 'home');
            var page1 = getMarkdownFile('test/xyz.html', 'page');
            var page2 = getMarkdownFile('test/abc.html', 'page');
            var page3 = getMarkdownFile('test/foo/index.html', 'section index');
            var childPage1 = getMarkdownFile('test/foo/10-hello.html', 'child page');
            var childPage2 = getMarkdownFile('test/foo/05-goodbye.html', 'child page');

            stream.on('end', function() {
                var urls = home.data.children.map(function(file) {
                    return file.data.url;
                });
                expect(urls).to.deep.equal([
                    '/abc.html',
                    '/foo/',
                    '/xyz.html'
                ]);
                var childUrls = page3.data.children.map(function(file) {
                    return file.data.url;
                });
                expect(childUrls).to.deep.equal([
                    '/foo/05-goodbye.html',
                    '/foo/10-hello.html'
                ]);
                done();
            });

            stream.write(home);
            stream.write(page1);
            stream.write(page2);
            stream.write(page3);
            stream.write(childPage1);
            stream.write(childPage2);
            stream.end();
        });

        it('should sort pages by options.sort', function(done) {
            var options = {
                sort: 'order'
            };
            var stream = ssg(options);
            var home = getMarkdownFile('test/index.html', 'home');
            var page1 = getMarkdownFile('test/xyz.html', 'page');
            var page2 = getMarkdownFile('test/abc.html', 'page');
            var page3 = getMarkdownFile('test/def.html', 'page');
            var page4 = getMarkdownFile('test/foo/index.html', 'section index');
            var childPage1 = getMarkdownFile('test/foo/10-hello.html', 'section page');
            var childPage2 = getMarkdownFile('test/foo/05-goodbye.html', 'section page');

            page1.data = { order: 1 };
            page2.data = { order: 12 };
            page3.data = { order: 6 };
            page4.data = { order: 2 };
            childPage1.data = { order: 1 };
            childPage2.data = { order: 2 };

            stream.on('end', function() {
                var urls = home.data.children.map(function(file) {
                    return file.data.url;
                });
                expect(urls).to.deep.equal([
                    '/xyz.html',
                    '/foo/',
                    '/def.html',
                    '/abc.html'
                ]);
                var childUrls = page4.data.children.map(function(file) {
                    return file.data.url;
                });
                expect(childUrls).to.deep.equal([
                    '/foo/10-hello.html',
                    '/foo/05-goodbye.html'
                ]);
                done();
            });

            stream.write(home);
            stream.write(page2);
            stream.write(page1);
            stream.write(page4);
            stream.write(page3);
            stream.write(childPage2);
            stream.write(childPage1);
            stream.end();
        });

    });

});
