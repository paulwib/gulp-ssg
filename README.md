gulp-ssg [![NPM version][npm-image]][npm-url] [![Dependency Status][depstat-image]][depstat-url] [![Build Status][travis-image]][travis-url]
===

A [gulp][] plugin to generate a static site.

## Usage

```javascript
var ssg = require('gulp-ssg');
var website = {
    title: 'My site'
};

gulp.task('html', function() {
    return gulp.src('content/**/*.md')
        .pipe(ssg(website))
        .pipe(gulp.dest('public/'));
});
```

This will rename the files so they have pretty URLs e.g.

    content/index.md        -> public/index.html
    content/foo.md          -> public/foo/index.html
    content/bar/index.md    -> public/bar/index.html
    content/bar/hello.md    -> public/bar/hello/index.html

It will also add properties to a `data` object of each file:

* `file.data.url`
* `file.data.isHome`
* `file.data.isIndex`
* `file.data.sectionUrl`
* `file.data.section`
* `file.data.website`
* `file.data.website.map`

The `file.data.website` is the original passed in `website` object with an additional `map` property that represents a full tree map of the site, which looks like:

```javascript

    {
        name: 'root',
        url: '/',
        files: [<index.html>, <foo/index.html> ] // All files in this section
        sections: [
            {
                name: 'bar',
                url: 'bar',
                files: [<bar/index.html>, <bar/foo/index.html>]
            }
        ]
    }
```

This can be used for things like generating global navigation. Also each file has a reference back to it's section in the tree, so it's possible to generate sub-navigation too with `file.data.section.files`.


## Example

So how can this be used? It gets more interesting when combined with other pipes. For example:

```javascript
var ssg = require('../');
var gulp = require('gulp');
var data = require('gulp-data');
var fm = require('front-matter');
var marked = require('marked');
var fs = require('fs');
var es = require('event-stream');
var hogan = require('hogan.js');

var website = {
    title: 'My site'
};

gulp.task('html', function() {

    // Compile a template for rendering each page
    var template = hogan.compile(String(fs.readFileSync('templates/template.html')));

    return gulp.src('content/**/*.md')

        // Extract YAML front-matter, convert content to markdown via gulp-data
        .pipe(data(function(file) {
            var content = fm(String(file.contents));
            file.contents = new Buffer(marked(content.body));
            return content.attributes;
        }))

        // Run through gulp-ssg, copy title from YAML to section
        .pipe(ssg(website, { sectionProperties: ['title'] }))

        // Run each file through a template
        .pipe(es.map(function(file, cb) {
            file.contents = new Buffer(template.render(file));
            cb(null, file);
        }))

        // Output to build directory
        .pipe(gulp.dest('build/'));
});

```

This plug-in follows the [gulp-data][] convention of using `file.data`, so anything returned from a `gulp-data` pipe will be merged with the properties above.

## Caveats

* Each directory *must* contain a file with a base name of `index` (e.g. `index.md`) to have the site index fully traversed.

## Options

### baseUrl `string`

The base URL of the site, defaults to '/'. This should be the path to where your site will eventually be deployed.

### sort `string`

A property to sort pages by, defaults to `url`. For example, this could be a property like `order` extracted from the YAML front-matter, giving content editors full control over the order of pages.

### sectionProperties `array`

A list of properties to extract from index pages to add to the section, defaults to an empty list. For example, you could add a `sectionTitle` to front-matter in your `index.md` files, then use this it for link text in your global navigation.

## Previewing Your Website

Add a `watch` task to run a server for previewing your website:

```javascript
var http = require('http'),
	ecstatic = require('ecstatic');

gulp.task('watch', function() {
	http.createServer(
        ecstatic({ root: __dirname + '/build'  })
    ).listen(8745);
    console.log('Preview at http://localhost:8745');

    gulp.watch('content/', ['html']);
    gulp.watch('templates/', ['default']);
});
```

[gulp]:http://gulpjs.com

[npm-url]: https://npmjs.org/package/gulp-ssg
[npm-image]: http://img.shields.io/npm/v/gulp-ssg.svg?style=flat

[depstat-url]: https://david-dm.org/paulwib/gulp-ssg
[depstat-image]: https://david-dm.org/paulwib/gulp-ssg.svg?style=flat

[travis-image]: http://img.shields.io/travis/paulwib/gulp-ssg/master.svg?style=flat
[travis-url]: https://travis-ci.org/paulwib/gulp-ssg
