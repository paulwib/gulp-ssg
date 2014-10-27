gulp-ssg [![NPM version][npm-image]][npm-url] [![Dependency Status][depstat-image]][depstat-url] [![Build Status][travis-image]][travis-url]
===

A [gulp][] plugin to generate a static site.

## Usage

```javascript
var ssg = require('gulp-ssg');
var site = {
    title: 'My site'
};

gulp.task('html', function() {
    return gulp.src('content/**/*.md')
        .pipe(ssg(site))
        .pipe(gulp.dest('public/'));
});
```

This will rename the files so they have pretty URLs e.g.

    content/index.md        -> public/index.html
    content/foo.md          -> public/foo/index.html
    content/bar/index.md    -> public/bar/index.html
    content/bar/hello.md    -> public/bar/hello/index.html

It will also add properties to a `meta` object of each file:

* `file.meta.url`
* `file.meta.isHome`
* `file.meta.isIndex`
* `file.meta.sectionUrl`
* `file.meta.section`

Finally, it will add an `index` property to the passed in `site` object which is a tree of all the content.
The above example would look like:

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

As implied above each file has a reference back to it's section in this tree.

## Example

It gets more interesting when combined with other pipes. For example:

```javascript
var ssg = require('gulp-ssg');
var frontmatter = require('gulp-front-matter');
var marked = require('gulp-marked');
var site = {
    title: 'My site'
};

gulp.task('html', function() {
    return gulp.src('content/**/*.md')
        .pipe(frontmatter({
            property: 'meta'
        }))
        .pipe(marked())
        .pipe(ssg(site, {
            property: 'meta'
        }))
        .pipe(gulp.dest('public/'));
});
```

This will extract any YAML front-matter, convert the content of each file from markdown to HTML, then run the ssg. The data extracted from the front-matter will be combined with the data extracted by the ssg in the `meta` property.

## Templates

A common requirement of static sites is to pass the content through some template engine. There is nothing built into `gulp-ssg` to do this, but it's very easy to add with another pipe.

After the step above you will have created a bunch of HTML files. Now you can run them through a templating pipe. All the files are processed before the next pipe, so the template will have access to the complete site index for things like generating global navigation, or a list of sub-pages in the current section.

So to add this to the above example:

```javascript
var ssg = require('gulp-ssg');
var frontmatter = require('gulp-front-matter');
var marked = require('gulp-marked');
var fs = require('fs');
var es = require('event-stream');
var mustache = require('mustache');
var site = {
    title: 'My site'
};

gulp.task('html', function() {

    var template = String(fs.readFileSync('templates/page.html'));

    return gulp.src('content/**/*.md')
        .pipe(frontmatter({
            property: 'meta'
        }))
        .pipe(marked())
        .pipe(ssg(site, {
            property: 'meta'
        }))
        .pipe(es.map(function(file, cb) {
            var html = mustache.render(template, {
                page: file.meta,
                site: site,
                content: String(file.contents)
            });
            file.contents = new Buffer(html);
            cb(null, file);
        }))
        .pipe(gulp.dest('public/'));
});
```

This uses `es.map` to modify the stream directly, but if you have a common way of rendering many sites it might be worth writing a little plug-in with a bit more error handling etc.

## Caveats

* Each directory *must* contain a file with a base name of `index` (e.g. `index.md`) to have the site index fully traversed.

## Options

### baseUrl `string`

The base URL of the site, defaults to '/'. This should be the path to where your site will eventually be deployed.

### sort `string`

A property to sort pages by in the index, defaults to `url`. For example, this could be a property like `order` extracted from the YAML front-matter, giving content editors full control over the order of pages.

### property `string`

The name of the property to attach data to, defaults to `meta`.

### sectionProperties `array`

A list of properties to extract from index pages to add to the section, defaults to an empty list. For example, you could add a `sectionTitle` to front-matter in your `index.md` files, then use this it for link text in your global navigation.

## Previewing Your Website

Add a `watch` task to run a server for previewing your website:

```javascript
var http = require('http'),
	ecstatic = require('ecstatic');

gulp.task('watch', function() {
	http.createServer(
        ecstatic({ root: __dirname + '/public'  })
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
