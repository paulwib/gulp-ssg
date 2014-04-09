'use strict';

var through = require('through');
var os = require('os');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;
var _ = require('lodash');
var path = require('path');

/**
 * Convert text files to a website with nice urls, extra file meta-data and
 * provide a tree style index of the content.
 *
 * @param object site                       The site to attach the indexes to
 * @param array options.baseUrl             The base url of the final site
 * @param array options.sort                The property to sort by
 * @param array options.property            The property to attach to the file, defaults to `meta`
 * @param array options.sectionProperties   List of properties to copy from index file to section
 * @return stream
 */
module.exports = function(site, options) {
    options = _.extend({
        baseUrl: '',
        sort: 'url',
        property: 'meta',
        sectionProperties: [],
        prettyUrls: true
    }, options || {});

    var buffer = [];

    return through(bufferContents, endStream);

    /**
     * Rename each file and add meta properties:
     *  - isHome
     *  - isIndex
     *  - url
     *  - sectionUrl
     *
     * @param object file
     */
    function bufferContents(file) {
        if (typeof options.property !== 'string' || !options.property) {
            return this.emit('error', new PluginError('gulp-ssg',  'options.property is required'));
        }
        if (file.isNull()) {
            return;
        }
        if (file.isStream()) {
            return this.emit('error', new PluginError('gulp-ssg',  'Streaming not supported'));
        }
        var basename = path.basename(file.relative, path.extname(file.path)),
            isIndex = basename === 'index',
            originalDir = rename(file),
            isHome = isIndex && originalDir === '.',
            fileUrl = isHome ? options.baseUrl + '/' : url(file, options.baseUrl);

        file[options.property] = _.extend({
            name: basename,
            isIndex: isIndex,
            isHome: isHome,
            url: fileUrl,
            sectionUrl: sectionUrl(fileUrl, isIndex)
        }, file[options.property] || {});

        buffer.push(file);
    }

    /**
     * At the end of the stream build the site index, sort, then emit the file data.
     * This ensures the full index is built before the next pipe sees the file.
     */
    function endStream() {
        if (buffer.length === 0) {
            return this.emit('end');
        }

        if (options.sort) {
            buffer.sort(function(a, b) {
                var aDepth = a.meta.url.split('/').length;
                var bDepth = b.meta.url.split('/').length;
                if (aDepth < bDepth) {
                    return -1;
                }
                if (bDepth < aDepth) {
                    return 1;
                }
                if (a.isIndex) {
                    return -1;
                }

                return a[options.property][options.sort] >= b[options.property][options.sort] ? 1 : -1;
            });
        }

        site.index = treeify(options.baseUrl, buffer);
        addSectionToFiles(site.index);

        buffer.forEach(function(file) {
            this.emit('data', file);
        }.bind(this));

        this.emit('end');
    }

    /**
     * Copy options.sectionProperties from file meta to section
     *
     * @param object meta
     * @return object
     */
    function copySectionProperties(meta) {
        if (typeof options.sectionProperties.forEach !== 'function') {
            return;
        }
        var props = {};
        options.sectionProperties.forEach(function(prop) {
            if (typeof meta[prop] !== 'undefined') {
                props[prop] = meta[prop];
            }
        });

        return props;
    }

    /**
     * Converts flat files into a tree structure of sections
     *
     * @param string baseUrl
     * @return object
     */
    function treeify(baseUrl) {
        var currentList,
            foundAtIndex,
            meta,
            baseUrlReplace = new RegExp('^' + baseUrl),
            sectionsToFiles = mapSectionsToFiles(buffer),
            contentTree = {
                sections: [],
                files: sectionsToFiles[baseUrl + '/']
            };

        buffer.forEach(function(file) {
            meta = file[options.property];

            if (meta.isHome) {
                contentTree.name = 'root';
                contentTree.url = meta.url;
                contentTree = _.extend(contentTree, copySectionProperties(meta));
                return;
            }

            if (!meta.isIndex) {
                return;
            }

            currentList = contentTree.sections;
            meta.url.replace(baseUrlReplace, '').split('/').filter(function(t) {
                return t !== '';
            }).forEach(function(token, index) {
                foundAtIndex = -1;

                currentList.forEach(function(item, index) {
                    if (item.name === token) {
                        foundAtIndex = index;
                        currentList = currentList[index].sections;
                    }
                });

                if (foundAtIndex === -1) {
                    currentList.push(_.extend({
                        name: token,
                        url: meta.url,
                        sections: [],
                        files: sectionsToFiles[meta.sectionUrl]
                    }, copySectionProperties(meta)));

                    currentList = currentList[currentList.length-1].sections;
                }
            });
        });

        return contentTree;
    }

    /**
     * Map each section URL to a list of files
     *
     * @return object
     */
    function mapSectionsToFiles() {
        var map = {}, meta;
        buffer.forEach(function(file) {
            meta = file[options.property];
            if (typeof map[meta.sectionUrl] === 'undefined') {
                map[meta.sectionUrl] = [];
            }
            map[meta.sectionUrl].push(file);
        });

        return map;
    }

    /**
     * Give each file meta a reference back to it's section
     *
     * @param object index The content tree
     */
    function addSectionToFiles(index) {
        if (!index.files.length) {
            return;
        }
        index.files.forEach(function(file) {
            file[options.property].section = index;
            if (!index.sections.length) {
                return;
            }
        });
        // Recurse over nested sections
        index.sections.forEach(function(section) {
            addSectionToFiles(section);
        });
    }

    /**
     * Rename the file to path/to/index.html
     *
     * @param object file
     * @return string The original directory name
     */
    function rename(file) {
        var dirname = path.dirname(file.relative),
            basename = path.basename(file.relative, path.extname(file.relative));

        if (options.prettyUrls)
        {
            file.path = file.base +
                (basename !== 'index' ? dirname + '/' + basename : dirname) +
                '/index.html';            
        }
        else {
            file.path = file.base + dirname + '/' + file.relative;
        }


        return dirname;
    }

    /**
     * Generate URL from renamed path
     *
     * @param object file
     * @param string baseUrl
     * @return string url
     */
    function url(file, baseUrl) {
        return baseUrl + '/' + path.dirname(file.relative).replace(/^\.\//, '') + '/';
    }

    /**
     * Generate a section URL from file url
     *
     * @param object file
     * @return string url
     */
    function sectionUrl(url, isIndex) {
        return isIndex ? url : url.split('/').slice(0, -2).join('/') + '/';
    }

};
