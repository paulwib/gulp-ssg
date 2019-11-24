var test = require('tape');
var fs = require('fs');
var path = require('path');
var File = require('vinyl');
var Buffer = require('buffer').Buffer;
var ssg = require('../');

function getElementUrls (elms) {
    return elms.map(({ data }) => data.url);
};

function mockFile(path, content = 'test') {
    return new File({
        cwd: '',
        base: 'test/',
        path: path,
        contents: new Buffer.from(content)
    });
}

test('should assign urls, truncating "index" (regardless of file extension)', function(t) {
    t.plan(4);

    var stream = ssg();
    var h = mockFile('test/index.md');
    var p1 = mockFile('test/hello.xhtml');
    var p2 = mockFile('test/foo/index.html');
    var p2_1 = mockFile('test/foo/bar.xml');

    stream.on('end', function() {
        t.is(h.data.url, '/');
        t.is(p1.data.url, '/hello.xhtml');
        t.is(p2.data.url, '/foo/');
        t.is(p2_1.data.url, '/foo/bar.xml');
    });

    stream.write(h);
    stream.write(p1);
    stream.write(p2);
    stream.write(p2_1);
    stream.end();
});

test('should give each a file a pointer to the root', function(t) {
    t.plan(6);

    var stream = ssg();
    var h = mockFile('test/index.html');
    var p1 = mockFile('test/hello.html');
    var p2 = mockFile('test/foo/index.html');
    var p2_1 = mockFile('test/foo/bar.html');

    stream.on('end', function() {
        t.is(h.data.root.data.url, '/');
        t.is(p1.data.root.data.url, '/');
        t.is(p2.data.root.data.url, '/');
        t.is(p2_1.data.root.data.url, '/');
        t.ok(p2_1.data.root.data.children);
        t.is(p2_1.data.root.data.children.length, 2);
    });

    stream.write(h);
    stream.write(p1);
    stream.write(p2);
    stream.write(p2_1);
    stream.end();
});

test('should give each a file a pointer to their parent', function(t) {
    t.plan(4);

    var stream = ssg();
    var h = mockFile('test/index.html');
    var p1 = mockFile('test/hello.html');
    var p2 = mockFile('test/foo/index.html');
    var p2_1 = mockFile('test/foo/bar.html');

    stream.on('end', function() {
        t.is(h.data.parent, null);
        t.is(p1.data.parent.data.url, '/');
        t.is(p2.data.parent.data.url, '/');
        t.is(p2_1.data.parent.data.url, '/foo/');
    });

    stream.write(h);
    stream.write(p1);
    stream.write(p2);
    stream.write(p2_1);
    stream.end();
});

test('should give each a file a pointer to their children', function(t) {
    t.plan(5);

    var stream = ssg();
    var h = mockFile('test/index.html');
    var p1 = mockFile('test/hello.html');
    var p2 = mockFile('test/foo/index.html');
    var p2_1 = mockFile('test/foo/bar.html');

    stream.on('end', function() {
        t.is(h.data.children[0].data.url, '/foo/');
        t.is(h.data.children[1].data.url, '/hello.html');
        t.is(p1.data.children.length, 0);
        t.is(p2.data.children[0].data.url, '/foo/bar.html');
        t.is(p2_1.data.children.length, 0);
    });

    stream.write(h);
    stream.write(p1);
    stream.write(p2);
    stream.write(p2_1);
    stream.end();
});

test('should give each a file a pointer to their siblings', function(t) {
    t.plan(7);

    var stream = ssg();
    var h = mockFile('test/index.html');
    var p1 = mockFile('test/hello.html');
    var p2 = mockFile('test/foo/index.html');
    var p2_1 = mockFile('test/foo/bar.html');

    stream.on('end', function() {
        t.is(h.data.siblings.length, 0);
        t.is(p1.data.siblings[0].data.url, '/foo/');
        t.is(p1.data.siblings[1].data.url, '/hello.html');
        t.is(p2.data.siblings[0].data.url, '/foo/');
        t.is(p2.data.siblings[1].data.url, '/hello.html');
        t.is(p2_1.data.siblings.length, 1);
        // Siblings includes self, so will always be one
        t.is(p2_1.data.siblings[0].data.url, p2_1.data.url);
    });

    stream.write(h);
    stream.write(p1);
    stream.write(p2);
    stream.write(p2_1);
    stream.end();
});

test('should handle deeply nested trees', function(t) {
    t.plan(9);

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
        t.is(h.data.siblings.length, 0);
        t.deepEquals(getElementUrls(p1.data.siblings), ['/foo/', '/hello.html']);
        t.deepEquals(getElementUrls(p2.data.siblings), ['/foo/', '/hello.html']);
        t.deepEquals(getElementUrls(p2_1.data.siblings), ['/foo/bar.html', '/foo/fred/', '/foo/qux.html']);
        t.deepEquals(getElementUrls(p2_2.data.siblings), ['/foo/bar.html', '/foo/fred/', '/foo/qux.html']);
        t.deepEquals(getElementUrls(p2_3.data.siblings), ['/foo/bar.html', '/foo/fred/', '/foo/qux.html']);
        t.deepEquals(getElementUrls(h.data.children), ['/foo/', '/hello.html']);
        t.deepEquals(getElementUrls(p2.data.children), ['/foo/bar.html', '/foo/fred/', '/foo/qux.html']);
        t.deepEquals(getElementUrls(p2_3.data.children), ['/foo/fred/bar.html', '/foo/fred/foo/']);
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

test('should use the specified base url', function(t) {
    t.plan(7);

    var options = {
        baseUrl: '/path/to/site'
    };
    var stream = ssg(options);
    var h = mockFile('test/index.html');
    var p1 = mockFile('test/hello.html');
    var p2 = mockFile('test/foo/index.html');
    var p2_1 = mockFile('test/foo/bar.html');

    stream.on('end', function() {
        // Check page URLs
        t.is(h.data.url, '/path/to/site/');
        t.is(p1.data.url, '/path/to/site/hello.html');
        t.is(p2.data.url, '/path/to/site/foo/');
        t.is(p2_1.data.url, '/path/to/site/foo/bar.html');
        // Check reference to root
        t.is(p2_1.data.root.data.url, '/path/to/site/');
        t.ok(p2_1.data.root.data.children);
        t.is(p2_1.data.root.data.children.length, 2);
    });

    stream.write(h);
    stream.write(p1);
    stream.write(p2);
    stream.write(p2_1);
    stream.end();
});

test('should remove a trailing slash from the specified base url', function(t) {
    t.plan(4);

    var options = {
        baseUrl: '/path/to/site/'
    };
    var stream = ssg(options);
    var h = mockFile('test/index.html');
    var p1 = mockFile('test/hello.html');
    var p2 = mockFile('test/foo/index.html');
    var p2_1 = mockFile('test/foo/bar.html');

    stream.on('end', function() {
        t.is(h.data.url, '/path/to/site/');
        t.is(p1.data.url, '/path/to/site/hello.html');
        t.is(p2.data.url, '/path/to/site/foo/');
        t.is(p2_1.data.url, '/path/to/site/foo/bar.html');
    });

    stream.write(h);
    stream.write(p1);
    stream.write(p2);
    stream.write(p2_1);
    stream.end();
});

test('should sort by url by default', function(t) {
    t.plan(2);

    var stream = ssg();
    var h = mockFile('test/index.html');
    var p1 = mockFile('test/xyz.html');
    var p2 = mockFile('test/abc.html');
    var p3 = mockFile('test/foo/index.html');
    var p3_1 = mockFile('test/foo/10-hello.html', 'child page');
    var p3_2 = mockFile('test/foo/05-goodbye.html', 'child page');

    stream.on('end', function() {
        t.deepEquals(getElementUrls(h.data.children), [
            '/abc.html',
            '/foo/',
            '/xyz.html'
        ]);
        t.deepEquals(getElementUrls(p3.data.children), [
            '/foo/05-goodbye.html',
            '/foo/10-hello.html'
        ]);
    });

    stream.write(h);
    stream.write(p1);
    stream.write(p2);
    stream.write(p3);
    stream.write(p3_1);
    stream.write(p3_2);
    stream.end();
});

test('should sort pages by options.sort', function(t) {
    t.plan(2);

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
        t.deepEquals(getElementUrls(h.data.children), [
            '/xyz.html',
            '/foo/',
            '/def.html',
            '/abc.html'
        ]);
        t.deepEquals(getElementUrls(p4.data.children), [
            '/foo/10-hello.html',
            '/foo/05-goodbye.html'
        ]);
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

test('should not break if there is no root file', function(t) {
    t.plan(6);

    var stream = ssg();
    var p1 = mockFile('test/hello.html');
    var p2 = mockFile('test/foo/index.html');
    var p2_1 = mockFile('test/foo/bar.html');

    stream.on('end', function() {
        t.is(p1.data.root, null);
        t.is(p1.data.siblings[0].data.url, '/foo/');
        t.is(p1.data.siblings[1].data.url, '/hello.html');
        t.is(p2.data.siblings[0].data.url, '/foo/');
        t.is(p2.data.siblings[1].data.url, '/hello.html');
        t.is(p2_1.data.siblings.length, 1);
    });

    stream.write(p1);
    stream.write(p2);
    stream.write(p2_1);
    stream.end();
});

test('should store dirty URL with any index.* intact', function(t) {
    t.plan(4);

    var stream = ssg();
    var h = mockFile('test/index.md');
    var p1 = mockFile('test/hello.xhtml');
    var p2 = mockFile('test/foo/index.htm');
    var p2_1 = mockFile('test/foo/bar.xml');

    stream.on('end', function() {
        t.is(h.data.dirtyUrl, '/index.md');
        t.is(p1.data.dirtyUrl, '/hello.xhtml');
        t.is(p2.data.dirtyUrl, '/foo/index.htm');
        t.is(p2_1.data.dirtyUrl, '/foo/bar.xml');
    });

    stream.write(h);
    stream.write(p1);
    stream.write(p2);
    stream.write(p2_1);
    stream.end();
});
