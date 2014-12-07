'use strict';
/* globals describe, it */
var ssg = require('../');
var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');
var File = require('gulp-util').File;
var Buffer = require('buffer').Buffer;

describe('gulp-ssg()', function() {

	/* jshint camelcase: false */

    function mockFile(path, content) {
		content = content || 'test';
        return new File({
            cwd: '',
            base: 'test/',
            path: path,
            contents: new Buffer(content)
        });
    }

    describe('in buffer mode', function() {

        it('should assign urls, truncating "index"', function(done) {
            var stream = ssg();
            var h = mockFile('test/index.html');
            var p1 = mockFile('test/hello.html');
            var p2 = mockFile('test/foo/index.html');
            var p2_1 = mockFile('test/foo/bar.html');

            stream.on('end', function() {
                expect(h.data.url).to.equal('/');
                expect(p1.data.url).to.equal('/hello.html');
                expect(p2.data.url).to.equal('/foo/');
                expect(p2_1.data.url).to.equal('/foo/bar.html');
                done();
            });

            stream.write(h);
            stream.write(p1);
            stream.write(p2);
            stream.write(p2_1);
            stream.end();
        });

        it('should work with the .htm extension', function(done) {
            var stream = ssg();
            var h = mockFile('test/index.htm');
            var p1 = mockFile('test/hello.htm');
            var p2 = mockFile('test/foo/index.htm');
            var p2_1 = mockFile('test/foo/bar.htm');

            stream.on('end', function() {
                expect(h.data.url).to.equal('/');
                expect(p1.data.url).to.equal('/hello.htm');
                expect(p2.data.url).to.equal('/foo/');
                expect(p2_1.data.url).to.equal('/foo/bar.htm');
                done();
            });

            stream.write(h);
            stream.write(p1);
            stream.write(p2);
            stream.write(p2_1);
            stream.end();
        });

        it('should give each a file a pointer to the root', function(done) {
            var stream = ssg();
            var h = mockFile('test/index.html');
            var p1 = mockFile('test/hello.html');
            var p2 = mockFile('test/foo/index.html');
            var p2_1 = mockFile('test/foo/bar.html');

            stream.on('end', function() {
                expect(h.data.root.data.url).to.equal('/');
                expect(p1.data.root.data.url).to.equal('/');
                expect(p2.data.root.data.url).to.equal('/');
                expect(p2_1.data.root.data.url).to.equal('/');
                done();
            });

            stream.write(h);
            stream.write(p1);
            stream.write(p2);
            stream.write(p2_1);
            stream.end();
        });

        it('should give each a file a pointer to their parent', function(done) {
            var stream = ssg();
            var h = mockFile('test/index.html');
            var p1 = mockFile('test/hello.html');
            var p2 = mockFile('test/foo/index.html');
            var p2_1 = mockFile('test/foo/bar.html');

            stream.on('end', function() {
                expect(h.data.parent).to.equal(null);
                expect(p1.data.parent.data.url).to.equal('/');
                expect(p2.data.parent.data.url).to.equal('/');
                expect(p2_1.data.parent.data.url).to.equal('/foo/');
                done();
            });

            stream.write(h);
            stream.write(p1);
            stream.write(p2);
            stream.write(p2_1);
            stream.end();
        });

        it('should give each a file a pointer to their children', function(done) {
            var stream = ssg();
            var h = mockFile('test/index.html');
            var p1 = mockFile('test/hello.html');
            var p2 = mockFile('test/foo/index.html');
            var p2_1 = mockFile('test/foo/bar.html');

            stream.on('end', function() {
                expect(h.data.children[0].data.url).to.equal('/foo/');
                expect(h.data.children[1].data.url).to.equal('/hello.html');
                expect(p1.data.children.length).to.equal(0);
                expect(p2.data.children[0].data.url).to.equal('/foo/bar.html');
                expect(p2_1.data.children.length).to.equal(0);
                done();
            });

            stream.write(h);
            stream.write(p1);
            stream.write(p2);
            stream.write(p2_1);
            stream.end();
        });

        it('should give each a file a pointer to their siblings', function(done) {

            var stream = ssg();
            var h = mockFile('test/index.html');
            var p1 = mockFile('test/hello.html');
            var p2 = mockFile('test/foo/index.html');
            var p2_1 = mockFile('test/foo/bar.html');

            stream.on('end', function() {
                expect(h.data.siblings.length).to.equal(0);
                expect(p1.data.siblings[0].data.url).to.equal('/foo/');
                expect(p1.data.siblings[1].data.url).to.equal('/hello.html');
                expect(p2.data.siblings[0].data.url).to.equal('/foo/');
                expect(p2.data.siblings[1].data.url).to.equal('/hello.html');
                expect(p2_1.data.siblings.length).to.equal(1);
                // Siblings includes self, so will always be one
                expect(p2_1.data.siblings[0].data.url).to.equal(p2_1.data.url);
                done();
            });

            stream.write(h);
            stream.write(p1);
            stream.write(p2);
            stream.write(p2_1);
            stream.end();
        });

        it('should handle deeply nested trees', function(done) {

            var stream = ssg();
            // Files named like level[n]page[n]
            var h = mockFile('test/index.html');
            var p1 = mockFile('test/hello.html');
            var p2 = mockFile('test/foo/index.html');
            var p2_1 = mockFile('test/foo/bar.html');
            var p2_2 = mockFile('test/foo/qux.html');
            var p2_3 = mockFile('test/foo/fred/index.html');
            var p2_3_1 = mockFile('test/foo/fred/foo/index.html');
            var p2_3_2 = mockFile('test/foo/fred/bar.html');

            stream.on('end', function() {

                // Siblings
                expect(h.data.siblings.length).to.equal(0);

                expect(p1.data.siblings.map(function(f) { return f.data.url; }))
                    .to.deep.equal(['/foo/', '/hello.html']);

                expect(p2.data.siblings.map(function(f) { return f.data.url; }))
                    .to.deep.equal(['/foo/', '/hello.html']);

                expect(p2_1.data.siblings.map(function(f) { return f.data.url; }))
                    .to.deep.equal(['/foo/bar.html', '/foo/fred/', '/foo/qux.html']);

                expect(p2_2.data.siblings.map(function(f) { return f.data.url; }))
                    .to.deep.equal(['/foo/bar.html', '/foo/fred/', '/foo/qux.html']);

                expect(p2_3.data.siblings.map(function(f) { return f.data.url; }))
                    .to.deep.equal(['/foo/bar.html', '/foo/fred/', '/foo/qux.html']);

                // Children
                expect(h.data.children.map(function(f) { return f.data.url; }))
                    .to.deep.equal(['/foo/', '/hello.html']);

                expect(p2.data.children.map(function(f) { return f.data.url; }))
                    .to.deep.equal(['/foo/bar.html', '/foo/fred/', '/foo/qux.html']);

                expect(p2_3.data.children.map(function(f) { return f.data.url; }))
                    .to.deep.equal(['/foo/fred/bar.html', '/foo/fred/foo/']);

                done();
            });

            stream.write(h);
            stream.write(p1);
            stream.write(p2);
            stream.write(p2_1);
            stream.write(p2_2);
            stream.write(p2_3);
            stream.write(p2_3_1);
            stream.write(p2_3_2);
            stream.end();
        });

        it('should use the specified base url', function(done) {
            var options = {
                baseUrl: '/path/to/site'
            };

            var stream = ssg(options);
            var h = mockFile('test/index.html');
            var p1 = mockFile('test/hello.html');
            var p2 = mockFile('test/foo/index.html');
            var p2_1 = mockFile('test/foo/bar.html');

            stream.on('end', function() {
                expect(h.data.url).to.equal('/path/to/site/');
                expect(p1.data.url).to.equal('/path/to/site/hello.html');
                expect(p2.data.url).to.equal('/path/to/site/foo/');
                expect(p2_1.data.url).to.equal('/path/to/site/foo/bar.html');
                done();
            });

            stream.write(h);
            stream.write(p1);
            stream.write(p2);
            stream.write(p2_1);
            stream.end();
        });

        it('should remove a trailing slash from the specified base url', function(done) {
            var options = {
                baseUrl: '/path/to/site/'
            };
            var stream = ssg(options);
            var h = mockFile('test/index.html');
            var p1 = mockFile('test/hello.html');
            var p2 = mockFile('test/foo/index.html');
            var p2_1 = mockFile('test/foo/bar.html');

            stream.on('end', function() {
                expect(h.data.url).to.equal('/path/to/site/');
                expect(p1.data.url).to.equal('/path/to/site/hello.html');
                expect(p2.data.url).to.equal('/path/to/site/foo/');
                expect(p2_1.data.url).to.equal('/path/to/site/foo/bar.html');
                done();
            });

            stream.write(h);
            stream.write(p1);
            stream.write(p2);
            stream.write(p2_1);
            stream.end();
        });

        it('should sort by url by default', function(done) {
            var stream = ssg();
            var h = mockFile('test/index.html');
            var p1 = mockFile('test/xyz.html');
            var p2 = mockFile('test/abc.html');
            var p3 = mockFile('test/foo/index.html');
            var p3_1 = mockFile('test/foo/10-hello.html', 'child page');
            var p3_2 = mockFile('test/foo/05-goodbye.html', 'child page');

            stream.on('end', function() {
                var urls = h.data.children.map(function(file) {
                    return file.data.url;
                });
                expect(urls).to.deep.equal([
                    '/abc.html',
                    '/foo/',
                    '/xyz.html'
                ]);
                var childUrls = p3.data.children.map(function(file) {
                    return file.data.url;
                });
                expect(childUrls).to.deep.equal([
                    '/foo/05-goodbye.html',
                    '/foo/10-hello.html'
                ]);
                done();
            });

            stream.write(h);
            stream.write(p1);
            stream.write(p2);
            stream.write(p3);
            stream.write(p3_1);
            stream.write(p3_2);
            stream.end();
        });

        it('should sort pages by options.sort', function(done) {
            var options = {
                sort: 'order'
            };
            var stream = ssg(options);
            var h = mockFile('test/index.html');
            var p1 = mockFile('test/xyz.html');
            var p2 = mockFile('test/abc.html');
            var p3 = mockFile('test/def.html');
            var p4 = mockFile('test/foo/index.html');
            var p4_1 = mockFile('test/foo/10-hello.html');
            var p4_2 = mockFile('test/foo/05-goodbye.html');

            p1.data = { order: 1 };
            p2.data = { order: 12 };
            p3.data = { order: 6 };
            p4.data = { order: 2 };
            p4_1.data = { order: 1 };
            p4_2.data = { order: 2 };

            stream.on('end', function() {
                var urls = h.data.children.map(function(file) {
                    return file.data.url;
                });
                expect(urls).to.deep.equal([
                    '/xyz.html',
                    '/foo/',
                    '/def.html',
                    '/abc.html'
                ]);
                var childUrls = p4.data.children.map(function(file) {
                    return file.data.url;
                });
                expect(childUrls).to.deep.equal([
                    '/foo/10-hello.html',
                    '/foo/05-goodbye.html'
                ]);
                done();
            });

            stream.write(h);
            stream.write(p2);
            stream.write(p1);
            stream.write(p4);
            stream.write(p3);
            stream.write(p4_2);
            stream.write(p4_1);
            stream.end();
        });

        it('should give not break if there is no root file', function(done) {

            var stream = ssg();
            var p1 = mockFile('test/hello.html');
            var p2 = mockFile('test/foo/index.html');
            var p2_1 = mockFile('test/foo/bar.html');

            stream.on('end', function() {
                expect(p1.data.root).to.equal(null);
                expect(p1.data.siblings[0].data.url).to.equal('/foo/');
                expect(p1.data.siblings[1].data.url).to.equal('/hello.html');
                expect(p2.data.siblings[0].data.url).to.equal('/foo/');
                expect(p2.data.siblings[1].data.url).to.equal('/hello.html');
                expect(p2_1.data.siblings.length).to.equal(1);
                done();
            });

            stream.write(p1);
            stream.write(p2);
            stream.write(p2_1);
            stream.end();
        });

    });

});
