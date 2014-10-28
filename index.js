'use strict';

var through = require('through');
var os = require('os');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;
var _ = require('lodash');
var path = require('path');

/**
 * Convert text files to a website with nice urls, extra file.data and
 * provide a tree style index of the content.
 *
 * @param object site                       The site to attach the indexes to
 * @param array options.baseUrl             The base url of the final site
 * @param array options.sort                The property to sort by
 * @param array options.sectionProperties   List of properties to copy from index file to section
 * @return stream
 */
module.exports = function(site, options) {
    site = site || {};
    options = _.extend({
        baseUrl: '',
        sort: 'url',
        sectionProperties: []
    }, options || {});

    // remove trailing slash from baseUrl
    if (options.baseUrl && options.baseUrl.length > 1 && options.baseUrl.substr(-1) === '/') {
        options.baseUrl = options.baseUrl.substr(0, options.baseUrl.length - 1);
    }

    var buffer = [];

    return through(bufferContents, endStream);

    /**
     * Rename each file and add data properties:
     *  - isHome
     *  - isIndex
     *  - url
     *  - sectionUrl
     *
     * @param object file
     */
    function bufferContents(file) {
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

        file.data = _.extend({
            website: site,
            name: basename,
            isIndex: isIndex,
            isHome: isHome,
            url: fileUrl,
            sectionUrl: sectionUrl(fileUrl, isIndex)
        }, file.data || {});

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
                var aDepth = a.data.url.split('/').length;
                var bDepth = b.data.url.split('/').length;
                if (aDepth < bDepth) {
                    return -1;
                }
                if (bDepth < aDepth) {
                    return 1;
                }
                if (a.isIndex) {
                    return -1;
                }

                return a.data[options.sort] >= b.data[options.sort] ? 1 : -1;
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
     * Copy options.sectionProperties from file data to section
     *
     * @param object data
     * @return object
     */
    function copySectionProperties(data) {
        if (typeof options.sectionProperties.forEach !== 'function') {
            return;
        }
        var props = {};
        options.sectionProperties.forEach(function(prop) {
            if (typeof data[prop] !== 'undefined') {
                props[prop] = data[prop];
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
            baseUrlReplace = new RegExp('^' + baseUrl),
            sectionsToFiles = mapSectionsToFiles(buffer),
            contentTree = {
                sections: [],
                files: sectionsToFiles[baseUrl + '/']
            };

        buffer.forEach(function(file) {

            if (file.data.isHome) {
                contentTree.name = 'root';
                contentTree.url = file.data.url;
                contentTree = _.extend(contentTree, copySectionProperties(file.data));
                return;
            }

            if (!file.data.isIndex) {
                return;
            }

            currentList = contentTree.sections;
            file.data.url.replace(baseUrlReplace, '').split('/').filter(function(t) {
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
                        url: file.data.url,
                        sections: [],
                        files: sectionsToFiles[file.data.sectionUrl]
                    }, copySectionProperties(file.data)));

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
        var map = {};
        buffer.forEach(function(file) {
            if (typeof map[file.data.sectionUrl] === 'undefined') {
                map[file.data.sectionUrl] = [];
            }
            map[file.data.sectionUrl].push(file);
        });

        return map;
    }

    /**
     * Give each file data a reference back to it's section
     *
     * @param object index The content tree
     */
    function addSectionToFiles(index) {
        if (!index.files.length) {
            return;
        }
        index.files.forEach(function(file) {
            file.data.section = index;
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

        file.path = file.base +
            (basename !== 'index' ? dirname + '/' + basename : dirname) +
            '/index.html';

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
        var dirname = path.dirname(file.relative).replace(/\\/g, '/');
        return baseUrl + '/' + dirname.replace(/^\.\//, '') + '/';
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
