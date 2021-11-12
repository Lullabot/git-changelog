#!/usr/local/bin/node
"use strict";

/**
 * Object to wrap strings in markdown format.
 * @type {object}
 */
const Markdown = {
    bold: str => "**" + str + "**",
    italic: str => "_" + str + "_",
    h1: str => "# " + str,
    h2: str => "## " + str,
    h3: str => "### " + str,
    h4: str => "#### " + str,
    link: (str, url) => `[${str}](${url})`,
    encodeHtml: str => str.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
};

/**
 * Also include string prototype shortcuts.
 */
String.prototype.h1 = function () {
    return Markdown.h1(this);
}
String.prototype.h2 = function () {
    return Markdown.h2(this);
}
String.prototype.h3 = function () {
    return Markdown.h3(this);
}
String.prototype.h4 = function () {
    return Markdown.h4(this);
}
String.prototype.link = function (url) {
    return Markdown.link(this, url);
}
String.prototype.bold = function () {
    return Markdown.bold(this);
}
String.prototype.italic = function() {
    return Markdown.italic(this);
}
String.prototype.encodeHtml = function () {
    return Markdown.encodeHtml(this);
}
module.exports = Markdown;